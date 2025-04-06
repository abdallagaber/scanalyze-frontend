import { SidebarProvider } from "@/components/ui/sidebar";

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
