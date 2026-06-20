import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware, type AuthEnv } from "../lib/middleware";
import { prisma } from "../lib/prisma";
import { extractTransaction } from "../lib/extractor";

const app = new Hono<AuthEnv>();

app.use("/*", authMiddleware);

// ─── POST /extract ──────────────────────────────────────────────────
// Parses raw bank statement text, saves to DB scoped to user's active org
const extractSchema = z.object({
  text: z.string().min(1, "Text is required"),
});

app.post("/extract", zValidator("json", extractSchema), async (c) => {
  const { text } = c.req.valid("json");
  const user = c.get("user");
  const session = c.get("session");

  const organizationId = session.activeOrganizationId;
  if (!organizationId) {
    return c.json(
      { error: "No active organization. Please select or create an organization first." },
      400
    );
  }

  // Verify user is a member of this organization
  const membership = await prisma.member.findFirst({
    where: {
      userId: user.id,
      organizationId,
    },
  });

  if (!membership) {
    return c.json({ error: "You are not a member of this organization" }, 403);
  }

  // Parse the raw text
  const extracted = extractTransaction(text);

  // Save to database
  const transaction = await prisma.transaction.create({
    data: {
      description: extracted.description,
      amount: extracted.amount,
      date: extracted.date,
      confidence: extracted.confidence,
      rawText: text,
      userId: user.id,
      organizationId,
    },
  });

  return c.json({
    success: true,
    transaction,
  }, 201);
});

// ─── GET / ──────────────────────────────────────────────────────────
// List transactions with cursor-based pagination, scoped to active org
const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

app.get("/", zValidator("query", listQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid("query");
  const user = c.get("user");
  const session = c.get("session");

  const organizationId = session.activeOrganizationId;
  if (!organizationId) {
    return c.json(
      { error: "No active organization. Please select or create an organization first." },
      400
    );
  }

  // Verify membership
  const membership = await prisma.member.findFirst({
    where: {
      userId: user.id,
      organizationId,
    },
  });

  if (!membership) {
    return c.json({ error: "You are not a member of this organization" }, 403);
  }

  // Fetch one extra record to determine if there's a next page
  const isAdmin = (user as any).role === "admin";
  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId,
      ...(isAdmin ? {} : { userId: user.id }),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1, // Skip the cursor record itself
        }
      : {}),
  });

  const hasMore = transactions.length > limit;
  const data = hasMore ? transactions.slice(0, limit) : transactions;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return c.json({
    data,
    nextCursor,
    hasMore,
  });
});

export const transactionsRouter = app;
