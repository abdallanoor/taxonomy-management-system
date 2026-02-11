import { notFound } from "next/navigation";
import { PreviewClient } from "@/components/materials/preview/PreviewClient";
import { getCategoriesTree, getMaterialWithSegments } from "@/lib/data";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
