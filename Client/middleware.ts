import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Allow static assets, api routes, and public routes
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.includes(".") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register")
    ) {
      return NextResponse.next();
    }

    const hasSession = request.cookies.has("better-auth.session_token") || request.cookies.has("__Secure-better-auth.session_token");

    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, let the request pass through so it doesn't completely block the user with a 500 error
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
