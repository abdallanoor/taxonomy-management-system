"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { materialSchema, type MaterialFormSchema } from "@/lib/schemas";

export type MaterialFormData = MaterialFormSchema;

interface MaterialFormProps {
  defaultValues?: Partial<MaterialFormData>;
  onSubmit: (data: MaterialFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  className?: string;
}

export function MaterialForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = "create",
  className,
}: MaterialFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      author: defaultValues?.author || "",
    },
  });

  // Effect to reset form when defaultValues change
  React.useEffect(() => {
    reset({
      title: defaultValues?.title || "",
      author: defaultValues?.author || "",
    });
  }, [defaultValues, reset]);

  const submitLabel = mode === "edit" ? "تحديث" : "حفظ";

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان المادة</Label>
            <Input
              id="title"
              placeholder="مثال: صحيح البخاري"
              className={cn(
                errors.title &&
                  "border-destructive focus-visible:ring-destructive",
              )}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-destructive text-sm">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">المؤلف</Label>
            <Input
              id="author"
              placeholder="مثال: الإمام البخاري"
              className={cn(
                errors.author &&
                  "border-destructive focus-visible:ring-destructive",
              )}
              {...register("author")}
            />
            {errors.author && (
              <p className="text-destructive text-sm">
                {errors.author.message}
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
