#!/usr/bin/env node

/**
 * Prisma DB Readiness Check
 * 
 * Verifies that critical database tables exist before the app starts.
 * This prevents runtime errors from missing tables after schema changes.
 * 
 * Run this as part of dev startup or before critical operations.
 */

const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient({
  log: ["error"],
})

const CRITICAL_TABLES = [
  // Core tenant models
  { model: "merchant", table: "merchants" },
  { model: "user", table: "users" },
  { model: "merchantOnboarding", table: "merchant_onboarding" },
  { model: "merchantStoreSettings", table: "merchant_store_settings" },
  { model: "merchantBankAccount", table: "merchant_bank_accounts" },
  { model: "merchantStatusEvent", table: "merchant_status_events" },
  
  // Catalog & orders
  { model: "product", table: "products" },
  { model: "productImage", table: "product_images" },
  { model: "order", table: "orders" },
  { model: "orderNumberCounter", table: "order_number_counters" },
  { model: "orderItem", table: "order_items" },
  { model: "shipment", table: "shipments" },
  { model: "refund", table: "refunds" },
  { model: "orderEvent", table: "order_events" },
  
  // Payments & billing
  { model: "payment", table: "payments" },
  { model: "ledgerEntry", table: "ledger_entries" },
  { model: "payoutBatch", table: "payout_batches" },
  { model: "platformInvoice", table: "platform_invoices" },
  { model: "platformInvoiceLineItem", table: "platform_invoice_line_items" },
  { model: "platformBillingProfile", table: "platform_billing_profile" },
  { model: "platformSettlementCycle", table: "platform_settlement_cycles" },
  
  // Storefront
  { model: "storefrontSettings", table: "storefront_settings" },
  { model: "storefrontPage", table: "storefront_pages" },
  
  // Pricing & admin
  { model: "pricingPackage", table: "pricing_packages" },
  { model: "merchantFeeConfig", table: "merchant_fee_configs" },
  { model: "platformSettings", table: "platform_settings" },
  { model: "adminAuditLog", table: "admin_audit_logs" },
]

async function checkTableExists(tableName) {
  try {
    // Use raw SQL to check if table exists (works even if Prisma client is outdated)
    const result = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, tableName)
    
    return result[0]?.exists === true
  } catch (error) {
    console.error(`[DB Check] Error checking table ${tableName}:`, error.message)
    return false
  }
}

async function checkModelAccess(modelName) {
  try {
    // Try to access the model (will fail if model doesn't exist in Prisma client)
    const model = prisma[modelName]
    if (!model || typeof model.findMany !== "function") {
      return false
    }
    
    // Try a lightweight query (LIMIT 0 to avoid loading data)
    await model.findMany({ take: 0 })
    return true
  } catch (error) {
    // If error is about missing table, that's what we're checking for
    if (error.message?.includes("does not exist") || error.message?.includes("Unknown table")) {
      return false
    }
    // Other errors (like connection issues) are OK - we'll catch those separately
    return true
  }
}

async function main() {
  console.log("[DB Readiness Check] Starting...")
  
  let allTablesExist = true
  let allModelsAccessible = true
  const missingTables = []
  const inaccessibleModels = []
  
  // Check database connection first
  try {
    await prisma.$connect()
    console.log("[DB Readiness Check] ✓ Database connection successful")
    
    // DEV-only: Log connection info (without password)
    if (process.env.NODE_ENV === "development") {
      const dbUrl = process.env.DATABASE_URL
      if (dbUrl) {
        try {
          const url = new URL(dbUrl)
          const host = url.hostname
          const port = url.port || "5432"
          const database = url.pathname.split("/")[1] || "unknown"
          console.log("[DB Readiness Check] Connected to:", {
            host: `${host}:${port}`,
            database,
          })
        } catch {
          // URL parsing failed, skip
        }
      }
    }
  } catch (error) {
    console.error("[DB Readiness Check] ✗ Database connection failed:", error.message)
    console.error("[DB Readiness Check] Please check your DATABASE_URL in .env.local")
    process.exit(1)
  }
  
  // Check each critical table
  for (const { model, table } of CRITICAL_TABLES) {
    const tableExists = await checkTableExists(table)
    const modelAccessible = await checkModelAccess(model)
    
    if (!tableExists) {
      console.error(`[DB Readiness Check] ✗ Table '${table}' does not exist in database`)
      missingTables.push(table)
      allTablesExist = false
    } else {
      console.log(`[DB Readiness Check] ✓ Table '${table}' exists`)
    }
    
    if (!modelAccessible) {
      console.error(`[DB Readiness Check] ✗ Model '${model}' is not accessible (table missing or Prisma client outdated)`)
      inaccessibleModels.push(model)
      allModelsAccessible = false
    } else {
      console.log(`[DB Readiness Check] ✓ Model '${model}' is accessible`)
    }
  }
  
  await prisma.$disconnect()
  
  // Report results
  if (!allTablesExist || !allModelsAccessible) {
    console.error("\n[DB Readiness Check] ✗ FAILED")
    console.error("\nMissing tables:", missingTables.join(", "))
    console.error("Inaccessible models:", inaccessibleModels.join(", "))
    console.error("\nTo fix this, run one of the following:")
    console.error("  1. npm run db:push        (for development - syncs schema to DB)")
    console.error("  2. npm run db:migrate   (for production - creates migration)")
    console.error("  3. npm run db:reset     (WARNING: deletes all data, then recreates)")
    console.error("\nAfter running the fix, restart your dev server.")
    process.exit(1)
  }
  
  console.log("\n[DB Readiness Check] ✓ All critical tables exist and are accessible")
  process.exit(0)
}

main().catch((error) => {
  console.error("[DB Readiness Check] Fatal error:", error)
  process.exit(1)
})
