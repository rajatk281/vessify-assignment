import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "../../lib/auth";
import { authMiddleware, type AuthEnv } from "../lib/middleware";

const app = new Hono<AuthEnv>();

// All organization routes require authentication
app.use("/*", authMiddleware);

// ─── POST /create ───────────────────────────────────────────────────
// Create a new organization with dynamic body
const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  logo: z.string().url().optional(),
});

app.post("/create", zValidator("json", createOrgSchema), async (c) => {
  const { name, slug, logo } = c.req.valid("json");

  const data = await auth.api.createOrganization({
    body: {
      name,
      slug,
      logo: logo ?? null,
    },
    headers: c.req.raw.headers,
  });

  return c.json(data, 201);
});

// ─── GET / ──────────────────────────────────────────────────────────
// List organizations the current user is a member of
app.get("/", async (c) => {
  const data = await auth.api.listOrganizations({
    headers: c.req.raw.headers,
  });

  return c.json(data);
});

// ─── POST /set-active ───────────────────────────────────────────────
// Set the active organization for the current session
const setActiveSchema = z.object({
  organizationId: z.string().min(1),
});

app.post("/set-active", zValidator("json", setActiveSchema), async (c) => {
  const { organizationId } = c.req.valid("json");

  const data = await auth.api.setActiveOrganization({
    body: { organizationId },
    headers: c.req.raw.headers,
  });

  return c.json(data);
});

export const organizationRouter = app;