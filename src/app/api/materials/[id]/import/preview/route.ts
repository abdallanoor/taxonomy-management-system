import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { analyzeMaterialImport, ImportFileError, parseMaterialImportFile } from "@/lib/material-import";
import { Material, Segment, User } from "@/models";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });

    const { id: materialId } = await params;
    if (!mongoose.Types.ObjectId.isValid(materialId)) {
      return NextResponse.json({ success: false, error: "معرّف غير صالح" }, { status: 400 });
    }

    await dbConnect();
    const [currentUser, material] = await Promise.all([
      User.findById(session.user.id).lean(),
      Material.findById(materialId).lean(),
    ]);
    if (!currentUser) return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    if (!material) return NextResponse.json({ success: false, error: "المادة غير موجودة" }, { status: 404 });
    if (!currentUser.isAdmin && !currentUser.assignedMaterials.some((id) => id.toString() === materialId)) {
      return NextResponse.json({ success: false, error: "ممنوع" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "يرجى اختيار ملف Excel" }, { status: 400 });
    }

    const parsed = await parseMaterialImportFile(file);
    const existingSegments = await Segment.find({ materialId })
      .select("content pageNumber")
      .lean();
    const analysis = analyzeMaterialImport(parsed, existingSegments);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRows: analysis.totalRows,
          newRows: analysis.newRows.length,
          duplicateRows: analysis.duplicateRows.length,
          invalidRows: analysis.invalidRows.length,
        },
        duplicateRows: analysis.duplicateRows,
        invalidRows: analysis.invalidRows,
        fingerprint: analysis.fingerprint,
      },
    });
  } catch (error) {
    if (error instanceof ImportFileError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("Material import preview error:", error);
    return NextResponse.json({ success: false, error: "فشل تحليل ملف الاستيراد" }, { status: 500 });
  }
}
