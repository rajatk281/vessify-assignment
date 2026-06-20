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

    const sessionCookie = request.cookies.get("better-auth.session_token")?.value || 
                          request.cookies.get("__Secure-better-auth.session_token")?.value;

    if (!sessionCookie) {
      // Use nextUrl.clone() which is the safest way to redirect in Next.js middleware
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
