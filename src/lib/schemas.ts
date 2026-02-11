import * as z from "zod";

// Material Schema
export const materialSchema = z.object({
  title: z.string().min(1, "يرجى إدخال عنوان المادة").trim(),
  author: z.string().min(1, "يرجى إدخال اسم المؤلف").trim(),
});

export type MaterialFormSchema = z.infer<typeof materialSchema>;

// Category Schema
export const categorySchema = z.object({
  name: z.string().min(1, "يرجى إدخال اسم التصنيف").trim(),
  parentId: z.string().nullable().optional(),
});

export type CategoryFormSchema = z.infer<typeof categorySchema>;

// Segment Schema (from SegmentForm)
export const segmentSchema = z.object({
  materialId: z.string().min(1, "يرجى اختيار المادة"),
  pageNumber: z.string().min(1, "يرجى إدخال رقم الصفحة"),
  content: z.string().min(1, "يرجى إدخال نص الفقرة"),
  categoryId: z.string().nullable().optional(),
});

export type SegmentFormSchema = z.infer<typeof segmentSchema>;
