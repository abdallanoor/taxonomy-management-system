import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models";
import bcrypt from "bcryptjs";

// PATCH: Update user permissions/materials (Admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;

  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  await dbConnect();

  // Verify admin status from database
  const currentUser = await User.findById(session.user.id);
  if (!currentUser || !currentUser.isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const { password, isAdmin, canEditCategories, assignedMaterials } =
      await req.json();

    const updateData: {
      isAdmin: boolean;
      canEditCategories: boolean;
      assignedMaterials: string[];
      password?: string;
    } = {
      isAdmin,
      canEditCategories,
      assignedMaterials,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(
      resolvedParams.id,
      updateData,
      {
        new: true,
        select: "-password",
      }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث المستخدم" },
      { status: 500 }
    );
  }
}

// DELETE: Remove user (Admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;

  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  await dbConnect();

  // Verify admin status from database
  const currentUser = await User.findById(session.user.id);
  if (!currentUser || !currentUser.isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(resolvedParams.id);

    if (!deletedUser) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "تم حذف المستخدم بنجاح" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المستخدم" },
      { status: 500 }
    );
  }
}
