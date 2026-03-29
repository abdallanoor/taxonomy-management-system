"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Delete02Icon,
  Cancel01Icon,
  Edit02Icon,
  FolderLibraryIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  FolderAddIcon,
  Loading03Icon,
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
import {
  useCategoriesTreeQuery,
  useFlatCategoriesQuery,
  useCategoryMutations,
} from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Bulk Create Dialog ──────────────────────────────────────────────────────

interface BulkCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flatCategories: CategoryData[];
  defaultParentId?: string | null;
  isPending: boolean;
  onBulkCreate: (
    categories: { name: string; parentId: string | null }[],
  ) => void;
}

function BulkCreateDialog({
  open,
  onOpenChange,
  flatCategories,
  defaultParentId,
  isPending,
  onBulkCreate,
}: BulkCreateDialogProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [parentId, setParentId] = React.useState<string | null>(
    defaultParentId ?? null,
  );
  const [preview, setPreview] = React.useState<string[]>([]);
  const [previewVisible, setPreviewVisible] = React.useState(false);

  // Reset when dialog opens
  React.useEffect(() => {
    if (open) {
      if (textareaRef.current) textareaRef.current.value = "";
      setParentId(defaultParentId ?? null);
      setPreview([]);
      setPreviewVisible(false);
    }
  }, [open, defaultParentId]);

  /** Parse textarea value into unique non-empty names */
  const parseNames = (raw: string): string[] => {
    const names: string[] = [];
    raw.split("\n").forEach((line) => {
      line.split(/[,،]/).forEach((part) => {
        const trimmed = part.trim();
        if (trimmed) names.push(trimmed);
      });
    });
    const seen = new Set<string>();
    return names.filter((n) => {
      const key = n.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const handlePreview = () => {
    const raw = textareaRef.current?.value ?? "";
    const names = parseNames(raw);
    if (names.length === 0) {
      toast.error("يرجى إدخال اسم تصنيف واحد على الأقل");
      return;
    }
    setPreview(names);
    setPreviewVisible(true);
  };

  const removeFromPreview = (index: number) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (preview.length === 0) {
      toast.error("لا توجد تصنيفات للحفظ");
      return;
    }
    const payload = preview.map((name) => ({ name, parentId }));
    await onBulkCreate(payload);
    onOpenChange(false);
  };

  return (
    <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>إضافة تصنيفات جديدة</DialogTitle>
        <DialogDescription>
          أدخل أسماء التصنيفات مفصولة بفواصل أو في سطور منفصلة
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 py-2 px-1">
        {/* Parent selector */}
        <div className="space-y-2">
          <Label htmlFor="bulk-parent">التصنيف الأب (اختياري)</Label>
          <Select
            value={parentId ?? "none"}
            onValueChange={(v) => setParentId(v === "none" ? null : v)}
          >
            <SelectTrigger id="bulk-parent" className="max-w-full truncate">
              <SelectValue placeholder="بدون أب (تصنيف رئيسي)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون أب (تصنيف رئيسي)</SelectItem>
              {flatCategories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Textarea input */}
        <div className="space-y-2">
          <Label htmlFor="bulk-names">أسماء التصنيفات</Label>
          <Textarea
            ref={textareaRef}
            id="bulk-names"
            placeholder="علوم القرآن، فقه العبادات، التفسير، الحديث النبوي"
            defaultValue=""
            onChange={() => {
              if (previewVisible) setPreviewVisible(false);
            }}
            disabled={isPending}
            rows={5}
            className="min-h-10! resize-none font-medium"
          />
          <p className="text-xs text-muted-foreground">
            يمكنك الفصل بالفاصلة (,) أو الفاصلة العربية (،) أو بسطر جديد
          </p>
        </div>

        {/* Preview chips */}
        {previewVisible && preview.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>معاينة ({preview.length} تصنيف)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setPreviewVisible(false);
                  setPreview([]);
                }}
              >
                تعديل
              </Button>
            </div>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {preview.map((name, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="flex items-center gap-1 pl-1 pr-2 py-1 text-sm"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeFromPreview(i)}
                      disabled={isPending}
                      className="opacity-80 hover:opacity-100 transition-all rounded-sm focus:outline-none focus:ring-1 focus:ring-ring ml-1"
                      aria-label={`حذف ${name}`}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            {preview.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                لا توجد تصنيفات — أعد الكتابة
              </p>
            )}
          </div>
        )}
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          إلغاء
        </Button>
        {previewVisible && preview.length > 0 ? (
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "جاري الحفظ..." : `حفظ ${preview.length} تصنيف`}
          </Button>
        ) : (
          <Button type="button" onClick={handlePreview} disabled={isPending}>
            معاينة
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

// ─── Edit Single Category Dialog ─────────────────────────────────────────────

interface EditDialogContentProps {
  editingCategory: CategoryData;
  flatCategories: CategoryData[];
  isPending: boolean;
  onSubmit: (formData: CategoryFormData) => void;
  onClose: () => void;
}

function EditDialogContent({
  editingCategory,
  flatCategories,
  isPending,
  onSubmit,
  onClose,
}: EditDialogContentProps) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>تعديل التصنيف</DialogTitle>
        <DialogDescription>قم بتعديل بيانات التصنيف</DialogDescription>
      </DialogHeader>
      <CategoryForm
        flatCategories={flatCategories}
        defaultValues={{
          name: editingCategory.name,
          parentId: editingCategory.parentId || null,
        }}
        onSubmit={onSubmit}
        onCancel={onClose}
        isSubmitting={isPending}
        mode="edit"
        editingCategoryId={editingCategory._id}
      />
    </DialogContent>
  );
}

// ─── TreeItem (outside parent — never re-created on re-render) ───────────────

interface TreeItemProps {
  category: CategoryTreeData;
  level?: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onOpenCreate: (category: CategoryData) => void;
  onOpenEdit: (category: CategoryData) => void;
  onDelete: (id: string) => void;
}

const TreeItem = React.memo(function TreeItem({
  category,
  level = 0,
  expandedIds,
  onToggle,
  onOpenCreate,
  onOpenEdit,
  onDelete,
}: TreeItemProps) {
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
        onClick={() => hasChildren && onToggle(category._id)}
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

        {/* Action buttons */}
        <div
          className="flex items-center gap-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              onOpenCreate({
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
              onOpenEdit({
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
            onClick={() => onDelete(category._id)}
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1 pr-2">
          {category.children!.map((child) => (
            <TreeItem
              key={child._id}
              category={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onOpenCreate={onOpenCreate}
              onOpenEdit={onOpenEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Main CategoriesClient ───────────────────────────────────────────────────

export function CategoriesClient() {
  const { data: categories = [], isLoading: isTreeLoading } =
    useCategoriesTreeQuery();
  const { data: flatCategories = [] } = useFlatCategoriesQuery();
  const {
    createCategory,
    bulkCreateCategories,
    updateCategory,
    deleteCategory,
    isPending,
  } = useCategoryMutations();

  // Dialog state: null = closed, "bulk-create" = create mode, CategoryData = edit mode
  const [dialogMode, setDialogMode] = React.useState<
    null | "bulk-create" | CategoryData
  >(null);
  const [defaultParentId, setDefaultParentId] = React.useState<string | null>(
    null,
  );

  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const openCreateDialog = React.useCallback(
    (parentCategory?: CategoryData) => {
      setDefaultParentId(parentCategory?._id ?? null);
      setDialogMode("bulk-create");
    },
    [],
  );

  const openEditDialog = React.useCallback((category: CategoryData) => {
    setDefaultParentId(null);
    setDialogMode(category);
  }, []);

  const closeDialog = React.useCallback(() => setDialogMode(null), []);

  const handleBulkCreate = React.useCallback(
    (payload: { name: string; parentId: string | null }[]) => {
      if (payload.length === 1) {
        createCategory({
          name: payload[0].name,
          parentId: payload[0].parentId,
        });
      } else {
        bulkCreateCategories(payload);
      }
    },
    [createCategory, bulkCreateCategories],
  );

  const handleEditSubmit = React.useCallback(
    (formData: CategoryFormData) => {
      const editing = dialogMode as CategoryData;
      if (!formData.name.trim()) {
        toast.error("يرجى إدخال اسم التصنيف");
        return;
      }
      updateCategory(
        {
          id: editing._id,
          payload: {
            name: formData.name,
            parentId: formData.parentId || null,
          },
        },
        {
          onSuccess: () => closeDialog(),
        },
      );
    },
    [dialogMode, updateCategory, closeDialog],
  );

  const confirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deletingId) return;
    deleteCategory(deletingId, {
      onSuccess: () => setDeletingId(null),
    });
  };

  const toggleExpand = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

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

  const handleDelete = React.useCallback((id: string) => {
    setDeletingId(id);
  }, []);

  const isEditMode = dialogMode !== null && dialogMode !== "bulk-create";
  const isBulkCreateMode = dialogMode === "bulk-create";

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
          {categories?.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={expandAll}>
                توسيع الكل
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                طي الكل
              </Button>
            </>
          )}

          {/* Single Dialog used for both create (bulk) and edit (single) */}
          <Dialog
            open={dialogMode !== null}
            onOpenChange={(open) => !open && closeDialog()}
          >
            <DialogTrigger asChild>
              <Button onClick={() => openCreateDialog()}>
                <HugeiconsIcon icon={FolderAddIcon} size={18} />
                إضافة تصنيف
              </Button>
            </DialogTrigger>

            {isBulkCreateMode && (
              <BulkCreateDialog
                open={isBulkCreateMode}
                onOpenChange={(open) => !open && closeDialog()}
                flatCategories={flatCategories}
                defaultParentId={defaultParentId}
                isPending={isPending}
                onBulkCreate={handleBulkCreate}
              />
            )}

            {isEditMode && (
              <EditDialogContent
                editingCategory={dialogMode as CategoryData}
                flatCategories={flatCategories}
                isPending={isPending}
                onSubmit={handleEditSubmit}
                onClose={closeDialog}
              />
            )}
          </Dialog>
        </div>
      </div>

      {isTreeLoading ? (
        <div className="space-y-3 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 py-3 px-4 rounded-lg bg-muted/30 border border-muted/50"
            >
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-4 w-1/4" />
              <div className="flex-1" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-7 w-7" />
                <Skeleton className="h-7 w-7" />
                <Skeleton className="h-7 w-7" />
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
          <HugeiconsIcon
            icon={FolderLibraryIcon}
            size={48}
            className="opacity-50 mb-3"
          />
          <p>لا توجد تصنيفات بعد</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-auto">
          <div className="space-y-1 min-w-max">
            {categories.map((category) => (
              <TreeItem
                key={category._id}
                category={category}
                expandedIds={expandedIds}
                onToggle={toggleExpand}
                onOpenCreate={openCreateDialog}
                onOpenEdit={openEditDialog}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      <AlertDialog
        open={!!deletingId}
        onOpenChange={() => !isPending && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              هل أنت متأكد من حذف هذا التصنيف؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف التصنيف وجميع البيانات
              المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
