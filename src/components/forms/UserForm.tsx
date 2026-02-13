"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";

import {
  userFormSchema,
  userUpdateSchema,
  type UserFormSchema,
  type UserUpdateSchema,
} from "@/lib/schemas";
import { useMaterials } from "@/context/materials-context";
import { useEffect } from "react";

interface UserFormProps {
  defaultValues?: Partial<UserFormSchema | UserUpdateSchema>;
  onSubmit: (data: UserFormSchema | UserUpdateSchema) => Promise<void>;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

export function UserForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  isEditing = false,
}: UserFormProps) {
  const { materials } = useMaterials();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditing ? userUpdateSchema : userFormSchema),
    defaultValues: {
      username: defaultValues?.username || "",
      password: defaultValues?.password || "",
      isAdmin: defaultValues?.isAdmin ?? false,
      canEditCategories: defaultValues?.canEditCategories ?? false,
      assignedMaterials: defaultValues?.assignedMaterials || [],
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const isAdmin = useWatch({ control, name: "isAdmin" });
  const assignedMaterials =
    useWatch({ control, name: "assignedMaterials" }) || [];
  const canEditCategories = useWatch({ control, name: "canEditCategories" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">اسم المستخدم</Label>
        <Input
          id="username"
          {...register("username")}
          disabled={isEditing}
          className={
            errors.username
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.username && (
          <p className="text-xs text-destructive">{errors.username.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">
          {isEditing
            ? "كلمة المرور (اتركها فارغة للإبقاء عليها)"
            : "كلمة المرور"}
        </Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          className={
            errors.password
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>
      <Label className={isAdmin ? "text-muted-foreground" : ""}>
        الصلاحيات
      </Label>
      <div className="flex items-center gap-2">
        <Checkbox
          id="isAdmin"
          checked={isAdmin}
          onCheckedChange={(checked) => {
            const isChecked = checked === true;
            setValue("isAdmin", isChecked);
            if (isChecked) {
              setValue("canEditCategories", false);
              setValue("assignedMaterials", []);
            }
          }}
        />
        <Label htmlFor="isAdmin">مدير النظام (Admin)</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="canEditCategories"
          checked={canEditCategories}
          disabled={isAdmin}
          onCheckedChange={(checked) =>
            setValue("canEditCategories", checked === true)
          }
        />
        <Label
          htmlFor="canEditCategories"
          className={isAdmin ? "text-muted-foreground" : ""}
        >
          صلاحية تعديل التصنيفات
        </Label>
      </div>

      <div className="space-y-3 pt-2">
        <Label className={isAdmin ? "text-muted-foreground" : ""}>
          تعيين المواد (للمستخدمين غير المدراء)
        </Label>
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md ${isAdmin ? "opacity-50 pointer-events-none bg-muted/20" : ""}`}
        >
          {materials.map((material) => (
            <div key={material._id} className="flex items-center gap-2">
              <Checkbox
                id={`material-${material._id}`}
                checked={assignedMaterials.includes(material._id)}
                disabled={isAdmin}
                onCheckedChange={(checked) => {
                  const current = assignedMaterials;
                  const newAssigned = checked
                    ? [...current, material._id]
                    : current.filter((id) => id !== material._id);
                  setValue("assignedMaterials", newAssigned);
                }}
              />
              <Label
                htmlFor={`material-${material._id}`}
                className="cursor-pointer flex items-center gap-2 text-sm font-normal"
              >
                <span className="truncate" title={material.title}>
                  {material.title}
                </span>
              </Label>
            </div>
          ))}
          {materials.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2 text-center py-4">
              لا توجد مواد متاحة
            </p>
          )}
        </div>
        {isAdmin && (
          <p className="text-xs text-muted-foreground">
            * المدراء لديهم صلاحية الوصول لجميع المواد تلقائياً.
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </DialogFooter>
    </form>
  );
}
