import "dotenv/config";
import type { MiddlewareHandler } from "hono";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

export const withPrisma: MiddlewareHandler<{
  Variables: { prisma: PrismaClient };
}> = async (c, next) => {
  c.set("prisma", prisma);
  await next();
};