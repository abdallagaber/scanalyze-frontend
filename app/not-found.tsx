"use client";

import { useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();

  const getHomeRoute = () => {
    if (pathname.startsWith("/dashboard/admin")) {
      return "/dashboard/admin";
    } else if (pathname.startsWith("/dashboard/lab-technician")) {
      return "/dashboard/lab-technician";
    } else if (pathname.startsWith("/dashboard")) {
      return "/dashboard";
    } else {
      return "/";
    }
  };

  return (
    <div className="absolute top-1/2 left-1/2 mb-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center">
      <span className="from-foreground bg-linear-to-b to-transparent bg-clip-text text-[10rem] leading-none font-extrabold text-transparent">
        404
      </span>
      <h2 className="font-heading my-2 text-2xl font-bold">
        Something&apos;s missing
      </h2>
      <p>
        Sorry, the page you are looking for doesn&apos;t exist or has been
        moved.
      </p>
      <div className="mt-8 flex justify-center gap-2">
        <Button onClick={() => router.back()} variant="default" size="lg">
          Go back
        </Button>
        <Button
          onClick={() => router.push(getHomeRoute())}
          variant="ghost"
          size="lg"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
