import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { User } from "@/models";

// POST - bulk create categories
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    await dbConnect();

    const currentUser = await User.findById(session.user.id);
    if (!currentUser || (!currentUser.isAdmin && !currentUser.canEditCategories)) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بإنشاء تصنيفات" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { categories } = body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { success: false, error: "يرجى إرسال قائمة التصنيفات" },
        { status: 400 }
      );
    }

    // Validate all names
    const invalid = categories.find((c: { name: string }) => !c.name || !c.name.trim());
    if (invalid) {
      return NextResponse.json(
        { success: false, error: "جميع أسماء التصنيفات يجب أن تكون غير فارغة" },
        { status: 400 }
      );
    }

    // Use insertMany for fast bulk insertion (ordered: false to continue on duplicate)
    const docs = categories.map((c: { name: string; parentId?: string | null }) => ({
      name: c.name.trim(),
      parentId: c.parentId || null,
    }));

    const result = await Category.insertMany(docs, { ordered: false });

    return NextResponse.json(
      { success: true, data: result, count: result.length },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error bulk creating categories:', error);
    // Handle duplicate key errors (ordered: false continues but throws at end)
    if (
      error instanceof Error &&
      'code' in error &&
      (error as Error & { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { success: false, error: "بعض التصنيفات مكررة أو موجودة مسبقاً" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء التصنيفات' },
      { status: 500 }
    );
  }
}
