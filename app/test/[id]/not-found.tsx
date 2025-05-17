import Link from "next/link";
import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TestNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <FileX className="h-16 w-16 text-muted-foreground mb-6" />
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Test Report Not Found
      </h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        The laboratory test report you're looking for doesn't exist or may have
        been removed.
      </p>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
