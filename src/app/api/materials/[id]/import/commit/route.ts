import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { analyzeMaterialImport, ImportFileError, parseMaterialImportFile } from "@/lib/material-import";
import { Material, Segment, User } from "@/models";

export const runtime = "nodejs";

function parseSelectedRows(value: FormDataEntryValue | null): Set<number> {
  if (typeof value !== "string") return new Set();
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((row): row is number => Number.isInteger(row) && row > 0));
  } catch {
    return new Set();
  }
}

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
    const previewFingerprint = formData.get("fingerprint");
    if (!(file instanceof File) || typeof previewFingerprint !== "string") {
      return NextResponse.json({ success: false, error: "بيانات التأكيد غير مكتملة" }, { status: 400 });
    }

    const parsed = await parseMaterialImportFile(file);
    const existingSegments = await Segment.find({ materialId })
      .select("content pageNumber order createdAt")
      .lean();
    const analysis = analyzeMaterialImport(parsed, existingSegments);
    if (analysis.fingerprint !== previewFingerprint) {
      return NextResponse.json(
        { success: false, code: "STALE_PREVIEW", error: "تغيرت بيانات المادة؛ حلّل الملف مرة أخرى قبل التأكيد" },
        { status: 409 },
      );
    }

    const selectedDuplicateRows = parseSelectedRows(formData.get("duplicateRowNumbers"));
    const selectedDuplicateCount = analysis.duplicateRows.filter((row) =>
      selectedDuplicateRows.has(row.rowNumber),
    ).length;
    const rowsToInsert = [
      ...analysis.newRows,
      ...analysis.duplicateRows.filter((row) => selectedDuplicateRows.has(row.rowNumber)),
    ].sort((a, b) => a.rowNumber - b.rowNumber);

    const existingOrderByPage = new Map<number, number>();
    for (const segment of existingSegments) {
      const effectiveOrder = segment.order ?? new Date(segment.createdAt).getTime();
      existingOrderByPage.set(
        segment.pageNumber,
        Math.max(existingOrderByPage.get(segment.pageNumber) ?? Number.MIN_SAFE_INTEGER, effectiveOrder),
      );
    }

    const nextOrderByPage = new Map<number, number>();
    const now = Date.now();
    const documents = rowsToInsert.map((row) => {
      const nextOrder = nextOrderByPage.get(row.pageNumber) ?? Math.max(now, (existingOrderByPage.get(row.pageNumber) ?? now - 1) + 1);
      nextOrderByPage.set(row.pageNumber, nextOrder + 1);
      return {
        materialId,
        content: row.content,
        pageNumber: row.pageNumber,
        categoryId: null,
        order: nextOrder,
      };
    });

    if (documents.length > 0) await Segment.insertMany(documents, { ordered: true });

    return NextResponse.json({
      success: true,
      data: {
        added: documents.length,
        skippedDuplicates: analysis.duplicateRows.length - selectedDuplicateCount,
        invalidRows: analysis.invalidRows.length,
      },
    });
  } catch (error) {
    if (error instanceof ImportFileError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("Material import commit error:", error);
    return NextResponse.json({ success: false, error: "فشل استيراد الفقرات" }, { status: 500 });
  }
}
