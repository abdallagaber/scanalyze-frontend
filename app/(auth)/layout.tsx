import type { Metadata } from "next";
import "../globals.css";
import { createMetadata } from "../shared-metadata";

export const metadata: Metadata = createMetadata(
  "Scanalyze",
  "Login or create an account with Scanalyze"
);

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen w-full">{children}</div>;
}
