#!/usr/bin/env tsx
/**
 * Enterprise System Smoke Test
 * 
 * Validates critical system components:
 * - Database connection
 * - Core models existence
 * - Order number generation
 * - Ledger entry creation
 * - Invoice number allocation
 * - Billing queries
 * 
 * Safe to run multiple times (idempotent).
 */

import { prisma } from "@/lib/prisma"
import { generateOrderNumber } from "@/lib/order/generateOrderNumber"
import { allocatePlatformInvoiceNumber } from "@/lib/billing/allocatePlatformInvoiceNumber"
import { Decimal } from "@prisma/client/runtime/library"
import {
  OrderStage,
  OrderStatus,
  LedgerType,
  LedgerStatus,
  MerchantAccountStatus,
  PaymentStatus,
  SettlementStatus,
} from "@prisma/client"

// Test results tracking
const results: Array<{ module: string; passed: boolean; error?: string }> = []

/**
 * Test wrapper that catches errors and records results
 */
async function test(
  module: string,
  testFn: () => Promise<void>
): Promise<void> {
  try {
    await testFn()
    results.push({ module, passed: true })
    console.log(`  [PASS] ${module}`)
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    results.push({ module, passed: false, error: errorMessage })
    console.log(`  [FAIL] ${module} - ${errorMessage}`)
  }
}

/**
 * Print banner
 */
function printBanner() {
  console.log("\n" + "=".repeat(60))
  console.log("  ENTERPRISE SYSTEM SMOKE TEST")
  console.log("=".repeat(60) + "\n")
}

/**
 * Test 1: Database connection
 */
async function testDatabaseConnection() {
  await test("Database Connection", async () => {
    await prisma.$queryRaw`SELECT 1`
  })
}

/**
 * Test 2: Check critical models exist
 */
async function testModelExistence() {
  await test("Model: Merchant", async () => {
    await prisma.merchant.findFirst({ take: 1 })
  })

  await test("Model: Order", async () => {
    await prisma.order.findFirst({ take: 1 })
  })

  await test("Model: LedgerEntry", async () => {
    await prisma.ledgerEntry.findFirst({ take: 1 })
  })

  await test("Model: OrderNumberCounter", async () => {
    await prisma.orderNumberCounter.findFirst({ take: 1 })
  })

  await test("Model: PlatformBillingProfile", async () => {
    await prisma.platformBillingProfile.findFirst({ take: 1 })
  })

  await test("Model: PlatformInvoice", async () => {
    await prisma.platformInvoice.findFirst({ take: 1 })
  })

  // Check for AdminAuditLog (exists but no RBAC models)
  await test("Model: AdminAuditLog", async () => {
    await prisma.adminAuditLog.findFirst({ take: 1 })
  })

  // Note: AdminUser, Role, Permission models don't exist in this schema
  // System uses Supabase auth with User model instead
  console.log("  [SKIP] RBAC Models (AdminUser/Role/Permission) - Not in schema")
  console.log("         System uses Supabase auth with User model")
}

/**
 * Test 3: Test Merchant creation (idempotent)
 */
async function testMerchant() {
  await test("Merchant: Create/Find Test Merchant", async () => {
    const testSlug = `smoke-test-${Date.now()}`
    
    // Try to find existing test merchant first
    let merchant = await prisma.merchant.findFirst({
      where: {
        slug: {
          startsWith: "smoke-test-",
        },
      },
    })

    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: {
          slug: testSlug,
          displayName: "Smoke Test Merchant",
          isActive: true,
        },
      })
    }

    if (!merchant) {
      throw new Error("Failed to create or find test merchant")
    }
  })
}

/**
 * Test 4: Test Order creation with order number generation
 */
async function testOrder() {
  await test("Order: Generate Order Number", async () => {
    const orderNumber = await generateOrderNumber(prisma)
    if (!orderNumber || !orderNumber.startsWith("ORD-")) {
      throw new Error(`Invalid order number format: ${orderNumber}`)
    }
  })

  await test("Order: Create Test Order", async () => {
    // Find or create test merchant
    let merchant = await prisma.merchant.findFirst({
      where: {
        slug: {
          startsWith: "smoke-test-",
        },
      },
    })

    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: {
          slug: `smoke-test-${Date.now()}`,
          displayName: "Smoke Test Merchant",
          isActive: true,
        },
      })
    }

    // Generate order number
    const orderNumber = await generateOrderNumber(prisma)

    // Create minimal order
    const order = await prisma.order.create({
      data: {
        merchantId: merchant.id,
        orderNumber,
        customerName: "Test Customer",
        customerEmail: "test@example.com",
        customerPhone: "9999999999",
        customerAddress: "Test Address, Test City",
        status: OrderStatus.PENDING,
        stage: OrderStage.NEW,
        paymentStatus: PaymentStatus.PENDING,
        settlementStatus: SettlementStatus.NOT_ELIGIBLE,
        subtotal: new Decimal("1000.00"),
        tax: new Decimal("0.00"),
        shippingFee: new Decimal("0.00"),
        discount: new Decimal("0.00"),
        totalAmount: new Decimal("1000.00"),
        grossAmount: new Decimal("1000.00"),
        platformFee: new Decimal("25.00"),
        netPayable: new Decimal("975.00"),
        // Note: items are not created in smoke test to avoid foreign key constraint
        // Order items require a valid productId that exists in products table
      },
    })

    if (!order) {
      throw new Error("Failed to create test order")
    }

    // Cleanup: Delete test order (optional, but keeps DB clean)
    await prisma.order.delete({
      where: { id: order.id },
    }).catch(() => {
      // Ignore cleanup errors
    })
  })
}

