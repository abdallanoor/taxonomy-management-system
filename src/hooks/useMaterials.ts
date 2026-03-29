import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MaterialData, PreviewSegmentData } from "@/lib/data";

export function useMaterialsQuery(initialData?: MaterialData[]) {
  return useQuery({
    queryKey: ["materials"],
    queryFn: async (): Promise<MaterialData[]> => {
      const res = await fetch("/api/materials");
      if (!res.ok) throw new Error("فشل في جلب المواد");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
    initialData,
  });
}

export function useMaterialMutations() {
  const queryClient = useQueryClient();

  const invalidateMaterials = () => {
    queryClient.invalidateQueries({ queryKey: ["materials"] });
  };

  const createMaterial = useMutation({
    mutationFn: async (payload: { title: string; author: string }) => {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return true;
    },
    onSuccess: () => {
      toast.success("تم إضافة المادة بنجاح");
      invalidateMaterials();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في حفظ المادة");
    },
  });

  const updateMaterial = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { title: string; author: string } }) => {
      const res = await fetch(`/api/materials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return true;
    },
    onSuccess: () => {
      toast.success("تم تحديث المادة بنجاح");
      invalidateMaterials();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في تحديث المادة");
    },
  });

  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/materials/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return true;
    },
    onSuccess: () => {
      toast.success("تم حذف المادة بنجاح");
      invalidateMaterials();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في الحذف");
    },
  });

  return {
    createMaterial: createMaterial.mutate,
    updateMaterial: updateMaterial.mutate,
    deleteMaterial: deleteMaterial.mutate,
    addMaterialAsync: createMaterial.mutateAsync,
    updateMaterialAsync: updateMaterial.mutateAsync,
    deleteMaterialAsync: deleteMaterial.mutateAsync,
    isPending:
      createMaterial.isPending ||
      updateMaterial.isPending ||
      deleteMaterial.isPending,
  };
}

interface PreviewData {
  material?: MaterialData;
  segments: PreviewSegmentData[];

  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type SearchMode = "text" | "page" | "all";

export function useMaterialPreview(
  materialId: string,
  page: number,
  searchQuery: string,
  searchMode: SearchMode = "all",
) {
  // Normalize: searchMode is irrelevant when searchQuery is empty,
  // so we exclude it from the key to prevent ghost refetches on mode change.
  const effectiveMode = searchQuery.trim() ? searchMode : "all";

  return useQuery<PreviewData>({
    queryKey: ["materials", materialId, "preview", page, searchQuery, effectiveMode],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
        params.set("searchMode", searchMode);
      }
      params.set("page", page.toString());

      const res = await fetch(`/api/materials/${materialId}/preview?${params.toString()}`);
      if (!res.ok) throw new Error("فشل في جلب بيانات المادة");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      return json.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });
}
