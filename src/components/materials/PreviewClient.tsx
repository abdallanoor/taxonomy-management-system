"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  Download01Icon,
  Edit02Icon,
  Delete02Icon,
  AddToListIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { SegmentForm, SegmentFormData } from "@/components/forms/SegmentForm";
import type { MaterialData } from "@/lib/data";
import { useSegments } from "@/hooks/useSegments";
import { exportMaterialToExcel } from "@/lib/export";

interface Segment {
  _id: string;
  content: string;
  pageNumber: number;
  categoryPath: string[];
  categoryName: string;
  categoryId: string | null;
}

// Map the data types
// The useSegments hook works with SegmentData from lib/data which might need adaptation
// specific to how PreviewClient uses it (with categoryPath flattened)

interface CategoryTreeData {
  _id: string;
  name: string;
  parentId: string | null;
  children?: CategoryTreeData[];
}

interface PreviewClientProps {
  material: MaterialData;
  initialSegments: Segment[];
  categories: CategoryTreeData[];
}

// ... SortableRow Component ...
function SegmentRow({
  segment,
  index,
  onEdit,
  onDelete,
  isEditing,
}: {
  segment: Segment;
  index: number;
  onEdit: (segment: Segment) => void;
  onDelete: (segment: Segment) => void;
  isEditing: boolean;
}) {
  return (
    <TableRow className={isEditing ? "bg-muted/50" : ""}>
      <TableCell className="w-[50px] font-medium text-muted-foreground">
        {index + 1}
      </TableCell>
      <TableCell className="min-w-[300px] max-w-[500px] whitespace-pre-wrap leading-relaxed py-4">
        {segment.content}
      </TableCell>
      <TableCell className="text-center font-bold text-primary">
        {segment.pageNumber}
      </TableCell>
      {[0, 1, 2, 3, 4, 5].map((level) => (
        <TableCell key={level} className="text-muted-foreground text-xs">
          {segment.categoryPath?.[level] || "-"}
        </TableCell>
      ))}
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(segment)}
            className={`h-8 w-8 ${
              isEditing ? "text-primary bg-primary/10" : ""
            }`}
            title="تعديل"
          >
            <HugeiconsIcon icon={Edit02Icon} size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(segment)}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="حذف"
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Helper to find category info from tree
function findCategoryInfo(
  cats: CategoryTreeData[],
  targetId: string | null,
  pathNames: string[] = [],
): { name: string; path: string[] } {
  if (!targetId) return { name: "", path: [] };

  for (const cat of cats) {
    if (cat._id === targetId) {
      const newPath = [...pathNames, cat.name];
      return { name: cat.name, path: newPath };
    }
    if (cat.children && cat.children.length > 0) {
      const found = findCategoryInfo(cat.children, targetId, [
        ...pathNames,
        cat.name,
      ]);
      if (found.name) return found;
    }
  }
  return { name: "", path: [] };
}

