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

// Login Schema
export const loginSchema = z.object({
  username: z.string().min(1, "يرجى إدخال اسم المستخدم").trim(),
  password: z.string().min(1, "يرجى إدخال كلمة المرور"),
});

export type LoginFormSchema = z.infer<typeof loginSchema>;

// User Management Schema (Admin)
// User Management Schema (Admin)
const userBaseSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل").trim(),
  isAdmin: z.boolean().default(false),
  canEditCategories: z.boolean().default(false),
  assignedMaterials: z.array(z.string()).default([]),
});

export const userFormSchema = userBaseSchema.extend({
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export const userUpdateSchema = userBaseSchema.extend({
  password: z.union([
    z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    z.literal(""),
    z.undefined()
  ]).optional(),
});

export type UserFormSchema = z.infer<typeof userFormSchema>;
export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;
