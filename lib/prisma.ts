import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaTx?: PrismaClient
  prismaPoolerGuardLogged?: boolean
}

/**
 * One-time runtime guard: ensure DATABASE_URL uses Neon pooler in production.
 * Only logs host (never full URL). In production, throws if not using pooler.
 */
function assertPoolerUrlOnce(): void {
  if (globalForPrisma.prismaPoolerGuardLogged) return
  globalForPrisma.prismaPoolerGuardLogged = true

  const url = process.env.DATABASE_URL
  if (!url) return

  try {
    const parsed = new URL(url)
    const host = parsed.hostname
    const usingPooler = host.includes("-pooler")

    if (!usingPooler) {
      const message = `[Prisma] DATABASE_URL must use Neon pooled connection (host should contain "-pooler"). Current host: ${host}`
      if (process.env.NODE_ENV === "production") {
        throw new Error(message)
      }
      console.error(message)
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("[Prisma]")) throw err
    // URL parse failed - skip guard
  }
}

/**
 * Prisma Client Singleton Pattern
 *
 * CRITICAL: This ensures only ONE PrismaClient instance exists per process.
 * Runtime MUST use DATABASE_URL (Neon pooled). Migrations/Studio use DIRECT_URL via schema.
 *
 * - DATABASE_URL: Neon pooled endpoint (host contains "-pooler") — used by app runtime
 * - DIRECT_URL: Non-pooled — used only by Prisma CLI (migrate, studio)
 */
export const prisma =
  globalForPrisma.prisma ??
  (() => {
    assertPoolerUrlOnce()
    return new PrismaClient({
      log: ["error"],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })
  })()

// Transaction client: also uses pooled DATABASE_URL (no DIRECT_URL in runtime)
export const prismaTx =
  globalForPrisma.prismaTx ??
  new PrismaClient({
    log: ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// For query duration logging in dev: set Prisma log to ["query"] in datasource or use
// PRISMA_LOG_QUERY_DURATION=true with a custom logger (see Prisma docs).

// Store in global to prevent multiple instances (works in both dev and production)
// This is critical for preventing connection pool exhaustion
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}
if (!globalForPrisma.prismaTx) {
  globalForPrisma.prismaTx = prismaTx
}

// DEV-only: Log database connection info (without password)
if (process.env.NODE_ENV === "development") {
  try {
    const dbUrl = process.env.DATABASE_URL
    if (dbUrl) {
      // Parse URL safely to extract host/database without password
      try {
        const url = new URL(dbUrl)
        const host = url.hostname
        const port = url.port || "5432"
        const database = url.pathname.split("/")[1] || "unknown"
        console.log("[Prisma] Connecting to database:", {
          host: `${host}:${port}`,
          database,
          provider: "postgresql",
        })
      } catch {
        // If URL parsing fails, just log that we have a URL
        console.log("[Prisma] DATABASE_URL is set (connection info hidden)")
      }
    } else {
      console.warn("[Prisma] WARNING: DATABASE_URL is not set")
    }
  } catch (err) {
    // Non-fatal - just skip logging
  }
}

// Connection health check on startup (non-blocking)
// This helps surface connection issues early without crashing the app
// Errors are caught and logged, but don't prevent app startup
prisma.$connect()
  .then(() => {
    console.log("[Prisma] ✅ Connection health check passed")
  })
  .catch((err) => {
    console.error("[Prisma] ❌ Connection health check failed:", {
      message: err instanceof Error ? err.message : String(err),
      code: (err as any)?.errorCode || (err as any)?.code,
    })
    console.error("[Prisma] Check DATABASE_URL and ensure Neon pooler endpoint is configured")
    // Don't throw - let individual queries handle connection errors gracefully
  })

// DEV-only: Validate Prisma models at startup
// This helps catch schema/client mismatches early
if (process.env.NODE_ENV === "development") {
  try {
    const availableModels = Object.keys(prisma).filter(
      (key) => typeof (prisma as any)[key]?.findMany === "function"
    )
    console.log("[Prisma] Available models:", availableModels.sort().join(", "))
    
    // Check for commonly used models
    const requiredModels = [
      "merchant",
      "user",
      "product",
      "order",
      "payment",
      "payoutBatch",
      "merchantOnboarding",
      "platformInvoice",
      "platformBillingProfile",
      "platformSettlementCycle",
      "merchantStoreSettings",
      "merchantBankAccount",
      "orderNumberCounter",
    ]
    
    const missingModels = requiredModels.filter(
      (model) => !availableModels.includes(model)
    )
    
    if (missingModels.length > 0) {
      console.warn(
        "[Prisma] WARNING: Missing expected models:",
        missingModels.join(", ")
      )
      console.warn(
        "[Prisma] Run 'npx prisma generate' to regenerate Prisma Client"
      )
    }
  } catch (err) {
    // Non-fatal - just log
    console.warn("[Prisma] Could not validate models:", err)
  }

  // DEV-only: Health check for critical tables (non-blocking)
  // Tests if orderNumberCounter table exists in database
  setTimeout(async () => {
    try {
      // Check if orderNumberCounter delegate exists
      if (!(prisma as any).orderNumberCounter) {
        console.error("[Prisma] ❌ CRITICAL: orderNumberCounter model missing from Prisma Client")
        console.error("[Prisma] Run: npx prisma generate")
        return
      }

      // Attempt a simple query to verify table exists
      await (prisma as any).orderNumberCounter.findFirst({
        take: 1,
      })
      console.log("[Prisma] ✅ Health check passed: order_number_counters table exists")
    } catch (error: any) {
      // P2021 = table does not exist
      if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
        console.error("[Prisma] ❌ CRITICAL: order_number_counters table does not exist in database")
        console.error("[Prisma] Schema and database are out of sync!")
        console.error("[Prisma]")
        console.error("[Prisma] To fix, run ONE of these commands:")
        console.error("[Prisma]   npm run db:push          (syncs schema to DB, keeps data)")
        console.error("[Prisma]   npm run db:reset         (resets DB and syncs schema, DELETES ALL DATA)")
        console.error("[Prisma]")
        console.error("[Prisma] After running, restart dev server: npm run dev")
      } else {
        // Other error (connection, etc.) - log but don't panic
        console.warn("[Prisma] Health check warning:", error?.message || String(error))
      }
    }
  }, 2000) // Wait 2 seconds after startup to avoid blocking
}