export function PreviewClient({
  material,
  initialSegments,
  categories,
}: PreviewClientProps) {
  const [segments, setSegments] = React.useState<Segment[]>(initialSegments);

  const { createSegment, updateSegment, deleteSegment, loading } = useSegments({
    materialId: material._id,
  });

  const [exporting, setExporting] = React.useState(false);

  // Edit/Delete State
  const [editingSegment, setEditingSegment] = React.useState<Segment | null>(
    null,
  );

  const [deletingSegment, setDeletingSegment] = React.useState<Segment | null>(
    null,
  );

  const handleFormSubmit = async (formData: SegmentFormData) => {
    if (editingSegment) {
      // Update
      const updated = await updateSegment(editingSegment._id, {
        content: formData.content,
        pageNumber: parseInt(formData.pageNumber),
        categoryId: formData.categoryId || null,
      });

      if (updated) {
        // Calculate new category info locally
        const { name: newCatName, path: newCatPath } = findCategoryInfo(
          categories,
          formData.categoryId || null,
        );

        // Pad the path to 6 levels
        const paddedPath = [...newCatPath];
        while (paddedPath.length < 6) {
          paddedPath.push("");
        }

        setSegments((prev) =>
          prev
            .map((s) =>
              s._id === editingSegment._id
                ? {
                    ...s,
                    content: formData.content,
                    pageNumber: parseInt(formData.pageNumber),
                    categoryId: formData.categoryId || null,
                    categoryName: newCatName,
                    categoryPath: paddedPath,
                  }
                : s,
            )
            .sort((a, b) => a.pageNumber - b.pageNumber),
        );
        setEditingSegment(null);
        return true;
      }
      return false;
    } else {
      // Create
      const data = await createSegment({
        materialId: material._id,
        pageNumber: parseInt(formData.pageNumber),
        content: formData.content,
        categoryId: formData.categoryId || null,
      });

      if (data) {
        // Calculate category info for the new segment
        const { name: catName, path: catPath } = findCategoryInfo(
          categories,
          data.categoryId && typeof data.categoryId === "object"
            ? (data.categoryId as { _id: string })._id
            : data.categoryId || null,
        );

        // Pad path
        const paddedPath = [...catPath];
        while (paddedPath.length < 6) {
          paddedPath.push("");
        }

        // Format for local state
        const formattedSegment: Segment = {
          _id: data._id,
          content: data.content,
          pageNumber: data.pageNumber,
          categoryId:
            data.categoryId && typeof data.categoryId === "object"
              ? (data.categoryId as { _id: string })._id
              : data.categoryId,
          categoryName: catName,
          categoryPath: paddedPath,
        };

        setSegments((prev) => {
          const newSegments = [...prev, formattedSegment].sort(
            (a, b) => a.pageNumber - b.pageNumber,
          );
          return newSegments;
        });
        return true;
      }
      return false;
    }
  };

  const handleEdit = (segment: Segment) => {
    setEditingSegment(segment);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingSegment(null);
  };

  const openDeleteDialog = (segment: Segment) => {
    setDeletingSegment(segment);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deletingSegment) return;

    const success = await deleteSegment(deletingSegment._id);

    if (success) {
      setSegments((prev) => prev.filter((s) => s._id !== deletingSegment._id));
      setDeletingSegment(null);
      if (editingSegment?._id === deletingSegment._id) {
        setEditingSegment(null);
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    await exportMaterialToExcel(material._id, material.title);
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">{material.title}</h2>
        <p className="text-sm text-muted-foreground">{material.author}</p>
      </div>

      {/* Inline Form Card */}
      <Card className="max-w-full w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={AddToListIcon} size={22} />
            {editingSegment ? "تعديل الفقرة" : "إضافة فقرة جديدة"}
          </CardTitle>
          <CardDescription>
            {editingSegment
              ? "قم بتعديل بيانات الفقرة أدناه"
              : "أدخل بيانات الفقرة وحدد التصنيف المناسب"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SegmentForm
            categories={categories}
            onSubmit={handleFormSubmit}
            isSubmitting={loading}
            mode={editingSegment ? "edit" : "create"}
            onCancel={editingSegment ? handleCancelEdit : undefined}
            defaultValues={{
              materialId: material._id,
              pageNumber: editingSegment
                ? editingSegment.pageNumber.toString()
                : "",
              content: editingSegment ? editingSegment.content : "",
              categoryId: editingSegment
                ? editingSegment.categoryId || null
                : null,
            }}
          />
        </CardContent>
      </Card>
      <div className="flex items-center flex-wrap justify-end gap-2 ms-auto mb-4">
        <Button onClick={handleExport} disabled={exporting} variant="secondary">
          {exporting ? (
            <HugeiconsIcon
              icon={Loading03Icon}
              size={18}
              className="animate-spin animation-duration-[2s]"
            />
          ) : (
            <HugeiconsIcon icon={Download01Icon} size={18} />
          )}
          <span>تصدير Excel</span>
        </Button>
      </div>
      {/* Drag & Drop Table */}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>النص</TableHead>
            <TableHead className="text-center w-[80px]">ص</TableHead>
            <TableHead className="w-[100px]">مستوى 1</TableHead>
            <TableHead className="w-[100px]">مستوى 2</TableHead>
            <TableHead className="w-[100px]">مستوى 3</TableHead>
            <TableHead className="w-[100px]">مستوى 4</TableHead>
            <TableHead className="w-[100px]">مستوى 5</TableHead>
            <TableHead className="w-[100px]">مستوى 6</TableHead>
            <TableHead className="w-[100px]">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {segments.map((segment, index) => (
            <SegmentRow
              key={segment._id}
              segment={segment}
              index={index}
              onEdit={handleEdit}
              onDelete={openDeleteDialog}
              isEditing={editingSegment?._id === segment._id}
            />
          ))}
        </TableBody>
      </Table>

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={!!deletingSegment}
        onOpenChange={(open) => {
          if (!open && !loading) setDeletingSegment(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه الفقرة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الفقرة نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              variant="destructive"
              disabled={loading}
            >
              {loading ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
