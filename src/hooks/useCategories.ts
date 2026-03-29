import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CategoryTreeData, CategoryData } from "@/lib/data";

export function useCategoriesTreeQuery() {
  return useQuery({
    queryKey: ["categories", "tree"],
    queryFn: async (): Promise<CategoryTreeData[]> => {
      const res = await fetch("/api/categories?format=tree");
      if (!res.ok) throw new Error("فشل في جلب شجرة التصنيفات");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

export function useFlatCategoriesQuery() {
  return useQuery({
    queryKey: ["categories", "flat"],
    queryFn: async (): Promise<CategoryData[]> => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("فشل في جلب التصنيفات");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const createCategory = useMutation({
    mutationFn: async (payload: { name: string; parentId: string | null }) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      toast.success("تم إضافة التصنيف بنجاح");
      invalidateCategories();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في حفظ التصنيف");
    },
  });

  const bulkCreateCategories = useMutation({
    mutationFn: async (
      categories: { name: string; parentId: string | null }[]
    ) => {
      const res = await fetch("/api/categories/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`تم إضافة ${data.count} تصنيف بنجاح`);
      invalidateCategories();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في حفظ التصنيفات");
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { name: string; parentId: string | null } }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      toast.success("تم تحديث التصنيف بنجاح");
      invalidateCategories();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في تحديث التصنيف");
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      toast.success("تم حذف التصنيف بنجاح");
      invalidateCategories();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في الحذف");
    },
  });

  return {
    createCategory: createCategory.mutate,
    bulkCreateCategories: bulkCreateCategories.mutate,
    updateCategory: updateCategory.mutate,
    deleteCategory: deleteCategory.mutate,
    isPending:
      createCategory.isPending ||
      bulkCreateCategories.isPending ||
      updateCategory.isPending ||
      deleteCategory.isPending,
  };
}
