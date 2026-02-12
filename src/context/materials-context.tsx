"use client";

import * as React from "react";
import type { MaterialData } from "@/lib/data";
import { toast } from "sonner";

interface MaterialsContextType {
  materials: MaterialData[];
  loading: boolean;
  addMaterial: (material: {
    title: string;
    author: string;
  }) => Promise<boolean>;
  updateMaterial: (
    id: string,
    material: { title: string; author: string },
  ) => Promise<boolean>;
  deleteMaterial: (id: string) => Promise<boolean>;
  refreshMaterials: () => Promise<void>;
}

const MaterialsContext = React.createContext<MaterialsContextType | undefined>(
  undefined,
);

export function MaterialsProvider({
  children,
  initialMaterials = [],
}: {
  children: React.ReactNode;
  initialMaterials?: MaterialData[];
}) {
  const [materials, setMaterials] =
    React.useState<MaterialData[]>(initialMaterials);
  const [loading, setLoading] = React.useState(false);

  const refreshMaterials = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      if (data.success) {
        setMaterials(data.data);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast.error("فشل في تحديث قائمة المواد");
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydrate on mount if initialMaterials is empty, or just always fetch fresh data
  // depending on requirement. For now, we trust initialMaterials or fetch if empty.
  React.useEffect(() => {
    if (initialMaterials.length === 0) {
      refreshMaterials();
    }
  }, [initialMaterials, refreshMaterials]);

  const addMaterial = React.useCallback(
    async (materialData: { title: string; author: string }) => {
      setLoading(true);
      try {
        const res = await fetch("/api/materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(materialData),
        });
        const data = await res.json();
        if (data.success) {
          setMaterials((prev) => [data.data, ...prev]);
          toast.success("تم إضافة المادة بنجاح");
          return true;
        } else {
          toast.error(data.error || "فشل في حفظ المادة");
          return false;
        }
      } catch (error) {
        console.error("Error adding material:", error);
        toast.error("حدث خطأ أثناء الحفظ");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateMaterial = React.useCallback(
    async (id: string, materialData: { title: string; author: string }) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/materials/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(materialData),
        });
        const data = await res.json();
        if (data.success) {
          setMaterials((prev) =>
            prev.map((item) => (item._id === id ? data.data : item)),
          );
          toast.success("تم تحديث المادة بنجاح");
          return true;
        } else {
          toast.error(data.error || "فشل في تحديث المادة");
          return false;
        }
      } catch (error) {
        console.error("Error updating material:", error);
        toast.error("حدث خطأ أثناء التحديث");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteMaterial = React.useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMaterials((prev) => prev.filter((item) => item._id !== id));
        toast.success("تم حذف المادة بنجاح");
        return true;
      } else {
        toast.error(data.error || "فشل في الحذف");
        return false;
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("حدث خطأ أثناء الحذف");
      return false;
    }
  }, []);

  return (
    <MaterialsContext.Provider
      value={{
        materials,
        loading,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        refreshMaterials,
      }}
    >
      {children}
    </MaterialsContext.Provider>
  );
}

export function useMaterials() {
  const context = React.useContext(MaterialsContext);
  if (context === undefined) {
    throw new Error("useMaterials must be used within a MaterialsProvider");
  }
  return context;
}
