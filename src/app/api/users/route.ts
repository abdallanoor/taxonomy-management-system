import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models";
import bcrypt from "bcryptjs";

// GET: List all users (Admin only)
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  await dbConnect();

  // Verify admin status from database
  const currentUser = await User.findById(session.user.id);
  if (!currentUser || !currentUser.isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const users = await User.find({}, "-password").sort({ createdAt: -1 });

  return NextResponse.json(users);
}

// POST: Create a new user (Admin only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

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
    const { username, password, isAdmin, canEditCategories, assignedMaterials } =
      await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "اسم المستخدم وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }


    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { error: "اسم المستخدم مستخدم بالفعل" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      username,
      password: hashedPassword,
      isAdmin: isAdmin || false,
      canEditCategories: canEditCategories || false,
      assignedMaterials: assignedMaterials || [],
    });

    await newUser.save();

    // Return user without password
    const userObj = newUser.toObject();
    delete userObj.password;

    return NextResponse.json(userObj, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء المستخدم" },
      { status: 500 }
    );
  }
}
