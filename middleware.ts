import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define the paths that need role-based protection
const protectedPaths = {
  Admin: [
    "/dashboard/admin",
    "/dashboard/admin/patients",
    "/dashboard/admin/lab-technicians",
    "/dashboard/admin/receptionists",
    "/dashboard/admin/scan-technicians",
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
  ScanTechnician: [
    "/dashboard/scan-technician",
    "/dashboard/scan-technician/add-scan",
    "/dashboard/scan-technician/patients",
  ],
  Patient: [
    "/dashboard/patient",
    "/dashboard/patient/appointments",
    "/dashboard/patient/records",
    "/dashboard/patient/scans",
    "/dashboard/patient/history",
    "/dashboard/patient/profile",
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
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const redirectPath = getRedirectPathByRole(role);
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Check if user is trying to access a public path while authenticated
  if (publicPaths.includes(pathname) && role && token) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = getRedirectPathByRole(role);
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Check if the path is a protected dashboard path
  const isProtectedPath = Object.values(protectedPaths).some((paths) =>
    paths.some((path) => pathname.startsWith(path))
  );

  if (isProtectedPath) {
    // If no role or token, redirect to the appropriate login page
    if (!role || !token) {
      // For patient paths, redirect to patient login, otherwise to staff login
      const loginPath = pathname.startsWith("/dashboard/patient")
        ? "/login"
        : "/login/staff";
      return NextResponse.redirect(new URL(loginPath, request.url));
    }

    // Get the requested role from the path
    const requestedRole = pathname.split("/")[2];

    // Map URL paths to backend roles
    const roleMap: Record<string, string> = {
      admin: "Admin",
      "lab-technician": "LabTechnician",
      receptionist: "Receptionist",
      "scan-technician": "ScanTechnician",
      patient: "Patient",
    };

    // Get the backend role for the requested path
    const requestedBackendRole = roleMap[requestedRole];

    // If the roles don't match, redirect to the user's dashboard
    if (role !== requestedBackendRole) {
      const redirectPath = getRedirectPathByRole(role);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return NextResponse.next();
}

// Helper function to get redirect path based on role
function getRedirectPathByRole(role: string): string {
  switch (role) {
    case "Admin":
      return "/dashboard/admin";
    case "LabTechnician":
      return "/dashboard/lab-technician";
    case "ScanTechnician":
      return "/dashboard/scan-technician";
    case "Patient":
      return "/dashboard/patient";
    case "Receptionist":
    default:
      return "/dashboard/receptionist";
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard/admin/:path*",
    "/dashboard/lab-technician/:path*",
    "/dashboard/receptionist/:path*",
    "/dashboard/scan-technician/:path*",
    "/dashboard/patient/:path*",
    "/login/staff",
    "/login",
    "/register",
  ],
};
