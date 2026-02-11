import { notFound } from "next/navigation";
import { PreviewClient } from "@/components/materials/preview/PreviewClient";
import { getCategoriesTree } from "@/lib/data";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch materials segments via API (for consistency with previous step)
  const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${host}/api/materials/${id}/segments`, {
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) notFound();
    throw new Error("Failed to fetch material data");
  }

  const { data } = await res.json();

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
