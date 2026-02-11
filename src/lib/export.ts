import { toast } from "sonner";

/**
 * Shared utility to export material data to an Excel file.
 * 
 * @param materialId - The ID of the material to export.
 * @param title - The title of the material (used for the filename).
 * @returns A promise that resolves to true if the export was successful, false otherwise.
 */
export async function exportMaterialToExcel(materialId: string, title: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/materials/${materialId}/export`);

    if (!response.ok) {
      throw new Error("Export failed");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // Clean the title for filename (remove invalid chars)
    const safeTitle = title.replace(/[^a-z0-9\u0600-\u06FF]/gi, "_");
    a.download = `${safeTitle}_Export.xlsx`;
    
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success("تم تصدير الملف بنجاح");
    return true;
  } catch (error) {
    console.error("Error exporting material:", error);
    toast.error("فشل في تصدير الملف");
    return false;
  }
}
