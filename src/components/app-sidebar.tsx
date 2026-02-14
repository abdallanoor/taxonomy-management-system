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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookOpen02Icon,
  BookEditIcon,
  FolderLibraryIcon,
} from "@hugeicons/core-free-icons";
import { usePathname } from "next/navigation";
import { useMaterials } from "@/context/materials-context";

const data = {
  navMain: [
    {
      title: "المواد",
      url: "/",
      icon: <HugeiconsIcon icon={BookEditIcon} strokeWidth={2} />,
      isActive: true,
    },
    {
      title: "التصنيفات",
      url: "/categories",
      icon: <HugeiconsIcon icon={FolderLibraryIcon} strokeWidth={2} />,
    },
  ],
};

import { useSession, signOut } from "next-auth/react";
import { UserGroupIcon, Logout03Icon } from "@hugeicons/core-free-icons";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { materials } = useMaterials();
  const { data: session } = useSession();

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
                  <span className="truncate text-xs">المواد النصية</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>الرئيسية</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain
              .filter((item) => {
                if (item.url === "/categories") {
                  return (
                    session?.user.isAdmin || session?.user.canEditCategories
                  );
                }
                return true;
              })
              .map((item) => (
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
            {session?.user.isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="المستخدمين"
                  isActive={pathname === "/users"}
                >
                  <Link href="/users">
                    <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
                    <span>المستخدمين</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {materials.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>المواد</SidebarGroupLabel>
            <SidebarMenu>
              {materials
                .filter(
                  (material) =>
                    session?.user.isAdmin ||
                    session?.user.assignedMaterials.includes(material._id),
                )
                .map((material) => (
                  <SidebarMenuItem key={material._id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={material.title}
                      isActive={pathname === `/materials/${material._id}`}
                    >
                      <Link href={`/materials/${material._id}`}>
                        <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />
                        <span>{material.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="cursor-pointer"
              tooltip="تسجيل الخروج"
            >
              <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
              <span>تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
