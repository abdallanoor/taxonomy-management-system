"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CategoryData } from "@/lib/data";
import { categorySchema, type CategoryFormSchema } from "@/lib/schemas";

export type CategoryFormData = CategoryFormSchema;

interface CategoryFormProps {
  flatCategories: CategoryData[];
  defaultValues?: Partial<CategoryFormData>;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  editingCategoryId?: string; // To exclude from parent selection
  className?: string;
}

export function CategoryForm({
  flatCategories,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = "create",
  editingCategoryId,
  className,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: defaultValues?.name || "",
      parentId: defaultValues?.parentId || null,
    },
  });

  // Effect to reset form when defaultValues change
  React.useEffect(() => {
    reset({
      name: defaultValues?.name || "",
      parentId: defaultValues?.parentId || null,
    });
  }, [defaultValues, reset]);

  const submitLabel = mode === "edit" ? "تحديث" : "حفظ";

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم التصنيف</Label>
            <Input
              id="name"
              placeholder="مثال: علوم القرآن"
              className={cn(
                errors.name &&
                  "border-destructive focus-visible:ring-destructive",
              )}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent">التصنيف الأب (اختياري)</Label>
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) => {
                    field.onChange(value === "none" ? null : value);
                  }}
                >
                  <SelectTrigger
                    id="parent"
                    className={cn(
                      "max-w-full truncate",
                      errors.parentId &&
                        "border-destructive focus:ring-destructive",
                    )}
                  >
                    <SelectValue placeholder="بدون أب (تصنيف رئيسي)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون أب (تصنيف رئيسي)</SelectItem>
                    {flatCategories
                      .filter((c) => c._id !== editingCategoryId)
                      .map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.parentId && (
              <p className="text-destructive text-sm">
                {errors.parentId.message}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "جاري الحفظ..." : submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
}
