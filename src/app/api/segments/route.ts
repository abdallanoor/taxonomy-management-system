import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Segment from '@/models/Segment';
import Material from '@/models/Material';
import Category from '@/models/Category';
import mongoose from 'mongoose';

// GET all segments with filters
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('materialId');
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: Record<string, unknown> = {};
    
    if (materialId && mongoose.Types.ObjectId.isValid(materialId)) {
      query.materialId = materialId;
    }
    
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.categoryId = categoryId;
    }

    const total = await Segment.countDocuments(query);
    const segments = await Segment.find(query)
      .populate('materialId', 'title author')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: segments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الفقرات' },
      { status: 500 }
    );
  }
}

// POST create new segment
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    // Validate material exists
    if (!mongoose.Types.ObjectId.isValid(body.materialId)) {
      return NextResponse.json(
        { success: false, error: 'معرّف المادة غير صالح' },
        { status: 400 }
      );
    }
    const material = await Material.findById(body.materialId);
    if (!material) {
      return NextResponse.json(
        { success: false, error: 'المادة غير موجودة' },
        { status: 404 }
      );
    }

    // Validate category exists (optional for draft)
    if (body.categoryId) {
      if (!mongoose.Types.ObjectId.isValid(body.categoryId)) {
        return NextResponse.json(
          { success: false, error: 'معرّف التصنيف غير صالح' },
          { status: 400 }
        );
      }
      const category = await Category.findById(body.categoryId);
      if (!category) {
        return NextResponse.json(
          { success: false, error: 'التصنيف غير موجود' },
          { status: 404 }
        );
      }
    }

    // Auto-assign orderIndex: append to end
    const maxOrderSegment = await Segment.findOne({ materialId: body.materialId })
      .sort({ orderIndex: -1 })
      .select('orderIndex')
      .lean();
    const nextOrderIndex = (maxOrderSegment?.orderIndex ?? -1) + 1;

    const segment = await Segment.create({
      materialId: body.materialId,
      content: body.content,
      pageNumber: body.pageNumber,
      orderIndex: nextOrderIndex,
      categoryId: body.categoryId || null, // Allow null if not provided
    });

    // Populate the response
    const populatedSegment = await Segment.findById(segment._id)
      .populate('materialId', 'title author')
      .populate('categoryId', 'name');

    return NextResponse.json({ success: true, data: populatedSegment }, { status: 201 });
  } catch (error) {
    console.error('Error creating segment:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الفقرة' },
      { status: 500 }
    );
  }
}
