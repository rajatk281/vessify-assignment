import type { MiddlewareHandler } from "hono";
import { auth } from "../../lib/auth";

type AuthSession = {
  user: {
    id: string;
    email: string;
    name: string | null;
    image?: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    activeOrganizationId?: string | null;
  };
};

export type AuthEnv = {
  Variables: {
    user: AuthSession["user"];
    session: AuthSession["session"];
  };
};


export const authMiddleware: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
};
