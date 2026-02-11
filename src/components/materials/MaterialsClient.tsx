"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
  BookOpen02Icon,
  Download01Icon,
  Loading03Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
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
import { HugeiconsIcon } from "@hugeicons/react";
import type { MaterialData } from "@/lib/data";
import { MaterialForm, type MaterialFormData } from "../forms/MaterialForm";

interface MaterialsClientProps {
  initialMaterials: MaterialData[];
}

export function MaterialsClient({ initialMaterials }: MaterialsClientProps) {
  const [materials, setMaterials] = React.useState(initialMaterials);
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingMaterial, setEditingMaterial] =
    React.useState<MaterialData | null>(null);
  const [exportingId, setExportingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      if (data.success) {
        setMaterials(data.data);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const openCreateDialog = () => {
    setEditingMaterial(null);
    setDialogOpen(true);
  };

  const openEditDialog = (material: MaterialData) => {
    setEditingMaterial(material);
    setDialogOpen(true);
  };

  const handleSubmit = async (formData: MaterialFormData) => {
    setLoading(true);
    try {
      const url = editingMaterial
        ? `/api/materials/${editingMaterial._id}`
        : "/api/materials";
      const method = editingMaterial ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          editingMaterial ? "تم تحديث المادة بنجاح" : "تم إضافة المادة بنجاح",
        );
        setDialogOpen(false);
        setEditingMaterial(null);
        fetchMaterials();
      } else {
        toast.error(data.error || "فشل في حفظ المادة");
      }
    } catch (error) {
      console.error("Error saving material:", error);
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      const res = await fetch(`/api/materials/${deletingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("تم حذف المادة بنجاح");
        fetchMaterials();
      } else {
        toast.error(data.error || "فشل في الحذف");
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const handleExport = async (material: MaterialData) => {
    setExportingId(material._id);
    try {
      const response = await fetch(`/api/materials/${material._id}/export`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${material.title.replace(/[^a-z0-9\u0600-\u06FF]/gi, "_")}_Export.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("تم تصدير الملف بنجاح");
    } catch (error) {
      console.error("Error exporting material:", error);
      toast.error("فشل في تصدير الملف");
    } finally {
      setExportingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={BookOpen02Icon}
            size={24}
            className="text-primary"
          />
          <h2 className="text-xl font-semibold">قائمة المواد</h2>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <HugeiconsIcon icon={Add01Icon} size={18} />
              إضافة مادة جديدة
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
              onSubmit={handleSubmit}
              onCancel={() => setDialogOpen(false)}
              isSubmitting={loading}
              mode={editingMaterial ? "edit" : "create"}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المواد المسجلة ({materials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <HugeiconsIcon
                icon={BookOpen02Icon}
                size={48}
                className="mb-4 opacity-50"
              />
              <p>لا توجد مواد مسجلة بعد</p>
              <Button variant="link" onClick={openCreateDialog}>
                إضافة مادة جديدة
              </Button>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>المؤلف</TableHead>
                    <TableHead>تاريخ الإضافة</TableHead>
                    <TableHead className="w-[100px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material._id}>
                      <TableCell className="font-medium">
                        {material.title}
                      </TableCell>
                      <TableCell>{material.author}</TableCell>
                      <TableCell
                        className="text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {formatDate(material.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExport(material)}
                            disabled={exportingId === material._id}
                            className="h-8 w-8"
                            title="تصدير إلى Excel"
                          >
                            {exportingId === material._id ? (
                              <HugeiconsIcon
                                icon={Loading03Icon}
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <HugeiconsIcon icon={Download01Icon} size={16} />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8"
                            title="معاينة وترتيب"
                          >
                            <Link href={`/materials/${material._id}/preview`}>
                              <HugeiconsIcon icon={ViewIcon} size={16} />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(material)}
                            className="h-8 w-8"
                          >
                            <HugeiconsIcon icon={Edit02Icon} size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(material._id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه المادة؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المادة وجميع البيانات
              المرتبطة بها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} variant="destructive">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
