#!/usr/bin/env ts-node

/**
 * Smoke Test Script
 * 
 * Tests database connectivity and access to core Prisma models.
 * Used for CI/CD verification and local development checks.
 * 
 * Usage:
 *   npx ts-node scripts/smoke-test.ts
 *   npm run smoke
 * 
 * Exit codes:
 * - 0: All tests passed
 * - 1: Test failed
 */

import { prisma } from "../lib/prisma"

async function main() {
  console.log("🔍 Running database smoke test...\n")

  try {
    // Test database connection
    console.log("Testing database connection...")
    await prisma.$connect()
    console.log("✅ Database connection OK\n")

    // Test access to core models
    console.log("Testing core model access...")
    
    await Promise.all([
      prisma.user.findFirst({ take: 1 }).then(() => {
        console.log("  ✅ user model accessible")
      }),
      prisma.merchant.findFirst({ take: 1 }).then(() => {
        console.log("  ✅ merchant model accessible")
      }),
      prisma.order.findFirst({ take: 1 }).then(() => {
        console.log("  ✅ order model accessible")
      }),
      prisma.product.findFirst({ take: 1 }).then(() => {
        console.log("  ✅ product model accessible")
      }),
      prisma.orderNumberCounter.findFirst({ take: 1 }).then(() => {
        console.log("  ✅ orderNumberCounter model accessible")
      }),
    ])

    console.log("\n✅ All core models accessible")
    console.log("✅ Smoke test passed\n")
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    const errorCode = error?.code || error?.errorCode || "UNKNOWN"
    
    console.error("\n❌ Smoke test failed:")
    console.error("  Error:", errorMessage)
    console.error("  Code:", errorCode)
    
    if (errorCode === "P1001" || errorMessage.includes("Can't reach database")) {
      console.error("\n💡 Tip: Check DATABASE_URL environment variable")
      console.error("💡 Tip: Ensure Neon pooler endpoint is configured")
    } else if (errorCode === "P2021" || errorMessage.includes("does not exist")) {
      console.error("\n💡 Tip: Database schema may be out of sync")
      console.error("💡 Tip: Run 'npx prisma db push' to sync schema")
    }
    
    process.exit(1)
  } finally {
    // Always disconnect to free up connections
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
  }
}

// Run the smoke test
main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
