"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { CascadingCategorySelector } from "@/components/CascadingCategorySelector";
import type { CategoryTreeData } from "@/lib/data";
import { cn } from "@/lib/utils";
import { segmentSchema, type SegmentFormSchema } from "@/lib/schemas";

export type SegmentFormData = SegmentFormSchema;

interface SegmentFormProps {
  categories: CategoryTreeData[];
  defaultValues?: Partial<SegmentFormData>;
  onSubmit: (data: SegmentFormData) => Promise<void | boolean>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  className?: string;
}

export function SegmentForm({
  categories,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = "create",
  className,
}: SegmentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<SegmentFormData>({
    resolver: zodResolver(segmentSchema),
    defaultValues: {
      materialId: defaultValues?.materialId || "",
      pageNumber: defaultValues?.pageNumber || "",
      content: defaultValues?.content || "",
      categoryId: defaultValues?.categoryId || null,
    },
  });

  // Effect to reset form when defaultValues change (e.g. switching between edit/create modes)
  React.useEffect(() => {
    if (!isSubmitting) {
      reset({
        materialId: defaultValues?.materialId || "",
        pageNumber: defaultValues?.pageNumber || "",
        content: defaultValues?.content || "",
        categoryId: defaultValues?.categoryId || null,
      });
    }
  }, [
    defaultValues?.materialId,
    defaultValues?.pageNumber,
    defaultValues?.content,
    defaultValues?.categoryId,
    reset,
    isSubmitting,
  ]);

  const handleLocalSubmit = async (data: SegmentFormData) => {
    const result = await onSubmit(data);
    if (result !== false && mode === "create") {
      // Return to (keep) pageNumber after successful creation
      reset({
        ...defaultValues,
        pageNumber: data.pageNumber,
        content: "",
        categoryId: data.categoryId,
      });
      setTimeout(() => setFocus("content"), 0);
    }
  };

  const submitLabel = mode === "edit" ? "تحديث الفقرة" : "حفظ الفقرة";

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(handleLocalSubmit)} className="space-y-4">
        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content">نص الفقرة</Label>
          <Textarea
            id="content"
            placeholder="أدخل نص الفقرة هنا..."
            className={cn(
              "min-h-[120px] leading-relaxed resize-y",
              errors.content &&
                "border-destructive focus-visible:ring-destructive",
            )}
            {...register("content")}
          />
          {errors.content && (
            <p className="text-destructive text-sm">{errors.content.message}</p>
          )}
        </div>

        {/* Page Number */}
        <div className="space-y-2">
          <Label htmlFor="pageNumber">رقم الصفحة</Label>
          <Input
            id="pageNumber"
            type="number"
            min="1"
            placeholder="مثال: 42"
            className={
              errors.pageNumber
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }
            {...register("pageNumber")}
          />
          {errors.pageNumber && (
            <p className="text-destructive text-sm">
              {errors.pageNumber.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>التصنيف</Label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <CascadingCategorySelector
                categories={categories}
                value={field.value || null}
                onChange={field.onChange}
                placeholder="اختر تصنيف الفقرة..."
              />
            )}
          />
        </div>

        <div className="flex gap-2 justify-end items-center">
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
        </div>
      </form>
    </div>
  );
}
