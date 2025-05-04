"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const loadingSpinnerVariants = cva("animate-spin rounded-full border-solid", {
  variants: {
    size: {
      sm: "h-6 w-6 border-2",
      md: "h-10 w-10 border-3",
      lg: "h-16 w-16 border-4",
      xl: "h-24 w-24 border-4",
    },
    color: {
      primary: "border-primary border-t-transparent",
      scanalyze: "border-scanalyze-600 border-t-transparent",
      white: "border-white border-t-transparent",
    },
  },
  defaultVariants: {
    size: "md",
    color: "scanalyze",
  },
});

interface SpinnerProps extends VariantProps<typeof loadingSpinnerVariants> {
  className?: string;
}

export function Spinner({ size, color, className }: SpinnerProps) {
  return (
    <div
      className={cn(loadingSpinnerVariants({ size, color }), className)}
      role="status"
      aria-label="Loading"
    />
  );
}

interface FullScreenLoadingProps {
  show: boolean;
  message?: string;
  blur?: boolean;
}

export function FullScreenLoading({
  show,
  message = "Loading...",
  blur = true,
}: FullScreenLoadingProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/30",
        blur && "backdrop-blur-sm"
      )}
    >
      <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white/90 p-8 shadow-lg">
        <Spinner size="lg" color="scanalyze" />
        {message && (
          <p className="text-center text-base font-medium text-scanalyze-800">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
