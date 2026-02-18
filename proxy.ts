import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const AUTH_PAGES = ["/sign-in", "/sign-up"];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = Boolean(sessionCookie);
  const isProtectedRoute =
    pathname.startsWith("/member") || pathname.startsWith("/finance") || pathname.startsWith("/admin");

  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (isAuthenticated && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/member/:path*", "/finance/:path*", "/admin/:path*", "/sign-in", "/sign-up"],
};
