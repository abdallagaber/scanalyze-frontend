"use client";

import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PatientNotFound() {
  return (
    <div className="container py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto">
      <UserX className="h-24 w-24 text-muted-foreground mb-6" />
      <h1 className="text-3xl font-bold tracking-tight mb-3">
        Patient Not Found
      </h1>
      <p className="text-muted-foreground mb-8">
        The patient profile you're looking for doesn't exist or may have been
        removed. Please check the ID and try again.
      </p>
      <Button asChild>
        <Link href="/" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Return to Home
        </Link>
      </Button>
    </div>
  );
}
