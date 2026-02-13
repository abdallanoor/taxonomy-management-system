import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Material from '@/models/Material';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { User } from "@/models";

// GET all materials (filtered by user access)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    await dbConnect();

    // Verify user and get fresh permissions
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
       return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }
    
    let query = {};
    if (!currentUser.isAdmin) {
      // If not admin, filter by assigned materials
      query = { _id: { $in: currentUser.assignedMaterials } };
    }

    const materials = await Material.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المواد' },
      { status: 500 }
    );
  }
}

// POST create new material
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    await dbConnect();
    
    // Verify admin status from database
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بإنشاء مواد" },
        { status: 403 }
      );
    }
    const body = await request.json();
    
    const material = await Material.create({
      title: body.title,
      author: body.author,
    });

    return NextResponse.json({ success: true, data: material }, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء المادة' },
      { status: 500 }
    );
  }
}
