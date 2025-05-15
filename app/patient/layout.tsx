import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";
import { Inter } from "next/font/google";
import "../globals.css";
import { createMetadata } from "../shared-metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = createMetadata(
  "Patient Profile | Scanalyze",
  "View patient profile, medical history, tests and scans",
  { noIndex: true }
);

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="border-b bg-background">
            <div className="container py-4 flex items-center justify-between">
              <Link
                href="/"
                className="text-xl font-bold tracking-tight flex items-center gap-2"
              >
                <Image
                  src="/images/icon.png"
                  alt="Scanalyze Logo"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
                <span className="text-primary font-bold">Scanalyze</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 flex flex-col">{children}</main>

          {/* Footer */}
          <footer className="border-t bg-muted/40">
            <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Image
                  src="/images/icon.png"
                  alt="Scanalyze Logo"
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
                © {new Date().getFullYear()} Scanalyze. All rights reserved.
              </div>
              <div className="flex gap-4 text-sm">
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
