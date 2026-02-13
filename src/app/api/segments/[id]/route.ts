import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Segment from '@/models/Segment';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { User } from "@/models";

interface Params {
  params: Promise<{ id: string }>;
}

// GET single segment
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرّف غير صالح' },
        { status: 400 }
      );
    }
    
    // Verify user role
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
       return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    const segment = await Segment.findById(id)
      .populate('materialId', 'title author')
      .populate('categoryId', 'name');
    
    if (segment) {
       // Strict Access Control for GET
       if (!currentUser.isAdmin) {
          const hasAccess = currentUser.assignedMaterials.some((mId) => mId.toString() === segment.materialId._id.toString());
          if (!hasAccess) {
             return NextResponse.json({ success: false, error: "ممنوع" }, { status: 403 });
          }
       }
    }

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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }
    
    await dbConnect();
    
    // Verify user role
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
       return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرّف غير صالح' },
        { status: 400 }
      );
    }

    // Check existence and permission BEFORE update
    const existingSegment = await Segment.findById(id);
    if (!existingSegment) {
      return NextResponse.json({ success: false, error: 'الفقرة غير موجودة' }, { status: 404 });
    }

    // Strict Access Control for PUT
    if (!currentUser.isAdmin) {
       // Check access to the *current* material of the segment
       const hasAccessToCurrent = currentUser.assignedMaterials.some((mId) => mId.toString() === existingSegment.materialId.toString());
       if (!hasAccessToCurrent) {
          return NextResponse.json({ success: false, error: "ممنوع" }, { status: 403 });
       }
       
       // If trying to move to another material, check access to *target* material
       if (body.materialId && body.materialId !== existingSegment.materialId.toString()) {
          const hasAccessToTarget = currentUser.assignedMaterials.some((mId) => mId.toString() === body.materialId);
          if (!hasAccessToTarget) {
             return NextResponse.json({ success: false, error: "ممنوع - Cannot move to unassigned material" }, { status: 403 });
          }
       }
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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    await dbConnect();
    
    // Verify user role
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
       return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرّف غير صالح' },
        { status: 400 }
      );
    }

    // Check existence and permission BEFORE delete
    const existingSegment = await Segment.findById(id);
    if (!existingSegment) {
      return NextResponse.json({ success: false, error: 'الفقرة غير موجودة' }, { status: 404 });
    }

    // Strict Access Control for DELETE
    if (!currentUser.isAdmin) {
       const hasAccess = currentUser.assignedMaterials.some((mId) => mId.toString() === existingSegment.materialId.toString());
       if (!hasAccess) {
          return NextResponse.json({ success: false, error: "ممنوع" }, { status: 403 });
       }
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