/**
 * Test 5: Test Ledger Entry creation
 */
async function testLedger() {
  await test("Ledger: Create Ledger Entry", async () => {
    // Find or create test merchant
    let merchant = await prisma.merchant.findFirst({
      where: {
        slug: {
          startsWith: "smoke-test-",
        },
      },
    })

    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: {
          slug: `smoke-test-${Date.now()}`,
          displayName: "Smoke Test Merchant",
          isActive: true,
        },
      })
    }

    // Create test order first
    const orderNumber = await generateOrderNumber(prisma)
    const order = await prisma.order.create({
      data: {
        merchantId: merchant.id,
        orderNumber,
        customerName: "Test Customer",
        customerEmail: "test@example.com",
        customerPhone: "9999999999",
        customerAddress: "Test Address, Test City",
        status: OrderStatus.PENDING,
        stage: OrderStage.NEW,
        paymentStatus: PaymentStatus.PENDING,
        settlementStatus: SettlementStatus.NOT_ELIGIBLE,
        subtotal: new Decimal("1000.00"),
        tax: new Decimal("0.00"),
        shippingFee: new Decimal("0.00"),
        discount: new Decimal("0.00"),
        totalAmount: new Decimal("1000.00"),
        grossAmount: new Decimal("1000.00"),
        platformFee: new Decimal("25.00"),
        netPayable: new Decimal("975.00"),
      },
    })

    // Create ledger entry
    const ledgerEntry = await prisma.ledgerEntry.create({
      data: {
        merchantId: merchant.id,
        orderId: order.id,
        type: LedgerType.PLATFORM_FEE,
        amount: new Decimal("25.00"),
        description: "Smoke test ledger entry",
        status: LedgerStatus.PENDING,
      },
    })

    if (!ledgerEntry) {
      throw new Error("Failed to create ledger entry")
    }

    // Verify it exists
    const found = await prisma.ledgerEntry.findUnique({
      where: { id: ledgerEntry.id },
    })

    if (!found) {
      throw new Error("Ledger entry not found after creation")
    }

    // Cleanup
    await prisma.ledgerEntry.delete({
      where: { id: ledgerEntry.id },
    }).catch(() => {})
    await prisma.order.delete({
      where: { id: order.id },
    }).catch(() => {})
  })
}

/**
 * Test 6: Test Invoice Number allocation
 */
async function testInvoiceSequence() {
  await test("Invoice Sequence: Allocate Platform Invoice Number", async () => {
    const result1 = await allocatePlatformInvoiceNumber()
    if (!result1.invoiceNumber) {
      throw new Error("Failed to allocate first invoice number")
    }

    // Allocate second number to verify increment
    const result2 = await allocatePlatformInvoiceNumber()
    if (!result2.invoiceNumber) {
      throw new Error("Failed to allocate second invoice number")
    }

    // Verify numbers are different (incremented)
    if (result1.invoiceNumber === result2.invoiceNumber) {
      throw new Error("Invoice numbers are not incrementing")
    }
  })
}

/**
 * Test 7: Test Billing Queries
 */
async function testBillingQueries() {
  await test("Billing: Query Ledger Entries", async () => {
    // Simple aggregate query
    const result = await prisma.ledgerEntry.aggregate({
      _count: {
        id: true,
      },
    })

    if (typeof result._count.id !== "number") {
      throw new Error("Billing aggregate query failed")
    }
  })

  await test("Billing: Query Platform Invoices", async () => {
    const invoices = await prisma.platformInvoice.findMany({
      take: 1,
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
      },
    })

    // Should not throw, even if empty
    if (!Array.isArray(invoices)) {
      throw new Error("Platform invoice query failed")
    }
  })
}

/**
 * Main test runner
 */
async function main() {
  printBanner()

  console.log("Running smoke tests...\n")

  // Run all tests
  await testDatabaseConnection()
  await testModelExistence()
  await testMerchant()
  await testOrder()
  await testLedger()
  await testInvoiceSequence()
  await testBillingQueries()

  // Print summary
  console.log("\n" + "=".repeat(60))
  console.log("  TEST SUMMARY")
  console.log("=".repeat(60))

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  console.log(`\n  Total Tests: ${results.length}`)
  console.log(`  Passed: ${passed}`)
  console.log(`  Failed: ${failed}`)

  if (failed === 0) {
    console.log("\n  ✅ SYSTEM HEALTH: STABLE")
    console.log("=".repeat(60) + "\n")
    process.exit(0)
  } else {
    console.log("\n  ❌ SYSTEM HEALTH: ERRORS FOUND")
    console.log("=".repeat(60))
    console.log("\n  Failed tests:")
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`    - ${r.module}: ${r.error}`)
      })
    console.log("")
    process.exit(1)
  }
}

// Run tests
main()
  .catch((error) => {
    console.error("\n❌ Fatal error:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
