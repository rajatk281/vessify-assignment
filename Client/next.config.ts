import type { NextConfig } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      // Proxy transaction API requests to the backend
      {
        source: "/api/transactions",
        destination: `${BACKEND_URL}/api/transactions`,
      },
      {
        source: "/api/transactions/:path*",
        destination: `${BACKEND_URL}/api/transactions/:path*`,
      },
      // Proxy organization API requests to the backend
      {
        source: "/api/organization",
        destination: `${BACKEND_URL}/api/organization`,
      },
      {
        source: "/api/organization/:path*",
        destination: `${BACKEND_URL}/api/organization/:path*`,
      },
    ];
  },
};

export default nextConfig;
