import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Segment, Material } from '@/models';

// PATCH - Reorder segments for a material
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(materialId)) {
      return NextResponse.json(
        { success: false, error: 'معرّف غير صالح' },
        { status: 400 }
      );
    }

    // Verify material exists
    const material = await Material.findById(materialId);
    if (!material) {
      return NextResponse.json(
        { success: false, error: 'المادة غير موجودة' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { orderedIds } = body as { orderedIds: string[] };

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'يجب تقديم قائمة المعرّفات المرتبة' },
        { status: 400 }
      );
    }

    // Validate all IDs are valid ObjectIds
    const validIds = orderedIds.every((id) => mongoose.Types.ObjectId.isValid(id));
    if (!validIds) {
      return NextResponse.json(
        { success: false, error: 'بعض المعرّفات غير صالحة' },
        { status: 400 }
      );
    }

    // Bulk update orderIndex for each segment
    const bulkOps = orderedIds.map((segmentId, index) => ({
      updateOne: {
        filter: {
          _id: new mongoose.Types.ObjectId(segmentId),
          materialId: new mongoose.Types.ObjectId(materialId),
        },
        update: { $set: { orderIndex: index } },
      },
    }));

    const result = await Segment.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      },
    });
  } catch (error) {
    console.error('Reorder error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء إعادة الترتيب' },
      { status: 500 }
    );
  }
}
