import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Prisma 7: PrismaClient requires an adapter (or accelerateUrl) — no bare constructor.
// PrismaPg is a SqlDriverAdapterFactory; pass it directly to the client.

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL!),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
