import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import Segment from '@/models/Segment';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { User } from "@/models";

interface Params {
  params: Promise<{ id: string }>;
}

// GET single category with path
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

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    // Get full path
    const path = await Category.getCategoryPath(new mongoose.Types.ObjectId(id));

    return NextResponse.json({
      success: true,
      data: {
        ...category.toObject(),
        path: path.map((p) => ({ _id: p._id, name: p.name })),
      },
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيف' },
      { status: 500 }
    );
  }
}

// PUT update category
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }
    
    await dbConnect();

    // Verify user role
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || (!currentUser.isAdmin && !currentUser.canEditCategories)) {
       return NextResponse.json({ success: false, error: "ممنوع" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرّف غير صالح' },
        { status: 400 }
      );
    }

    // Prevent setting self as parent
    if (body.parentId && body.parentId === id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن أن يكون التصنيف أباً لنفسه' },
        { status: 400 }
      );
    }

    // Prevent circular reference
    if (body.parentId) {
      const path = await Category.getCategoryPath(new mongoose.Types.ObjectId(body.parentId));
      if (path.some((p) => p._id.toString() === id)) {
        return NextResponse.json(
          { success: false, error: 'لا يمكن نقل التصنيف لأحد أبنائه' },
          { status: 400 }
        );
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        name: body.name,
        parentId: body.parentId || null,
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث التصنيف' },
      { status: 500 }
    );
  }
}

// DELETE category
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    await dbConnect();

    // Verify user role
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || (!currentUser.isAdmin && !currentUser.canEditCategories)) {
       return NextResponse.json({ success: false, error: "ممنوع" }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرّف غير صالح' },
        { status: 400 }
      );
    }

    // Check for child categories
    const childCount = await Category.countDocuments({ parentId: id });
    if (childCount > 0) {
      return NextResponse.json(
        { success: false, error: `لا يمكن حذف التصنيف لأنه يحتوي على ${childCount} تصنيف فرعي` },
        { status: 400 }
      );
    }

    // Check for segments using this category
    const segmentCount = await Segment.countDocuments({ categoryId: id });
    if (segmentCount > 0) {
      return NextResponse.json(
        { success: false, error: `لا يمكن حذف التصنيف لأنه مستخدم في ${segmentCount} فقرة` },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف التصنيف' },
      { status: 500 }
    );
  }
}
