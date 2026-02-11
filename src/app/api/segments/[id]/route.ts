import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Segment from '@/models/Segment';
import mongoose from 'mongoose';

interface Params {
  params: Promise<{ id: string }>;
}

// GET single segment
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرّف غير صالح' },
        { status: 400 }
      );
    }

    const segment = await Segment.findById(id)
      .populate('materialId', 'title author')
      .populate('categoryId', 'name');

    if (!segment) {
      return NextResponse.json(
        { success: false, error: 'الفقرة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: segment });
  } catch (error) {
    console.error('Error fetching segment:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الفقرة' },
      { status: 500 }
    );
  }
}

// PUT update segment
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرّف غير صالح' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.content !== undefined) updateData.content = body.content;
    if (body.pageNumber !== undefined) updateData.pageNumber = body.pageNumber;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.materialId !== undefined) updateData.materialId = body.materialId;

    const segment = await Segment.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('materialId', 'title author')
      .populate('categoryId', 'name');

    if (!segment) {
      return NextResponse.json(
        { success: false, error: 'الفقرة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: segment });
  } catch (error) {
    console.error('Error updating segment:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الفقرة' },
      { status: 500 }
    );
  }
}

// DELETE segment
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرّف غير صالح' },
        { status: 400 }
      );
    }

    const segment = await Segment.findByIdAndDelete(id);

    if (!segment) {
      return NextResponse.json(
        { success: false, error: 'الفقرة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: segment });
  } catch (error) {
    console.error('Error deleting segment:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الفقرة' },
      { status: 500 }
    );
  }
}
