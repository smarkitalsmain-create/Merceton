#!/usr/bin/env tsx
/**
 * E2E Test Data Cleanup Script
 * 
 * Cleans up all E2E test data (merchants with slug prefix "e2e-").
 * Safe to run multiple times.
 */

import { cleanupE2EData } from "../tests/e2e/_helpers/seed"
import { prisma } from "@/lib/prisma"

async function main() {
  console.log("🧹 Cleaning up E2E test data...\n")

  try {
    await cleanupE2EData()
    console.log("✅ E2E test data cleanup complete.\n")
  } catch (error) {
    console.error("❌ Failed to cleanup E2E test data:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
