import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Types } from "mongoose";
import Material from '@/models/Material';
import Segment from '@/models/Segment';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { User } from "@/models";

interface Params {
  params: Promise<{ id: string }>;
}

// GET single material
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرّف غير صالح' },
        { status: 400 }
      );
    }

    // Check access
    // Verify user and get fresh permissions
    // We need to fetch the User model if not already imported? It is not imported in this file.
    // Wait, User is not imported. I need to add import { User } from "@/models";
    // I cannot add import here easily. I should do a separate replace for imports.
    // For now assuming I will add import.
    
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
       return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    // Check access
    // Check access
    if (!currentUser.isAdmin) {
       const hasAccess = currentUser.assignedMaterials.some((m: Types.ObjectId) => m.toString() === id);
       if (!hasAccess) {
         return NextResponse.json({ success: false, error: "ممنوع" }, { status: 403 });
       }
    }

    const material = await Material.findById(id);

    if (!material) {
      return NextResponse.json(
        { success: false, error: 'المادة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: material });
  } catch (error) {
    console.error('Error fetching material:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المادة' },
      { status: 500 }
    );
  }
}

// PUT update material
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    await dbConnect();
    
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || !currentUser.isAdmin) {
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

    const material = await Material.findByIdAndUpdate(
      id,
      { title: body.title, author: body.author },
      { new: true, runValidators: true }
    );

    if (!material) {
      return NextResponse.json(
        { success: false, error: 'المادة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: material });
  } catch (error) {
    console.error('Error updating material:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث المادة' },
      { status: 500 }
    );
  }
}

// DELETE material
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
       return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    await dbConnect();
    
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || !currentUser.isAdmin) {
       return NextResponse.json({ success: false, error: "ممنوع" }, { status: 403 });
    }
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرّف غير صالح' },
        { status: 400 }
      );
    }

    // Delete all segments related to this material
    await Segment.deleteMany({ materialId: id });

    // Delete the material
    const material = await Material.findByIdAndDelete(id);

    if (!material) {
      return NextResponse.json(
        { success: false, error: 'المادة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف المادة وجميع الفقرات المرتبطة بها بنجاح',
      data: material 
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف المادة والفقرات المرتبطة بها' },
      { status: 500 }
    );
  }
}
