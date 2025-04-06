import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // For development purposes, allow direct access to dashboard routes
  if (path.startsWith("/dashboard/")) {
    // Set a default role cookie if not present
    const role = path.split("/")[2]; // Get the role from the URL
    const response = NextResponse.next();

    // Set the role cookie to match the requested dashboard
    response.cookies.set("role", role);
    return response;
  }

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/login" || path === "/login/staff" || path === "/register";

  // Get the token from the cookies
  const token = request.cookies.get("token")?.value || "";

  // Redirect logic
  if (isPublicPath && token) {
    // If user is logged in and tries to access public paths, redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublicPath && !token) {
    // If user is not logged in and tries to access protected paths, redirect to login
    return NextResponse.redirect(new URL("/login/staff", request.url));
  }

  // Role-based access control
  if (path.startsWith("/dashboard/")) {
    const role = path.split("/")[2]; // Get the role from the URL
    const userRole = request.cookies.get("role")?.value || "";

    if (role !== userRole) {
      // If user's role doesn't match the requested dashboard, redirect to their role's dashboard
      return NextResponse.redirect(
        new URL(`/dashboard/${userRole}`, request.url)
      );
    }
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/login/staff", "/register"],
};
