"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserAdd01Icon,
  Delete02Icon,
  PencilEdit02Icon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { UserForm } from "@/components/forms/UserForm";
import type { UserFormSchema, UserUpdateSchema } from "@/lib/schemas";
import { useMaterials } from "@/context/materials-context";
import { UserData } from "@/lib/data";
import { useRouter } from "next/navigation";

interface UsersClientProps {
  initialUsers: UserData[];
}

export function UsersClient({ initialUsers }: UsersClientProps) {
  const { materials } = useMaterials();
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const router = useRouter();

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (user: UserData) => {
    setEditingUser(user);
    setIsOpen(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("تم حذف المستخدم بنجاح");
        setUsers((prev) => prev.filter((u) => u._id !== id));
        router.refresh();
        setDeletingUserId(null);
      } else {
        toast.error("فشل في حذف المستخدم");
      }
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: UserFormSchema | UserUpdateSchema) => {
    setIsSubmitting(true);
    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(editingUser ? "تم تحديث المستخدم" : "تم إنشاء المستخدم");

        router.refresh();

        // Optimistic update or refetch
        const newUsersRes = await fetch("/api/users");
        if (newUsersRes.ok) {
          const newUsers = await newUsersRes.json();
          setUsers(newUsers);
        }
        setIsOpen(false);
      } else {
        const responseData = await res.json();
        toast.error(responseData.error || "حدث خطأ");
      }
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={UserGroupIcon}
            size={24}
            className="text-primary"
          />
          <h2 className="text-xl font-semibold">إدارة المستخدمين</h2>
        </div>
        <Button onClick={handleOpenCreate}>
          <HugeiconsIcon icon={UserAdd01Icon} size={18} />
          إضافة مستخدم
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">اسم المستخدم</TableHead>
            <TableHead className="text-right">الصلاحيات</TableHead>
            <TableHead className="text-right">المواد المعينة</TableHead>
            <TableHead className="text-right w-[100px]">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-12 text-muted-foreground"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <HugeiconsIcon
                    icon={UserIcon}
                    size={32}
                    className="opacity-20"
                  />
                  <p>لا يوجد مستخدمين</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <HugeiconsIcon icon={UserIcon} size={16} />
                    </div>
                    {user.username}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {user.isAdmin && <Badge>مدير النظام</Badge>}
                    {user.canEditCategories && (
                      <Badge variant="secondary">تعديل التصنيفات</Badge>
                    )}
                    {!user.isAdmin && user.assignedMaterials?.length > 0 && (
                      <Badge variant="secondary">مواد محددة</Badge>
                    )}
                    {!user.isAdmin &&
                      !user.canEditCategories &&
                      user.assignedMaterials?.length === 0 && (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          لا يوجد صلاحيات
                        </Badge>
                      )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <Badge variant="outline">جميع المواد</Badge>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {user.assignedMaterials?.length > 0 ? (
                        user.assignedMaterials.map((materialId) => {
                          const material = materials.find(
                            (m) => m._id === materialId,
                          );
                          return material ? (
                            <Badge key={material._id} variant="outline">
                              {material.title}
                            </Badge>
                          ) : (
                            <Badge key={materialId} variant="destructive">
                              مادة محذوفة
                            </Badge>
                          );
                        })
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          لا يوجد مواد
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(user)}
                      title="تعديل"
                      className="h-8 w-8"
                    >
                      <HugeiconsIcon icon={PencilEdit02Icon} size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingUserId(user._id)}
                      title="حذف"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && isSubmitting) return;
          setIsOpen(open);
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            onSubmit={handleFormSubmit}
            isEditing={!!editingUser}
            isSubmitting={isSubmitting}
            defaultValues={
              editingUser
                ? {
                    username: editingUser.username,
                    isAdmin: editingUser.isAdmin,
                    canEditCategories: editingUser.canEditCategories,
                    assignedMaterials: editingUser.assignedMaterials,
                  }
                : undefined
            }
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingUserId}
        onOpenChange={(open) => !open && !isDeleting && setDeletingUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              هل أنت متأكد من حذف هذا المستخدم؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيتم حذف بيانات المستخدم وصلاحياته
              نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (deletingUserId) handleDelete(deletingUserId);
              }}
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
