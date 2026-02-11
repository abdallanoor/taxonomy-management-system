"use client";

import * as React from "react";

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookOpen02Icon,
  TextIcon,
  FolderLibraryIcon,
} from "@hugeicons/core-free-icons";
import { usePathname } from "next/navigation";

const data = {
  navMain: [
    {
      title: "إدخال البيانات",
      url: "/",
      icon: <HugeiconsIcon icon={TextIcon} strokeWidth={2} />,
      isActive: true,
    },
    {
      title: "إدارة المواد",
      url: "/materials",
      icon: <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />,
    },
    {
      title: "إدارة التصنيفات",
      url: "/categories",
      icon: <HugeiconsIcon icon={FolderLibraryIcon} strokeWidth={2} />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <HugeiconsIcon
                    icon={FolderLibraryIcon}
                    strokeWidth={2}
                    className="size-4"
                  />
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">نظام التصنيف</span>
                  <span className="truncate text-xs">إدارة المواد النصية</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={pathname === item.url}
                >
                  <Link href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
