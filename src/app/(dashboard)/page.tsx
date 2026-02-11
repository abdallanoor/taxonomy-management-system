import { getMaterials, getCategoriesTree, getRecentSegments } from "@/lib/data";
import { DataEntryClient } from "@/components/dashboard/DataEntryClient";

export default async function DataEntryPage() {
  const [materials, categories, segments] = await Promise.all([
    getMaterials(),
    getCategoriesTree(),
    getRecentSegments(10),
  ]);

  return (
    <DataEntryClient
      initialMaterials={materials}
      initialCategories={categories}
      initialSegments={segments}
    />
  );
}
