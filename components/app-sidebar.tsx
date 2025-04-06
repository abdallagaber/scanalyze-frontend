"use client";

import * as React from "react";
import { Home, Users, Microscope, ClipboardList } from "lucide-react";
import { usePathname } from "next/navigation";

import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Overview",
      url: "/dashboard/admin",
      icon: Home,
    },
    {
      title: "Patients",
      url: "/dashboard/admin/patients",
      icon: Users,
    },
    {
      title: "Lab Technicians",
      url: "/dashboard/admin/lab-technicians",
      icon: Microscope,
    },
    {
      title: "Receptionists",
      url: "/dashboard/admin/receptionists",
      icon: ClipboardList,
    },
  ].map((item) => ({
    ...item,
    isActive: pathname === item.url,
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Home className="size-4" />
          </div>
          <span className="font-semibold">Scanalyze</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
