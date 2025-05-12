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
  Scan,
  User,
  Activity,
  History,
  TestTube,
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

type Role =
  | "admin"
  | "lab-technician"
  | "receptionist"
  | "scan-technician"
  | "patient";

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
      title: "Scan Technicians",
      url: "/dashboard/admin/scan-technicians",
      icon: Scan,
    },
    {
      title: "Receptionists",
      url: "/dashboard/admin/receptionists",
      icon: ClipboardList,
    },
  ],
  "lab-technician": [
    {
      title: "Add Test",
      url: "/dashboard/lab-technician/tests",
      icon: Microscope,
    },
  ],
  receptionist: [
    {
      title: "Overview",
      url: "/dashboard/receptionist",
      icon: Home,
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
  "scan-technician": [
    {
      title: "Add Scan",
      url: "/dashboard/scan-technician/add-scan",
      icon: Scan,
    },
  ],
  patient: [
    {
      title: "Overview",
      url: "/dashboard/patient",
      icon: Home,
    },
    {
      title: "Scan Results",
      url: "/dashboard/patient/scans",
      icon: Activity,
    },
    {
      title: "Laboratory Tests",
      url: "/dashboard/patient/tests",
      icon: TestTube,
    },
    {
      title: "Medical History",
      url: "/dashboard/patient/history",
      icon: History,
    },
    {
      title: "Profile",
      url: "/dashboard/patient/profile",
      icon: User,
    },
  ],
};

const roleIcons: Record<Role, typeof Home> = {
  admin: Home,
  "lab-technician": Microscope,
  receptionist: ClipboardList,
  "scan-technician": Scan,
  patient: User,
};

const roleTitles: Record<Role, string> = {
  admin: "Admin Dashboard",
  "lab-technician": "Lab Dashboard",
  receptionist: "Reception",
  "scan-technician": "Scan Dashboard",
  patient: "Patient Portal",
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
