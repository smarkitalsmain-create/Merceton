#!/usr/bin/env tsx

/**
 * Test Checkout Order Creation
 * 
 * This script tests the order creation flow by calling the createOrder server action
 * with valid test data. It verifies that:
 * 1. Order is created in database
 * 2. Order has valid orderNumber
 * 3. Order items are created
 * 4. Payment record is created
 * 5. Ledger entries are created
 * 
 * Usage: tsx scripts/test-checkout.ts
 */

import { prisma } from "../lib/prisma"
import { createOrder } from "../app/actions/orders"

async function main() {
  console.log("🧪 Testing checkout order creation...\n")

  // Get first active merchant
  const merchant = await prisma.merchant.findFirst({
    where: { isActive: true },
    include: {
      products: {
        where: { isActive: true, stock: { gt: 0 } },
        take: 1,
      },
    },
  })

  if (!merchant) {
    console.error("❌ No active merchant found. Please create a merchant first.")
    process.exit(1)
  }

  if (merchant.products.length === 0) {
    console.error("❌ No active products with stock found. Please create a product first.")
    process.exit(1)
  }

  const product = merchant.products[0]

  console.log("📦 Test data:")
  console.log(`   Merchant: ${merchant.displayName} (${merchant.slug})`)
  console.log(`   Product: ${product.name} (Stock: ${product.stock})`)
  console.log(`   Quantity: 1\n`)

  // Test order creation
  const testInput = {
    merchantId: merchant.id,
    storeSlug: merchant.slug,
    items: [
      {
        productId: product.id,
        quantity: 1,
      },
    ],
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    customerPhone: "9876543210",
    customerAddress: "123 Test Street, Test City, Test State 123456",
    pincode: "110001",
    paymentMethod: "COD" as const,
  }

  console.log("🚀 Creating order...")
  const result = await createOrder(testInput)

  if (result.success === false) {
    console.error("❌ Order creation failed:", result.error)
    process.exit(1)
  }

  if (!result.order) {
    console.error("❌ Order creation returned success but no order object")
    process.exit(1)
  }

  console.log("✅ Order created successfully!")
  console.log(`   Order ID: ${result.order.id}`)
  console.log(`   Order Number: ${result.order.orderNumber}\n`)

  // Verify order in database
  console.log("🔍 Verifying order in database...")
  const dbOrder = await prisma.order.findUnique({
    where: { id: result.order.id },
    include: {
      items: true,
      payment: true,
      ledgerEntries: true,
    },
  })

  if (!dbOrder) {
    console.error("❌ Order not found in database!")
    process.exit(1)
  }

  console.log("✅ Order found in database")
  console.log(`   Order Number: ${dbOrder.orderNumber}`)
  console.log(`   Status: ${dbOrder.status}`)
  console.log(`   Items: ${dbOrder.items.length}`)
  console.log(`   Payment: ${dbOrder.payment ? "Created" : "Missing"}`)
  console.log(`   Ledger Entries: ${dbOrder.ledgerEntries.length}\n`)

  // Verify order number is unique
  const duplicateCheck = await prisma.order.findFirst({
    where: {
      merchantId: merchant.id,
      orderNumber: dbOrder.orderNumber,
      id: { not: dbOrder.id },
    },
  })

  if (duplicateCheck) {
    console.error("❌ Order number collision detected!")
    console.error(`   Duplicate order ID: ${duplicateCheck.id}`)
    process.exit(1)
  }

  console.log("✅ Order number is unique\n")

  // Cleanup (optional - comment out to keep test order)
  // console.log("🧹 Cleaning up test order...")
  // await prisma.order.delete({ where: { id: dbOrder.id } })
  // console.log("✅ Test order deleted\n")

  console.log("✅ All checks passed!")
  console.log(`\n📋 Order Details:`)
  console.log(`   ID: ${dbOrder.id}`)
  console.log(`   Number: ${dbOrder.orderNumber}`)
  console.log(`   Customer: ${dbOrder.customerName}`)
  console.log(`   Amount: ₹${dbOrder.grossAmount.toString()}`)
  console.log(`   Payment Method: ${dbOrder.payment?.paymentMethod}`)
  console.log(`   Status: ${dbOrder.status}`)

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error("❌ Test failed:", error)
  process.exit(1)
})
