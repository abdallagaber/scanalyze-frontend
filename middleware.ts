import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Cookies from "js-cookie";

// Define the paths that need role-based protection
const protectedPaths = {
  Admin: [
    "/dashboard/admin",
    "/dashboard/admin/patients",
    "/dashboard/admin/lab-technicians",
    "/dashboard/admin/receptionists",
  ],
  LabTechnician: [
    "/dashboard/lab-technician",
    "/dashboard/lab-technician/patients",
    "/dashboard/lab-technician/tests",
    "/dashboard/lab-technician/reports",
    "/dashboard/lab-technician/schedule",
    "/dashboard/lab-technician/settings",
  ],
  Receptionist: [
    "/dashboard/receptionist",
    "/dashboard/receptionist/appointments",
    "/dashboard/receptionist/patients",
    "/dashboard/receptionist/reports",
  ],
};

// Define public paths that don't require authentication
const publicPaths = ["/login", "/login/staff", "/register"];

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("role")?.value;
  const token = request.cookies.get("token")?.value;

  // Handle /dashboard route
  if (pathname === "/dashboard") {
    if (!role || !token) {
      return NextResponse.redirect(new URL("/not-found", request.url));
    }
    const redirectPath =
      role === "Admin"
        ? "/dashboard/admin"
        : role === "LabTechnician"
        ? "/dashboard/lab-technician"
        : "/dashboard/receptionist";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Check if user is trying to access a public path while authenticated
  if (publicPaths.includes(pathname) && role && token) {
    // Redirect to appropriate dashboard based on role
    const redirectPath =
      role === "Admin"
        ? "/dashboard/admin"
        : role === "LabTechnician"
        ? "/dashboard/lab-technician"
        : "/dashboard/receptionist";

    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Check if the path is a protected dashboard path
  const isProtectedPath = Object.values(protectedPaths).some((paths) =>
    paths.some((path) => pathname.startsWith(path))
  );

  if (isProtectedPath) {
    // If no role or token, redirect to staff login
    if (!role || !token) {
      return NextResponse.redirect(new URL("/login/staff", request.url));
    }

    // Get the requested role from the path
    const requestedRole = pathname.split("/")[2];

    // Map URL paths to backend roles
    const roleMap: Record<string, string> = {
      admin: "Admin",
      "lab-technician": "LabTechnician",
      receptionist: "Receptionist",
    };

    // Get the backend role for the requested path
    const requestedBackendRole = roleMap[requestedRole];

    // If the roles don't match, redirect to the user's dashboard
    if (role !== requestedBackendRole) {
      const redirectPath =
        role === "Admin"
          ? "/dashboard/admin"
          : role === "LabTechnician"
          ? "/dashboard/lab-technician"
          : "/dashboard/receptionist";

      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard/admin/:path*",
    "/dashboard/lab-technician/:path*",
    "/dashboard/receptionist/:path*",
    "/login/staff",
    "/login",
    "/register",
  ],
};
