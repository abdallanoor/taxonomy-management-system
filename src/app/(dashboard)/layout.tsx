import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMaterials } from "@/lib/data";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  let filter = {};
  if (session && !session.user.isAdmin) {
    // If not admin, filter by assigned materials
    filter = { _id: { $in: session.user.assignedMaterials } };
  }

  const materials = await getMaterials(filter);

  return (
    <DashboardShell initialMaterials={materials}>{children}</DashboardShell>
  );
}
