import { DashboardShell } from "@/components/dashboard/DashboardShell";

import { getMaterials } from "@/lib/data";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const materials = await getMaterials();

  return (
    <DashboardShell initialMaterials={materials}>{children}</DashboardShell>
  );
}
