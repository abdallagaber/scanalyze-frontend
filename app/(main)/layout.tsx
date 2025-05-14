import { SidebarProvider } from "@/components/ui/sidebar";
import { Metadata } from "next";
import { createMetadata } from "../shared-metadata";

// This metadata will be used specifically for the landing page
// Using the hero section content for better link previews
export const metadata: Metadata = createMetadata(
  "Scanalyze",
  "Scanalyze delivers cutting-edge laboratory testing and medical imaging with fast, accurate results. Your complete health information at your fingertips.",
  { isLandingPage: true }
);

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="h-screen w-full">{children}</div>;
}
