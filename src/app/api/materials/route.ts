import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Material from '@/models/Material';

// GET all materials
export async function GET() {
  try {
    await dbConnect();
    const materials = await Material.find({}).sort({ createdAt: -1 });
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
    await dbConnect();
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
