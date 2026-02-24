#!/usr/bin/env node

/**
 * Database connection health check script
 * 
 * Usage: npm run db:check
 * 
 * This script attempts to connect to the database and run a simple query.
 * Useful for verifying DATABASE_URL configuration and connection health.
 */

const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient({
  log: ["error"],
})

async function checkDatabase() {
  try {
    console.log("🔍 Checking database connection...")
    console.log("📡 DATABASE_URL:", process.env.DATABASE_URL ? "✓ Set" : "✗ Missing")
    console.log("📡 DIRECT_URL:", process.env.DIRECT_URL ? "✓ Set" : "⚠ Not set (optional)")
    
    // Test connection with a simple query
    const result = await prisma.$queryRaw`SELECT 1 as health_check`
    
    if (result && Array.isArray(result) && result[0]?.health_check === 1) {
      console.log("✅ Database connection successful!")
      console.log("   Health check query returned:", result[0])
      process.exit(0)
    } else {
      console.error("❌ Database connection failed: Unexpected response")
      process.exit(1)
    }
  } catch (error) {
    console.error("❌ Database connection failed:")
    console.error("   Error:", error instanceof Error ? error.message : String(error))
    
    if (error instanceof Error) {
      const code = (error as any)?.errorCode || (error as any)?.code
      if (code) {
        console.error("   Code:", code)
      }
      
      // Provide helpful error messages
      if (code === "P1001" || error.message.includes("Can't reach database")) {
        console.error("\n💡 Troubleshooting:")
        console.error("   1. Check if DATABASE_URL is correct")
        console.error("   2. Verify database server is running")
        console.error("   3. Check network connectivity")
        console.error("   4. For Neon: Ensure pooler URL includes ?sslmode=require&pgbouncer=true")
      }
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
