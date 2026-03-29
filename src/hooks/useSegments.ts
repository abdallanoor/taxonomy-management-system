import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseSegmentsProps {
  materialId?: string;
  limit?: number; // legacy support if it was used anywhere else
}

export function useSegments({ materialId }: UseSegmentsProps = {}) {
  const queryClient = useQueryClient();

  const invalidatePreview = () => {
    if (materialId) {
      queryClient.invalidateQueries({ queryKey: ["materials", materialId, "preview"] });
    } else {
       // if we don't have materialId, invalidate all material previews
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    }
  };

  const createSegment = useMutation({
    mutationFn: async (payload: {
      materialId: string;
      pageNumber: number;
      content: string;
      categoryId: string | null;
    }) => {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      toast.success("تم حفظ الفقرة بنجاح");
      invalidatePreview();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في حفظ الفقرة");
    },
  });

  const updateSegment = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        content?: string;
        pageNumber?: number;
        categoryId?: string | null;
      };
    }) => {
      const res = await fetch(`/api/segments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      toast.success("تم تحديث الفقرة بنجاح");
      invalidatePreview();
    },
    onError: (error) => {
      toast.error(error.message || "فشل التحديث");
    },
  });

  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/segments/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      toast.success("تم حذف الفقرة");
      invalidatePreview();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في الحذف");
    },
  });

  const reorderSegment = useMutation({
    mutationFn: async ({
      segmentAId,
      segmentBId,
    }: {
      segmentAId: string;
      segmentBId: string;
    }) => {
      const res = await fetch("/api/segments/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentAId, segmentBId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
    },
    onSuccess: () => {
      invalidatePreview();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في إعادة الترتيب");
    },
  });

  // Returning a slightly modified async function wrapper to match previous usage
  // The original hook exported functions that returned actual data or false on failure
  return {
    createSegment: async (payload: any) => {
      try {
        const result = await createSegment.mutateAsync(payload);
        return result;
      } catch {
        return null;
      }
    },
    updateSegment: async (id: string, payload: any) => {
      try {
        const result = await updateSegment.mutateAsync({ id, payload });
        return result;
      } catch {
        return null;
      }
    },
    deleteSegment: async (id: string) => {
      try {
        await deleteSegment.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
    reorderSegments: async (segmentAId: string, segmentBId: string) => {
      try {
        await reorderSegment.mutateAsync({ segmentAId, segmentBId });
        return true;
      } catch {
        return false;
      }
    },
    isCreating: createSegment.isPending,
    isUpdating: updateSegment.isPending,
    isDeleting: deleteSegment.isPending,
    isReordering: reorderSegment.isPending,
    loading: createSegment.isPending || updateSegment.isPending || deleteSegment.isPending,
  };
}
