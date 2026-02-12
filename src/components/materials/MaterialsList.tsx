"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Add01Icon,
  BookEditIcon,
  BookOpen02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { MaterialData } from "@/lib/data";
import { MaterialCard } from "@/components/materials/MaterialCard";
import {
  MaterialForm,
  MaterialFormData,
} from "@/components/forms/MaterialForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useMaterials } from "@/context/materials-context";

export function MaterialsList() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } =
    useMaterials();
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingMaterial, setEditingMaterial] =
    React.useState<MaterialData | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingMaterial(null);
    setDialogOpen(true);
  };

  const openEditDialog = (material: MaterialData) => {
    setEditingMaterial(material);
    setDialogOpen(true);
  };

  const handleMaterialSubmit = async (formData: MaterialFormData) => {
    setLoading(true);
    try {
      let success = false;
      if (editingMaterial) {
        success = await updateMaterial(editingMaterial._id, {
          title: formData.title,
          author: formData.author,
        });
      } else {
        success = await addMaterial({
          title: formData.title,
          author: formData.author,
        });
      }

      if (success) {
        setDialogOpen(false);
        setEditingMaterial(null);
      }
    } catch (error) {
      console.error("Error saving material:", error);
    } finally {
      setLoading(false);
    }
  };

  const [isDeleting, setIsDeleting] = React.useState(false);

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const success = await deleteMaterial(deletingId);
      if (success) {
        setDeletingId(null);
      }
    } catch (error) {
      console.error("Error deleting material:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={BookEditIcon}
            size={24}
            className="text-primary"
          />
          <h2 className="text-xl font-semibold">المواد</h2>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <HugeiconsIcon icon={Add01Icon} size={18} />
              إضافة مادة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? "تعديل المادة" : "إضافة مادة جديدة"}
              </DialogTitle>
              <DialogDescription>
                {editingMaterial
                  ? "قم بتعديل بيانات المادة"
                  : "أدخل بيانات المادة الجديدة (كتاب أو مرجع)"}
              </DialogDescription>
            </DialogHeader>
            <MaterialForm
              defaultValues={
                editingMaterial
                  ? {
                      title: editingMaterial.title,
                      author: editingMaterial.author,
                    }
                  : undefined
              }
              onSubmit={handleMaterialSubmit}
              onCancel={() => setDialogOpen(false)}
              isSubmitting={loading}
              mode={editingMaterial ? "edit" : "create"}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Materials Grid */}
      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <HugeiconsIcon
            icon={BookOpen02Icon}
            size={48}
            className="pacity-50 mb-3"
          />
          <p>لا توجد مواد مسجلة بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {materials.map((material) => (
            <MaterialCard
              key={material._id}
              material={material}
              onEdit={openEditDialog}
              onDelete={setDeletingId}
            />
          ))}
        </div>
      )}

      {/* Delete Alert */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={() => !isDeleting && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه المادة؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المادة وجميع البيانات
              المرتبطة بها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              variant="destructive"
              disabled={isDeleting}
            >
              {isDeleting ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
