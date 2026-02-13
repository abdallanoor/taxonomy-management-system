import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { PreviewClient } from "@/components/materials/PreviewClient";
import { getCategoriesTree, getMaterialWithSegments } from "@/lib/data";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Verify access with fresh DB data to ensure immediate effect of role changes
  await dbConnect();
  const currentUser = await User.findById(session.user.id);

  if (!currentUser) {
    redirect("/login");
  }

  // Check authorization
  // If not admin AND not assigned to this material
  const hasAccess =
    currentUser.isAdmin ||
    currentUser.assignedMaterials.some(
      (mId: Types.ObjectId) => mId.toString() === id,
    );

  if (!hasAccess) {
    // Return "No Data" UI as requested
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">لا يوجد بيانات</h2>
        <p className="text-muted-foreground">
          ليس لديك صلاحية للوصول إلى هذه المادة.
        </p>
      </div>
    );
  }

  // Fetch material and its segments directly from DB
  const data = await getMaterialWithSegments(id);

  if (!data) {
    notFound();
  }

  // Fetch Category Tree for the selector
  const categories = await getCategoriesTree();

  return (
    <PreviewClient
      material={data.material}
      initialSegments={data.segments}
      categories={categories}
    />
  );
}
