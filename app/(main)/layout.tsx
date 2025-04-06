import { SidebarProvider } from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen h-screen w-full">
      <SidebarProvider className="flex-1 w-full h-full">
        {children}
      </SidebarProvider>
    </div>
  );
}
