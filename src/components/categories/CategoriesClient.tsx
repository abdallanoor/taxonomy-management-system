"use client";

import * as React from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Delete02Icon,
  Edit02Icon,
  FolderLibraryIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  FolderAddIcon,
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
import type { CategoryData, CategoryTreeData } from "@/lib/data";
import { CategoryForm, type CategoryFormData } from "../forms/CategoryForm";

interface CategoriesClientProps {
  initialCategories: CategoryTreeData[];
  initialFlatCategories: CategoryData[];
}

export function CategoriesClient({
  initialCategories,
  initialFlatCategories,
}: CategoriesClientProps) {
  const [categories, setCategories] = React.useState(initialCategories);
  const [flatCategories, setFlatCategories] = React.useState(
    initialFlatCategories,
  );
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] =
    React.useState<CategoryData | null>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      // Fetch tree structure
      const treeRes = await fetch("/api/categories?format=tree");
      const treeData = await treeRes.json();
      if (treeData.success) {
        setCategories(treeData.data);
      }

      // Fetch flat list for parent selection
      const flatRes = await fetch("/api/categories");
      const flatData = await flatRes.json();
      if (flatData.success) {
        setFlatCategories(flatData.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const openCreateDialog = (parentCategory?: CategoryData) => {
    setEditingCategory(null);
    if (parentCategory) {
      // Create a temporary category-like object for parent selection
      setEditingCategory({
        _id: "",
        name: "",
        parentId: parentCategory._id,
      } as CategoryData);
    }
    setDialogOpen(true);
  };

  const openEditDialog = (category: CategoryData) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSubmit = async (formData: CategoryFormData) => {
    if (!formData.name.trim()) {
      toast.error("يرجى إدخال اسم التصنيف");
      return;
    }

    setLoading(true);
    try {
      const url =
        editingCategory && editingCategory._id
          ? `/api/categories/${editingCategory._id}`
          : "/api/categories";
      const method = editingCategory && editingCategory._id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          parentId: formData.parentId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          editingCategory && editingCategory._id
            ? "تم تحديث التصنيف بنجاح"
            : "تم إضافة التصنيف بنجاح",
        );
        setDialogOpen(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        toast.error(data.error || "فشل في حفظ التصنيف");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("حدث خطأ أثناء الحفظ");
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
      const res = await fetch(`/api/categories/${deletingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("تم حذف التصنيف بنجاح");
        fetchCategories();
        setDeletingId(null);
      } else {
        toast.error(data.error || "فشل في الحذف");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (cats: CategoryTreeData[]) => {
      cats.forEach((cat) => {
        if (cat.children && cat.children.length > 0) {
          allIds.add(cat._id);
          collectIds(cat.children);
        }
      });
    };
    collectIds(categories);
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Recursive tree item component
  const TreeItem = ({
    category,
    level = 0,
  }: {
    category: CategoryTreeData;
    level?: number;
  }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category._id);
    const isRoot = level === 0;

    return (
      <div className={cn(isRoot ? "" : "pr-4 border-r-2 border-border mr-3")}>
        <div
          className={cn(
            "flex items-center gap-2 py-2.5 px-3 rounded-lg group transition-colors select-none cursor-pointer",
            isRoot ? "bg-muted/80 hover:bg-muted" : "hover:bg-muted/40",
          )}
          onClick={() => hasChildren && toggleExpand(category._id)}
        >
          {hasChildren ? (
            <div className="h-6 w-6 shrink-0 flex items-center justify-center">
              <HugeiconsIcon
                icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                size={14}
              />
            </div>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
            </div>
          )}

          <HugeiconsIcon
            icon={FolderLibraryIcon}
            size={18}
            className={cn(
              "shrink-0",
              isRoot ? "text-foreground" : "text-muted-foreground",
            )}
          />

          <span
            className={cn(
              "flex-1 truncate",
              isRoot ? "font-semibold" : "font-medium text-muted-foreground",
            )}
          >
            {category.name}
          </span>

          {hasChildren && (
            <Badge variant="outline" className="text-xs shrink-0">
              {category.children!.length}
            </Badge>
          )}

          {/* Action buttons - stop propagation to prevent expand/collapse */}
          <div
            className="flex items-center gap-0.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                openCreateDialog({
                  _id: category._id,
                  name: category.name,
                  parentId: category.parentId,
                })
              }
              disabled={level >= 5}
              title={
                level >= 5
                  ? "تم الوصول للحد الأقصى للمستويات"
                  : "إضافة تصنيف فرعي"
              }
            >
              <HugeiconsIcon icon={FolderAddIcon} size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                openEditDialog({
                  _id: category._id,
                  name: category.name,
                  parentId: category.parentId,
                })
              }
            >
              <HugeiconsIcon icon={Edit02Icon} size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDeletingId(category._id)}
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1 pr-2">
            {category.children!.map((child) => (
              <TreeItem key={child._id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Count total categories
  const countCategories = (cats: CategoryTreeData[]): number => {
    return cats.reduce((acc, cat) => {
      return acc + 1 + (cat.children ? countCategories(cat.children) : 0);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-fit">
          <HugeiconsIcon
            icon={FolderLibraryIcon}
            size={24}
            className="text-primary"
          />
          <h2 className="text-xl font-semibold">شجرة التصنيفات</h2>
        </div>
        <div className="flex items-center flex-wrap-reverse justify-end gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            توسيع الكل
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            طي الكل
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openCreateDialog()}>
                <HugeiconsIcon icon={FolderAddIcon} size={18} />
                إضافة تصنيف
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory && editingCategory._id
                    ? "تعديل التصنيف"
                    : "إضافة تصنيف جديد"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory && editingCategory._id
                    ? "قم بتعديل بيانات التصنيف"
                    : "أدخل اسم التصنيف الجديد واختر التصنيف الأب (اختياري)"}
                </DialogDescription>
              </DialogHeader>
              <CategoryForm
                flatCategories={flatCategories}
                defaultValues={
                  editingCategory && editingCategory._id
                    ? {
                        name: editingCategory.name,
                        parentId: editingCategory.parentId || null,
                      }
                    : editingCategory
                      ? {
                          name: "",
                          parentId: editingCategory.parentId || null,
                        }
                      : undefined
                }
                onSubmit={handleSubmit}
                onCancel={() => setDialogOpen(false)}
                isSubmitting={loading}
                mode={
                  editingCategory && editingCategory._id ? "edit" : "create"
                }
                editingCategoryId={editingCategory?._id}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>التصنيفات ({countCategories(categories)})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <HugeiconsIcon
                icon={FolderLibraryIcon}
                size={48}
                className="mb-4 opacity-50"
              />
              <p>لا توجد تصنيفات بعد</p>
              <Button variant="link" onClick={() => openCreateDialog()}>
                إضافة تصنيف جديد
              </Button>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <div className="space-y-1 min-w-max">
                {categories.map((category) => (
                  <TreeItem key={category._id} category={category} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={() => !isDeleting && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد منذف هذا التصنيف؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف التصنيف وجميع البيانات
              المرتبطة به.
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
