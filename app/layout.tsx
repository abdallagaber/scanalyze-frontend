import type { Metadata } from "next";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Scanalyze",
  description:
    "Advanced laboratory testing and medical scans with fast, accurate results",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="">
      <body className="min-h-screen w-full">
        <SidebarProvider>{children}</SidebarProvider>
      </body>
    </html>
  );
}
