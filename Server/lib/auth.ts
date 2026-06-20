import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { jwt, organization, admin } from "better-auth/plugins";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Generate a URL-safe slug from a name.
 * e.g. "Rajat Kumar" → "rajat-kumar-a3b2"
 */
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base || "org"}-${suffix}`;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: ["http://localhost:3001", "http://localhost:5173", "https://vessify-assignment-topaz.vercel.app", "https://vessify-assignment-ev1s.onrender.com", "https://vessify-assignment-three.vercel.app"],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [jwt(), organization(), admin()],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const orgName = user.name || user.email.split("@")[0];
          const slug = generateSlug(orgName);

          // Create the organization
          const org = await prisma.organization.create({
            data: {
              id: crypto.randomUUID(),
              name: `${orgName}'s Organization`,
              slug,
              createdAt: new Date(),
            },
          });

          // Add the user as the owner
          await prisma.member.create({
            data: {
              id: crypto.randomUUID(),
              organizationId: org.id,
              userId: user.id,
              role: "owner",
              createdAt: new Date(),
            },
          });

          console.log(`✅ Auto-created org "${org.name}" for user ${user.email}`);
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          if (!session.activeOrganizationId) {
            // Find the user's first organization
            const member = await prisma.member.findFirst({
              where: { userId: session.userId },
              orderBy: { createdAt: "asc" },
            });
            if (member) {
              await prisma.session.update({
                where: { id: session.id },
                data: { activeOrganizationId: member.organizationId },
              });
              console.log(`✅ Set active org for new session ${session.id}`);
            }
          }
        },
      },
    },
  },
});
