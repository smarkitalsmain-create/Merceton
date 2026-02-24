#!/usr/bin/env node

/**
 * Check Database Schema Sync
 * 
 * Verifies that Prisma schema and database are in sync
 * Warns if migrations are pending or schema has drifted
 * 
 * Usage: node scripts/check-db-sync.js
 */

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🔍 Checking Prisma schema and database sync...\n")

try {
  // Check if .env.local exists and has DATABASE_URL
  const envPath = path.join(process.cwd(), ".env.local")
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8")
    const hasDatabaseUrl = envContent.includes("DATABASE_URL=")
    const hasDirectUrl = envContent.includes("DIRECT_URL=")
    
    console.log("📋 Environment variables:")
    console.log(`   DATABASE_URL: ${hasDatabaseUrl ? "✅ Set" : "❌ Missing"}`)
    console.log(`   DIRECT_URL: ${hasDirectUrl ? "✅ Set" : "⚠️  Not set (optional but recommended for migrations)"}`)
    
    if (!hasDatabaseUrl) {
      console.error("\n❌ DATABASE_URL not found in .env.local")
      console.error("   Please set DATABASE_URL in .env.local")
      process.exit(1)
    }
  } else {
    console.warn("⚠️  .env.local not found")
  }

  // Validate schema
  console.log("\n📋 Validating Prisma schema...")
  try {
    execSync("npx prisma validate", { stdio: "inherit" })
    console.log("   ✅ Schema is valid\n")
  } catch (error) {
    console.error("   ❌ Schema validation failed")
    process.exit(1)
  }

  // Check migration status
  console.log("📋 Checking migration status...")
  try {
    const statusOutput = execSync("npx prisma migrate status", { encoding: "utf8" })
    console.log(statusOutput)
    
    if (statusOutput.includes("Database schema is up to date")) {
      console.log("   ✅ Database schema is in sync with Prisma schema\n")
    } else if (statusOutput.includes("following migration have not yet been applied")) {
      console.warn("   ⚠️  Pending migrations detected!")
      console.warn("   Run: npm run db:migrate\n")
    } else {
      console.warn("   ⚠️  Migration status unclear\n")
    }
  } catch (error) {
    console.error("   ❌ Failed to check migration status")
    console.error("   Error:", error.message)
    console.error("   Make sure DATABASE_URL is set correctly\n")
  }

  // Check if Prisma client is generated
  console.log("📋 Checking Prisma client...")
  const prismaClientPath = path.join(process.cwd(), "node_modules", "@prisma", "client", "index.d.ts")
  if (fs.existsSync(prismaClientPath)) {
    console.log("   ✅ Prisma client is generated")
    
    // Check for invoice fields
    const clientContent = fs.readFileSync(prismaClientPath, "utf8")
    const hasInvoiceFields = clientContent.includes("invoiceAddressLine1")
    if (hasInvoiceFields) {
      console.log("   ✅ Invoice fields present in Prisma client\n")
    } else {
      console.warn("   ⚠️  Invoice fields not found in Prisma client")
      console.warn("   Run: npm run prisma:generate\n")
    }
  } else {
    console.warn("   ⚠️  Prisma client not found")
    console.warn("   Run: npm run prisma:generate\n")
  }

  console.log("✅ Database sync check complete!")
  console.log("\n💡 Tips:")
  console.log("   - After schema changes: npm run db:migrate")
  console.log("   - To verify types: npm run prisma:verify")
  console.log("   - To check connection: npm run db:check-connection")

} catch (error) {
  console.error("\n❌ Error checking database sync:", error.message)
  process.exit(1)
}
