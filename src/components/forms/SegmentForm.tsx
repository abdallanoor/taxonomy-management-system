"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CascadingCategorySelector } from "@/components/CascadingCategorySelector";
import type { MaterialData, CategoryTreeData } from "@/lib/data";
import { cn } from "@/lib/utils";
import { segmentSchema, type SegmentFormSchema } from "@/lib/schemas";

export interface SegmentFormData extends SegmentFormSchema {}

interface SegmentFormProps {
  materials?: MaterialData[];
  categories: CategoryTreeData[];
  defaultValues?: Partial<SegmentFormData>;
  onSubmit: (data: SegmentFormData) => Promise<void | boolean>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  className?: string;
}

export function SegmentForm({
  materials = [],
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
    reset({
      materialId: defaultValues?.materialId || "",
      pageNumber: defaultValues?.pageNumber || "",
      content: defaultValues?.content || "",
      categoryId: defaultValues?.categoryId || null,
    });
  }, [defaultValues, reset]);

  const handleLocalSubmit = async (data: SegmentFormData) => {
    const result = await onSubmit(data);
    if (result !== false && mode === "create") {
      reset();
    }
  };

  const submitLabel = mode === "edit" ? "تحديث الفقرة" : "حفظ الفقرة";

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(handleLocalSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Material Selection */}
          <div className="space-y-2">
            <Label htmlFor="material">المادة (الكتاب)</Label>
            <Controller
              name="materialId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="material"
                    className={cn(
                      "max-w-full w-full truncate",
                      errors.materialId &&
                        "border-destructive focus:ring-destructive",
                    )}
                  >
                    <SelectValue placeholder="اختر المادة..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material._id} value={material._id}>
                        {material.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.materialId && (
              <p className="text-destructive text-sm">
                {errors.materialId.message}
              </p>
            )}
          </div>

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
        </div>

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
