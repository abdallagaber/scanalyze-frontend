import { SidebarProvider } from "@/components/ui/sidebar";
import { Metadata } from "next";
import { createMetadata } from "../shared-metadata";

// This metadata will be used specifically for the landing page
// Using the hero section content for better link previews
export const metadata: Metadata = {
  ...createMetadata(
    "Scanalyze",
    "Scanalyze delivers cutting-edge laboratory testing and medical imaging with fast, accurate results. Your complete health information at your fingertips."
  ),
  // Override with content specific to the hero section for better previews
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://scanalyze-fcds.vercel.app",
    title: "Advanced Medical Diagnostics Simplified",
    description:
      "Cutting-edge laboratory testing and medical imaging with fast, accurate results. Your complete health information at your fingertips.",
    siteName: "Scanalyze Medical",
    images: [
      {
        url: "/api/og?title=Advanced%20Medical%20Diagnostics",
        width: 1200,
        height: 630,
        alt: "Advanced Medical Diagnostics Simplified",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Advanced Medical Diagnostics Simplified",
    description:
      "Cutting-edge laboratory testing and medical imaging with fast, accurate results.",
    images: ["/api/og?title=Advanced%20Medical%20Diagnostics"],
    creator: "@scanalyze",
  },
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="h-screen w-full">{children}</div>;
}
