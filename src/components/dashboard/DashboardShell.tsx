"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  BookOpen02Icon,
  FolderLibraryIcon,
  Sun02Icon,
  Moon02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { MaterialsProvider } from "@/context/materials-context";
import type { MaterialData } from "@/lib/data";

const navigation = [
  {
    title: "المواد",
    href: "/",
    icon: BookOpen02Icon,
  },
  {
    title: "التصنيفات",
    href: "/categories",
    icon: FolderLibraryIcon,
  },
];

export function DashboardShell({
  children,
  initialMaterials = [],
}: {
  children: React.ReactNode;
  initialMaterials?: MaterialData[];
}) {
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <MaterialsProvider initialMaterials={initialMaterials}>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar side="right" collapsible="icon" />
          <SidebarInset className="overflow-hidden">
            <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
              <SidebarTrigger className="-ms-1" />
              <div>
                <Separator orientation="vertical" className="h-4" />
              </div>
              <h1 className="text-lg font-semibold">
                {navigation.find((item) => item.href === pathname)?.title ||
                  "لوحة التحكم"}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                className="ms-auto h-9 w-9"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="تبديل الوضع"
              >
                <HugeiconsIcon
                  icon={theme === "dark" ? Sun02Icon : Moon02Icon}
                  className="h-[1.2rem] w-[1.2rem] transition-transform duration-300 active:rotate-45"
                />
                <span className="sr-only">تبديل الوضع</span>
              </Button>
            </header>
            <main className="flex-1 p-5">{children}</main>
          </SidebarInset>
          <Toaster position="bottom-left" dir="rtl" />
        </SidebarProvider>
      </TooltipProvider>
    </MaterialsProvider>
  );
}
