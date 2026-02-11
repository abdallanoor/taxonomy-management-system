"use client";

import * as React from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import {
  ArrowRight01Icon,
  Download01Icon,
  DragDropVerticalIcon,
  FloppyDiskIcon,
  Edit02Icon,
  Delete02Icon,
  Cancel01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { SegmentForm, SegmentFormData } from "@/components/forms/SegmentForm";
import type { MaterialData } from "@/lib/data";
import { useSegments } from "@/hooks/useSegments";

interface Segment {
  _id: string;
  content: string;
  pageNumber: number;
  orderIndex: number; // For sorting in preview
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

// ... SortableRow Component (unchanged) ...
function SortableRow({
  segment,
  index,
  onEdit,
  onDelete,
}: {
  segment: Segment;
  index: number;
  onEdit: (segment: Segment) => void;
  onDelete: (segment: Segment) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: segment._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? "relative" : "static",
  } as React.CSSProperties;

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-[50px]">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:text-primary active:cursor-grabbing"
          title="اسحب لإعادة الترتيب"
        >
          <HugeiconsIcon icon={DragDropVerticalIcon} size={20} />
        </div>
      </TableCell>
      <TableCell>{index + 1}</TableCell>
      <TableCell className="min-w-[300px] max-w-[500px] whitespace-pre-wrap">
        {segment.content}
      </TableCell>
      <TableCell className="text-center">{segment.pageNumber}</TableCell>
      {/* Flattened Category Levels */}
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
            className="h-8 w-8"
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

export function PreviewClient({
  material,
  initialSegments,
  categories,
}: PreviewClientProps) {
  // We need to map initialSegments (which has flattened paths) to what useSegments expects (SegmentData)
  // But useSegments is generic.
  // Actually, useSegments expects SegmentData from lib/data.
  // The PreviewClient receives a slightly enriched version of segments with `categoryPath`.
  // We should maintain `segments` state locally here that includes `categoryPath`,
  // and use the hook for operations, then update local state.

  const [segments, setSegments] = React.useState<Segment[]>(initialSegments);

  const {
    createSegment,
    updateSegment,
    deleteSegment,
    reorderSegments,
    loading,
  } = useSegments({ materialId: material._id }); // No auto-fetch, we use initialSegments

  const [hasChanges, setHasChanges] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  // Edit/Delete State
  const [editingSegment, setEditingSegment] = React.useState<Segment | null>(
    null,
  );

  const [deletingSegment, setDeletingSegment] = React.useState<Segment | null>(
    null,
  );

  const [originalOrder, setOriginalOrder] = React.useState(
    initialSegments.map((s) => s._id),
  );

  // Dialog State
  const [activeDialog, setActiveDialog] = React.useState<
    "none" | "edit" | "delete" | "add"
  >("none");

  // Helper to find category info from tree
  const findCategoryInfo = React.useCallback(
    (
      cats: CategoryTreeData[],
      targetId: string | null,
      pathNames: string[] = [],
    ): { name: string; path: string[] } => {
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
    },
    [],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSegments((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Check if order is different from original
        const newOrderIds = newItems.map((s) => s._id);
        const isChanged =
          JSON.stringify(newOrderIds) !== JSON.stringify(originalOrder);
        setHasChanges(isChanged);

        return newItems;
      });
    }
  };

  const handleSaveOrder = async () => {
    if (!hasChanges) return;
    setSaving(true);

    const orderedIds = segments.map((s) => s._id);
    const success = await reorderSegments(orderedIds);

    if (success) {
      setHasChanges(false);
      setOriginalOrder(orderedIds);
    }
    setSaving(false);
  };

  const handleResetOrder = () => {
    // Revert segments to original order
    const resetSegments = [...segments].sort((a, b) => {
      return originalOrder.indexOf(a._id) - originalOrder.indexOf(b._id);
    });
    setSegments(resetSegments);
    setHasChanges(false);
    toast.info("تم إلغاء التغييرات");
  };

  const handleAddSubmit = async (formData: SegmentFormData) => {
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
        orderIndex: segments.length, // Append to end
        categoryId:
          data.categoryId && typeof data.categoryId === "object"
            ? (data.categoryId as { _id: string })._id
            : data.categoryId,
        categoryName: catName,
        categoryPath: paddedPath,
      };

      setSegments((prev) => [...prev, formattedSegment]);
      setOriginalOrder((prev) => [...prev, formattedSegment._id]);
      setSegments((prev) => [...prev, formattedSegment]);
      setOriginalOrder((prev) => [...prev, formattedSegment._id]);
      // setActiveDialog("none");
    }
  };

  // Edit Handlers
  const openEditDialog = (segment: Segment) => {
    if (hasChanges) {
      toast.warning("يرجى حفظ الترتيب أولاً قبل التعديل");
      return;
    }
    setEditingSegment(segment);
    setActiveDialog("edit");
  };

  const handleUpdateSegment = async (formData: SegmentFormData) => {
    if (!editingSegment) return;

    // Optimistic update logic is tricky here because we rely on hook result for confirmation
    // but we need to update our local state which has 'categoryPath'.

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

      // Pad the path to 6 levels to match table expectation
      const paddedPath = [...newCatPath];
      while (paddedPath.length < 6) {
        paddedPath.push("");
      }

      setSegments((prev) =>
        prev.map((s) =>
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
        ),
      );
      // Don't clear editingSegment immediately to allow animation to finish
      // setEditingSegment(null);
      setActiveDialog("none");
    }
  };

  // Delete Handlers
  const openDeleteDialog = (segment: Segment) => {
    if (hasChanges) {
      toast.warning("يرجى حفظ الترتيب أولاً قبل الحذف");
      return;
    }
    setDeletingSegment(segment);
    setActiveDialog("delete");
  };

  const confirmDelete = async () => {
    if (!deletingSegment) return;

    const success = await deleteSegment(deletingSegment._id);

    if (success) {
      setSegments((prev) => prev.filter((s) => s._id !== deletingSegment._id));
      // Also update originalOrder to prevent false positive changes
      setOriginalOrder((prev) =>
        prev.filter((id) => id !== deletingSegment._id),
      );
      setActiveDialog("none");
    }
  };

  const handleExport = async () => {
    if (hasChanges) {
      toast.warning("يرجى حفظ الترتيب أولاً لضمان تصديره بشكل صحيح");
      return;
    }

    setExporting(true);
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
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start flex-col md:flex-row gap-2 justify-between">
        <div className="flex items-center gap-4 max-sm:w-full">
          <Button variant="outline" size="icon" asChild>
            <Link href="/materials">
              <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{material.title}</h2>
            <p className="text-sm text-muted-foreground">{material.author}</p>
          </div>
        </div>
        <div className="flex items-center flex-wrap justify-end gap-2 ms-auto">
          {hasChanges && (
            <>
              <Button
                onClick={handleResetOrder}
                variant="outline"
                className="text-muted-foreground hover:text-foreground border-dashed"
                title="إلغاء التغييرات"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
                <span>إلغاء</span>
              </Button>
              <Button
                onClick={handleSaveOrder}
                disabled={saving}
                variant="default"
                className="bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
              >
                <HugeiconsIcon icon={FloppyDiskIcon} size={18} />
                <span>حفظ الترتيب</span>
              </Button>
            </>
          )}

          <Button
            onClick={handleExport}
            disabled={exporting || hasChanges}
            variant="secondary"
          >
            <HugeiconsIcon icon={Download01Icon} size={18} />
            <span>تصدير Excel</span>
          </Button>

          <Button
            onClick={() => {
              setActiveDialog("add");
            }}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={18} />
            <span>إضافة فقرة</span>
          </Button>
        </div>
      </div>

      {/* Drag & Drop Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>معاينة وترتيب الفقرات ({segments.length})</span>
            {hasChanges && (
              <span className="text-sm font-normal text-amber-600 flex items-center gap-1">
                تغييرات غير محفوظة
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
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
                <SortableContext
                  items={segments.map((s) => s._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {segments.map((segment, index) => (
                    <SortableRow
                      key={segment._id}
                      segment={segment}
                      index={index}
                      onEdit={openEditDialog}
                      onDelete={openDeleteDialog}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={activeDialog === "edit"}
        onOpenChange={(open) => !open && setActiveDialog("none")}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>تعديل الفقرة</DialogTitle>
            <DialogDescription>
              قم بتعديل محتوى الفقرة أو رقم الصفحة
            </DialogDescription>
          </DialogHeader>
          {editingSegment && (
            <SegmentForm
              mode="edit"
              categories={categories}
              materials={[material]} // Pass current material
              defaultValues={{
                materialId: material._id,
                pageNumber: editingSegment.pageNumber.toString(),
                content: editingSegment.content,
                categoryId: editingSegment.categoryId,
              }}
              onSubmit={handleUpdateSegment}
              onCancel={() => setActiveDialog("none")}
              isSubmitting={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={activeDialog === "delete"}
        onOpenChange={(open) => !open && setActiveDialog("none")}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه الفقرة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الفقرة نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
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

      {/* Add Segment Dialog */}
      <Dialog
        open={activeDialog === "add"}
        onOpenChange={(open) => !open && setActiveDialog("none")}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>إضافة فقرة جديدة</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل الفقرة الجديدة لإضافتها إلى المادة
            </DialogDescription>
          </DialogHeader>
          <SegmentForm
            defaultValues={{ materialId: material._id }}
            materials={[material]}
            categories={categories}
            onSubmit={handleAddSubmit}
            isSubmitting={loading}
            mode="create"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
