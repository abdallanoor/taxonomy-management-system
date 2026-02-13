import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Segment from '@/models/Segment';
import Material from '@/models/Material';
import Category from '@/models/Category';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { User } from "@/models";

// GET all segments with filters
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    // Verify user role
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
       return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    const materialId = searchParams.get('materialId');
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: Record<string, unknown> = {};
    
    // Strict Access Control for GET
    if (!currentUser.isAdmin) {
      // If user provides a materialId, verify they have access to it
      if (materialId) {
         if (!currentUser.assignedMaterials.some((id) => id.toString() === materialId)) {
            return NextResponse.json({ success: false, error: "ممنوع" }, { status: 403 });
         }
         query.materialId = materialId;
      } else {
         // If no materialId provided, constrain query to ONLY assigned materials
         query.materialId = { $in: currentUser.assignedMaterials };
      }
    } else {
      // Admin can filter by any materialId if provided
      if (materialId && mongoose.Types.ObjectId.isValid(materialId)) {
        query.materialId = materialId;
      }
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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Verify user role
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
       return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    // Validate material exists and user has access
    if (!mongoose.Types.ObjectId.isValid(body.materialId)) {
      return NextResponse.json(
        { success: false, error: 'معرّف المادة غير صالح' },
        { status: 400 }
      );
    }

    // Strict Access Control for POST
    if (!currentUser.isAdmin) {
       const hasAccess = currentUser.assignedMaterials.some((id) => id.toString() === body.materialId);
       if (!hasAccess) {
          return NextResponse.json({ success: false, error: "ممنوع" }, { status: 403 });
       }
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

    const segment = await Segment.create({
      materialId: body.materialId,
      content: body.content,
      pageNumber: body.pageNumber,
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
