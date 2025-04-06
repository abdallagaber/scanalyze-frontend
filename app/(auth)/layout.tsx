import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Authentication - Scanalyze",
  description: "Login or create an account with Scanalyze",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen w-full">{children}</div>;
}
