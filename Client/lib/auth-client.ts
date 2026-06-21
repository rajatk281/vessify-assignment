import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // Use same-origin proxy to avoid third-party cookie issues
  // The Next.js /api/auth/[...all] route proxies to the backend
  baseURL: typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  plugins: [organizationClient(), adminClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
