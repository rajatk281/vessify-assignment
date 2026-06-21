import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function proxyAuthRequest(req: NextRequest) {
  const url = new URL(req.url);
  // Forward the auth path to the backend
  const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

  const headers = new Headers();
  // Forward essential headers
  req.headers.forEach((value, key) => {
    // Skip host and other hop-by-hop headers
    if (
      !["host", "connection", "keep-alive", "transfer-encoding"].includes(
        key.toLowerCase()
      )
    ) {
      headers.set(key, value);
    }
  });

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    credentials: "include",
  };

  // Forward request body for non-GET/HEAD requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    fetchOptions.body = await req.text();
  }

  try {
    const backendResponse = await fetch(targetUrl, fetchOptions);

    // Create response with the backend's body
    const responseBody = await backendResponse.text();
    const response = new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
    });

    // Forward all response headers, especially Set-Cookie
    backendResponse.headers.forEach((value, key) => {
      // For Set-Cookie, we need to handle it specially
      if (key.toLowerCase() === "set-cookie") {
        // Remove domain attribute so cookie is set on current domain (vercel.app)
        // Also ensure SameSite=lax for same-origin and Secure for HTTPS
        const cookies = value.split(/,(?=\s*\w+=)/);
        cookies.forEach((cookie) => {
          let modifiedCookie = cookie
            // Remove any existing Domain attribute
            .replace(/;\s*domain=[^;]*/gi, "")
            // Replace SameSite=none with SameSite=lax since it's now same-origin
            .replace(/;\s*samesite=none/gi, "; SameSite=lax");
          response.headers.append("Set-Cookie", modifiedCookie.trim());
        });
      } else if (key.toLowerCase() !== "content-encoding" && key.toLowerCase() !== "content-length") {
        response.headers.set(key, value);
      }
    });

    return response;
  } catch (error) {
    console.error("Auth proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to authentication server" },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  return proxyAuthRequest(req);
}

export async function POST(req: NextRequest) {
  return proxyAuthRequest(req);
}
