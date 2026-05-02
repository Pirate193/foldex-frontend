import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Desktop app (Tauri) loads from static files — the middleware runs on the
  // Next.js dev server during development. We detect desktop via a custom header
  // or by checking if the request comes from Tauri's webview.
  // In production static export, this middleware won't run at all.
  // During dev, we let everything through if the User-Agent contains "Tauri".
  const userAgent = request.headers.get("user-agent") || "";
  if (userAgent.includes("Tauri")) {
    return NextResponse.next();
  }

  const isAuthRoute = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isPublicRoute = pathname === "/" || pathname === "/pricing" || pathname === "/about" || pathname.startsWith("/api");

  // THE FIX: Check for BOTH the production (Secure) and development cookies
  const sessionToken =
    request.cookies.get("__Secure-better-auth.session_token")?.value ||
    request.cookies.get("better-auth.session_token")?.value;

  // Authenticated user trying to visit sign-in/sign-up → send to /home
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/app?view=home", request.url));
  }

  // Public route or API route → let it through regardless
  if (isPublicRoute || isAuthRoute) {
    return NextResponse.next();
  }

  // Protected route with no session → send to sign-in
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Authenticated user on a protected route → let it through
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};