import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { User } from "@/models";

// GET all categories (as tree or flat)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    if (format === 'tree') {
      const tree = await Category.buildTree();
      return NextResponse.json({ success: true, data: tree });
    }

    const categories = await Category.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيفات' },
      { status: 500 }
    );
  }
}

// POST create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    await dbConnect();

    // Verify user role
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || (!currentUser.isAdmin && !currentUser.canEditCategories)) {
       return NextResponse.json(
        { success: false, error: "غير مصرح لك بإنشاء تصنيفات" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const category = await Category.create({
      name: body.name,
      parentId: body.parentId || null,
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء التصنيف' },
      { status: 500 }
    );
  }
}
