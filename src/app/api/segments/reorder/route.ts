import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Segment from "@/models/Segment";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { User } from "@/models";

/**
 * POST /api/segments/reorder
 * Body: { segmentAId: string, segmentBId: string }
 * Swaps the 'order' values of two segments that belong to the same page.
 * Used to move a segment up or down within its page.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "غير مصرح" },
        { status: 401 }
      );
    }

    await dbConnect();

    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "غير مصرح" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { segmentAId, segmentBId } = body;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(segmentAId) ||
      !mongoose.Types.ObjectId.isValid(segmentBId)
    ) {
      return NextResponse.json(
        { success: false, error: "معرّفات غير صالحة" },
        { status: 400 }
      );
    }

    // Fetch both segments
    const [segA, segB] = await Promise.all([
      Segment.findById(segmentAId).lean(),
      Segment.findById(segmentBId).lean(),
    ]);

    if (!segA || !segB) {
      return NextResponse.json(
        { success: false, error: "إحدى الفقرتين غير موجودة" },
        { status: 404 }
      );
    }

    // Both must belong to the same material
    if (segA.materialId.toString() !== segB.materialId.toString()) {
      return NextResponse.json(
        { success: false, error: "الفقرتان تنتميان لمواد مختلفة" },
        { status: 400 }
      );
    }

    // Both must be on the same page
    if (segA.pageNumber !== segB.pageNumber) {
      return NextResponse.json(
        { success: false, error: "الفقرتان في صفحات مختلفة" },
        { status: 400 }
      );
    }

    // Access control
    if (!currentUser.isAdmin) {
      const hasAccess = currentUser.assignedMaterials.some(
        (mId: mongoose.Types.ObjectId) =>
          mId.toString() === segA.materialId.toString()
      );
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: "ممنوع" },
          { status: 403 }
        );
      }
    }

    // Compute effective order for each (null → use createdAt timestamp as fallback)
    const getEffectiveOrder = (seg: { order?: number | null; createdAt?: Date }) =>
      seg.order != null ? seg.order : (seg.createdAt?.getTime() ?? 0);

    const orderA = getEffectiveOrder(segA as { order?: number | null; createdAt?: Date });
    const orderB = getEffectiveOrder(segB as { order?: number | null; createdAt?: Date });

    // Swap order values
    await Promise.all([
      Segment.findByIdAndUpdate(segmentAId, { order: orderB }),
      Segment.findByIdAndUpdate(segmentBId, { order: orderA }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering segments:", error);
    return NextResponse.json(
      { success: false, error: "فشل في إعادة الترتيب" },
      { status: 500 }
    );
  }
}
