"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "nextjs-toploader/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormSchema } from "@/lib/schemas";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormSchema) => {
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("خطأ في تسجيل الدخول", {
          description: "تأكد من اسم المستخدم وكلمة المرور",
        });
      } else {
        toast.success("تم تسجيل الدخول بنجاح");
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 flex h-screen w-full items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold tracking-tight text-primary">
            تسجيل الدخول
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            أدخل بياناتك للدخول إلى لوحة التحكم
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                placeholder="اسم المستخدم"
                className={
                  errors.username
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                {...register("username")}
              />
              {errors.username && (
                <p className="text-xs text-destructive font-medium">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="******"
                className={
                  errors.password
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-4 flex flex-col gap-4">
            <Button
              className="w-full font-bold"
              type="submit"
              disabled={loading}
            >
              {loading ? "جاري التحقق..." : "دخول"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
