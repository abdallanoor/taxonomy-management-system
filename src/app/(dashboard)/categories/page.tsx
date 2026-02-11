import { getCategoriesTree, getCategories } from "@/lib/data";
import { CategoriesClient } from "@/components/categories/CategoriesClient";

export default async function CategoriesPage() {
  const [categoriesTree, flatCategories] = await Promise.all([
    getCategoriesTree(),
    getCategories(),
  ]);

  return (
    <CategoriesClient
      initialCategories={categoriesTree}
      initialFlatCategories={flatCategories}
    />
  );
}
