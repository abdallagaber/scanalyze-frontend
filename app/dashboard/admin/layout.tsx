import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumbItems?: {
    title: string;
    href: string;
  }[];
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="grid h-screen w-full grid-cols-[auto_1fr]">
        <AppSidebar />
        <main className="min-w-0 h-full overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
