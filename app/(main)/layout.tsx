import { SidebarProvider } from "@/components/ui/sidebar";
import { Metadata } from "next";
import { createMetadata } from "../shared-metadata";

export const metadata: Metadata = createMetadata(
  "Scanalyze",
  "Scanalyze delivers cutting-edge laboratory testing and medical imaging with fast, accurate results. Your complete health information at your fingertips."
);

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="h-screen w-full">{children}</div>;
}
