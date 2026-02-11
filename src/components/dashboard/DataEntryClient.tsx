"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Delete02Icon,
  Edit02Icon,
  AddToListIcon,
  ArrowUp01Icon,
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
import type { MaterialData, CategoryTreeData, SegmentData } from "@/lib/data";

import { SegmentForm, SegmentFormData } from "@/components/forms/SegmentForm";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { useSegments } from "@/hooks/useSegments";

interface DataEntryClientProps {
  initialMaterials: MaterialData[];
  initialCategories: CategoryTreeData[];
  initialSegments: SegmentData[];
}

export function DataEntryClient({
  initialMaterials,
  initialCategories,
  initialSegments,
}: DataEntryClientProps) {
  const [materials] = React.useState(initialMaterials);
  const [categories] = React.useState(initialCategories);

  // Use custom hook for segments logic
  const {
    segments: recentSegments,
    loading: isLoading,
    createSegment,
    updateSegment,
    deleteSegment,
  } = useSegments({ initialSegments, limit: 10 });

  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Edit State
  const [editingSegment, setEditingSegment] =
    React.useState<SegmentData | null>(null);

  const confirmDelete = async () => {
    if (!deletingId) return;
    const success = await deleteSegment(deletingId);
    if (success) {
      setDeletingId(null);
      if (editingSegment && editingSegment._id === deletingId) {
        setEditingSegment(null);
      }
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  /* Edit Handlers */
  const handleEdit = (segment: SegmentData) => {
    setEditingSegment(segment);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingSegment(null);
  };

  const handleFormSubmit = async (formData: SegmentFormData) => {
    if (editingSegment) {
      // Update
      const updated = await updateSegment(editingSegment._id, {
        content: formData.content,
        pageNumber: parseInt(formData.pageNumber),
        categoryId: formData.categoryId || null,
      });
      if (updated) {
        setEditingSegment(null);
        return true;
      }
      return false;
    } else {
      // Create
      const created = await createSegment({
        materialId: formData.materialId,
        pageNumber: parseInt(formData.pageNumber),
        content: formData.content,
        categoryId: formData.categoryId || null,
      });
      return !!created;
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Data Entry Form */}
      <Card>
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
            materials={materials}
            categories={categories}
            onSubmit={handleFormSubmit}
            isSubmitting={isLoading}
            mode={editingSegment ? "edit" : "create"}
            onCancel={editingSegment ? handleCancelEdit : undefined}
            defaultValues={
              editingSegment
                ? {
                    materialId: editingSegment.materialId?._id || "",
                    pageNumber: editingSegment.pageNumber.toString(),
                    content: editingSegment.content,
                    categoryId: editingSegment.categoryId?._id || null,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Edit02Icon} size={22} />
            آخر الإدخالات
          </CardTitle>
          <CardDescription>آخر 10 فقرات تم إدخالها</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="sm:max-h-[350px] overflow-auto">
            {recentSegments.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                لا توجد فقرات بعد
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المادة</TableHead>
                    <TableHead className="w-[60px]">الصفحة</TableHead>
                    <TableHead>التصنيف</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSegments.map((segment) => (
                    <React.Fragment key={segment._id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableRow
                            className={
                              editingSegment?._id === segment._id
                                ? "bg-muted/50"
                                : "hover:bg-muted/30"
                            }
                          >
                            <TableCell className="font-medium max-w-[150px]">
                              <Link
                                href={`/materials/${segment.materialId?._id}/preview`}
                                className="hover:text-primary flex items-center gap-0.5 group w-fit"
                              >
                                <span className="truncate underline decoration-dotted underline-offset-4 group-hover:decoration-solid">
                                  {segment.materialId?.title || "غير محدد"}
                                </span>
                                <HugeiconsIcon
                                  icon={ArrowUp01Icon}
                                  size={16}
                                  className="text-muted-foreground rotate-45 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {segment.pageNumber}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[150px]">
                              <div
                                className="truncate"
                                title={segment.categoryId?.name}
                              >
                                {segment.categoryId ? (
                                  segment.categoryId.name
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-muted-foreground font-normal"
                                  >
                                    غير مصنف
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(segment)}
                                  className={cn(
                                    "h-8 w-8 text-muted-foreground hover:text-primary",
                                    editingSegment?._id === segment._id &&
                                      "text-primary bg-primary/10",
                                  )}
                                  title="تعديل"
                                >
                                  <HugeiconsIcon icon={Edit02Icon} size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(segment._id)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  title="حذف"
                                >
                                  <HugeiconsIcon
                                    icon={Delete02Icon}
                                    size={16}
                                  />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {segment.content}
                        </TooltipContent>
                      </Tooltip>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه الفقرة؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الفقرة نهائياً.
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
