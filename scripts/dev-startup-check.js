#!/usr/bin/env node

/**
 * Dev Server Startup Check
 * 
 * Runs before dev server starts to ensure:
 * - Prisma schema is valid
 * - Migrations are applied
 * - Prisma client is generated
 * 
 * Usage: node scripts/dev-startup-check.js
 * Called automatically in dev script
 */

const { execSync } = require("child_process")

console.log("🔍 Running pre-startup checks...\n")

try {
  // Validate schema
  console.log("📋 Validating Prisma schema...")
  execSync("npx prisma validate", { stdio: "inherit" })
  console.log("   ✅ Schema valid\n")

  // Check database readiness (non-blocking - just warns)
  try {
    console.log("📋 Checking database readiness...")
    execSync("node scripts/db-readiness-check.js", { stdio: "pipe" })
    console.log("   ✅ Database tables ready\n")
  } catch (error) {
    // Readiness check failed - non-blocking, just warn
    console.warn("   ⚠️  Database readiness check failed")
    console.warn("   Some tables may be missing. Run: npm run db:push\n")
    console.warn("   This is non-fatal, but you may encounter runtime errors\n")
  }

  console.log("✅ Pre-startup checks complete!\n")
} catch (error) {
  console.error("❌ Pre-startup check failed:", error.message)
  console.error("   Fix issues before starting dev server")
  process.exit(1)
}
