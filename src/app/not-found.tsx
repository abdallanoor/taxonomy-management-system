import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <h1 className="text-9xl font-bold tracking-tighter text-primary/20 select-none">
        404
      </h1>
      <div className="space-y-4 max-w-md">
        <h2 className="text-3xl font-bold tracking-tight">الصفحة غير موجودة</h2>
        <p className="text-muted-foreground text-lg">
          عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. يرجى التحقق من
          الرابط أو العودة للصفحة الرئيسية.
        </p>
      </div>
      <Button asChild size="lg" className="mt-8 gap-2">
        <Link href="/">العودة للرئيسية</Link>
      </Button>
    </div>
  );
}
