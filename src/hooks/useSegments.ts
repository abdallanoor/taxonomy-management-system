import { useState, useCallback } from "react";
import { toast } from "sonner";
import { SegmentData } from "@/lib/data";

interface UseSegmentsProps {
  initialSegments?: SegmentData[];
  materialId?: string;
  limit?: number; // For DataEntry recent segments
}

export function useSegments({
  initialSegments = [],
  materialId,
  limit,
}: UseSegmentsProps = {}) {
  const [segments, setSegments] = useState<SegmentData[]>(initialSegments);
  const [loading, setLoading] = useState(false);

  // Fetch segments
  const fetchSegments = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (materialId) queryParams.append("materialId", materialId);
      if (limit) queryParams.append("limit", limit.toString());

      const res = await fetch(`/api/segments?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSegments(data.data);
      } else {
        toast.error(data.error || "فشل في جلب الفقرات");
      }
    } catch (error) {
      console.error("Error fetching segments:", error);
      toast.error("حدث خطأ أثناء جلب الفقرات");
    } finally {
      setLoading(false);
    }
  }, [materialId, limit]);

  // Create segment
  const createSegment = async (payload: {
    materialId: string;
    pageNumber: number;
    content: string;
    categoryId: string | null;
  }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("تم حفظ الفقرة بنجاح");
        // If we have a limit (DataEntry), re-fetch to keep list fresh
        // If we are in Preview (no limit usually), we might want to just append locally
        if (limit) {
          fetchSegments();
        } else {
            // Optimistic update or append?
            // For now, let's just re-fetch or append if we can match the type
            // But data from API returns populated fields which we might need
            // So appending locally requires careful type matching.
            // Let's return the new segment so the caller can decide?
            // Or just return the data.
            return data.data; 
        }
        return data.data;
      } else {
        toast.error(data.error || "فشل في حفظ الفقرة");
        return null;
      }
    } catch (error) {
      console.error("Error creating segment:", error);
      toast.error("حدث خطأ أثناء حفظ الفقرة");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update segment
  const updateSegment = async (
    id: string,
    payload: {
      content?: string;
      pageNumber?: number;
      categoryId?: string | null;
    }
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/segments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("تم تحديث الفقرة بنجاح");
        if (limit) {
          fetchSegments();
        } else {
          // Update local state for preview
          setSegments((prev) =>
            prev.map((s) => (s._id === id ? { ...s, ...data.data } : s))
          );
           // We might need to handle populated fields if data.data doesn't have them 
           // but usually PUT returns the updated doc. 
           // Ideally we should re-fetch or merge carefully.
           // For simplicity in Preview, we might want to manually merge what changed or re-fetch one.
           return data.data;
        }
        return data.data;
      } else {
        toast.error(data.error || "فشل التحديث");
        return null;
      }
    } catch (error) {
      console.error("Error updating segment:", error);
      toast.error("حدث خطأ أثناء التحديث");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete segment
  const deleteSegment = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/segments/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("تم حذف الفقرة");
        if (limit) {
          fetchSegments();
        } else {
          setSegments((prev) => prev.filter((s) => s._id !== id));
        }
        return true;
      } else {
        toast.error(data.error || "فشل في الحذف");
        return false;
      }
    } catch (error) {
      console.error("Error deleting segment:", error);
      toast.error("حدث خطأ أثناء الحذف");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    segments,
    setSegments, // Exposed for drag & drop optimistic updates
    loading,
    fetchSegments,
    createSegment,
    updateSegment,
    deleteSegment,
  };
}
