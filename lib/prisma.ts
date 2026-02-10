import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaTx?: PrismaClient }

// Standard Prisma client (uses pooled connection for regular queries)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

// Transaction Prisma client (uses DIRECT_URL for heavy/long transactions)
// Only use this for onboarding and admin operations that need longer transactions
export const prismaTx =
  globalForPrisma.prismaTx ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaTx = prismaTx
}
