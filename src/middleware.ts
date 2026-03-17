import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnLoginPage = req.nextUrl.pathname === "/login";
  const isOnRegisterPage = req.nextUrl.pathname === "/register";
  const isOnAuthApiUrl = req.nextUrl.pathname.startsWith("/api/auth");
  const isOwnerRoute = req.nextUrl.pathname.startsWith("/owner");
  const isTenantRoute = req.nextUrl.pathname.startsWith("/dashboard");

  // Allow auth API routes
  if (isOnAuthApiUrl) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn && !isOnLoginPage && !isOnRegisterPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Handle logged-in users
  if (isLoggedIn) {
    const role = req.auth?.user?.role;

    if (isOnLoginPage || isOnRegisterPage) {
      if (role === "owner") {
        return NextResponse.redirect(new URL("/owner/dashboard", req.nextUrl));
      }
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }

    // Protect owner routes
    if (isOwnerRoute && role !== "owner") {
       return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
