import { SidebarProvider } from "@/components/ui/sidebar";
import { Metadata } from "next";
import { createMetadata } from "../shared-metadata";

export const metadata: Metadata = createMetadata(
  "Dashboard - Scanalyze",
  "Manage your medical scans and laboratory tests with Scanalyze's secure dashboard",
  { noIndex: true }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex w-full">
        <SidebarProvider>{children}</SidebarProvider>
      </div>
    </div>
  );
}
