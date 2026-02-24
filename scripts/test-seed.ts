#!/usr/bin/env tsx
/**
 * E2E Test Data Seeding Script
 * 
 * Seeds test data for E2E tests.
 * Run before E2E tests if you need fresh test data.
 */

import { seedAll } from "../tests/e2e/_helpers/seed"
import { prisma } from "@/lib/prisma"

async function main() {
  console.log("🌱 Seeding E2E test data...\n")

  try {
    const data = await seedAll()
    console.log("✅ Seeded test data:")
    console.log(`   Merchant: ${data.merchantSlug} (${data.merchantId})`)
    console.log(`   Product: ${data.productId}`)
    console.log(`   Order: ${data.orderNumber} (${data.orderId})`)
    console.log(`   Ledger Entry: ${data.ledgerEntryId}\n`)
    console.log("✅ E2E test data seeding complete.\n")
  } catch (error) {
    console.error("❌ Failed to seed E2E test data:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
