"use client";

import * as React from "react";
import {
  Home,
  Users,
  Microscope,
  ClipboardList,
  FileText,
  Calendar,
  Settings,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { NavUser } from "@/components/nav-user";
import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";

type Role = "admin" | "lab-technician" | "receptionist";

const navigationConfig: Record<
  Role,
  Array<{
    title: string;
    url: string;
    icon: typeof Home;
  }>
> = {
  admin: [
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
  ],
  "lab-technician": [
    {
      title: "Overview",
      url: "/dashboard/lab-technician",
      icon: Home,
    },
    {
      title: "Patients",
      url: "/dashboard/lab-technician/patients",
      icon: Users,
    },
    {
      title: "Tests & Scans",
      url: "/dashboard/lab-technician/tests",
      icon: Microscope,
    },
    {
      title: "Reports",
      url: "/dashboard/lab-technician/reports",
      icon: FileText,
    },
    {
      title: "Schedule",
      url: "/dashboard/lab-technician/schedule",
      icon: Calendar,
    },
    {
      title: "Settings",
      url: "/dashboard/lab-technician/settings",
      icon: Settings,
    },
  ],
  receptionist: [
    {
      title: "Overview",
      url: "/dashboard/receptionist",
      icon: Home,
    },
    {
      title: "Appointments",
      url: "/dashboard/receptionist/appointments",
      icon: Calendar,
    },
    {
      title: "Patients",
      url: "/dashboard/receptionist/patients",
      icon: Users,
    },
    {
      title: "Reports",
      url: "/dashboard/receptionist/reports",
      icon: FileText,
    },
  ],
};

const roleIcons: Record<Role, typeof Home> = {
  admin: Home,
  "lab-technician": Microscope,
  receptionist: ClipboardList,
};

const roleTitles: Record<Role, string> = {
  admin: "Admin Dashboard",
  "lab-technician": "Lab Dashboard",
  receptionist: "Reception",
};

interface DashboardSidebarClientProps
  extends React.ComponentProps<typeof Sidebar> {
  role: Role;
  user: {
    name: string;
    email: string;
    avatar: string;
  } | null;
}

export function DashboardSidebarClient({
  role,
  user,
  ...props
}: DashboardSidebarClientProps) {
  const pathname = usePathname();

  const Icon = roleIcons[role];
  const navItems = navigationConfig[role].map((item) => ({
    ...item,
    isActive: pathname === item.url,
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Icon className="size-4" />
          </div>
          <span className="font-semibold">{roleTitles[role]}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>{user ? <NavUser user={user} /> : null}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
