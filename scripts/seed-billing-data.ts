/**
 * Seed script to create sample ledger entries for billing invoice testing
 * 
 * Usage: npx tsx scripts/seed-billing-data.ts
 * 
 * Creates:
 * - 2 merchants (if they don't exist)
 * - 5 orders per merchant
 * - PLATFORM_FEE ledger entries for each order
 */

import { PrismaClient, LedgerType, LedgerStatus } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding billing data...")

  // Find or create 2 merchants
  let merchant1 = await prisma.merchant.findFirst({
    where: { slug: "test-merchant-1" },
  })

  if (!merchant1) {
    merchant1 = await prisma.merchant.create({
      data: {
        slug: "test-merchant-1",
        displayName: "Test Merchant 1",
        isActive: true,
        onboarding: {
          create: {
            onboardingStatus: "COMPLETED",
            gstStatus: "REGISTERED",
            gstin: "27ABCDE1234F1Z5",
            gstState: "27", // Maharashtra
            legalBusinessName: "Test Merchant 1 Pvt Ltd",
            invoiceEmail: "merchant1@example.com",
            invoicePhone: "+91 9876543210",
            invoiceAddressLine1: "123 Test Street",
            invoiceCity: "Mumbai",
            invoiceState: "Maharashtra",
            invoicePincode: "400001",
          },
        },
      },
    })
    console.log("✅ Created merchant 1:", merchant1.id)
  }

  let merchant2 = await prisma.merchant.findFirst({
    where: { slug: "test-merchant-2" },
  })

  if (!merchant2) {
    merchant2 = await prisma.merchant.create({
      data: {
        slug: "test-merchant-2",
        displayName: "Test Merchant 2",
        isActive: true,
        onboarding: {
          create: {
            onboardingStatus: "COMPLETED",
            gstStatus: "REGISTERED",
            gstin: "09FGHIJ5678K2M6",
            gstState: "09", // Delhi
            legalBusinessName: "Test Merchant 2 Pvt Ltd",
            invoiceEmail: "merchant2@example.com",
            invoicePhone: "+91 9876543211",
            invoiceAddressLine1: "456 Test Avenue",
            invoiceCity: "New Delhi",
            invoiceState: "Delhi",
            invoicePincode: "110001",
          },
        },
      },
    })
    console.log("✅ Created merchant 2:", merchant2.id)
  }

  // Create sample orders and ledger entries for merchant 1
  const now = new Date()
  const baseDate = new Date(now.getFullYear(), now.getMonth(), 1) // First day of current month

  for (let i = 0; i < 5; i++) {
    const orderDate = new Date(baseDate)
    orderDate.setDate(baseDate.getDate() + i * 2) // Spread orders over 10 days

    // Create order
    const order = await prisma.order.create({
      data: {
        merchantId: merchant1.id,
        orderNumber: `ORD-${merchant1.slug.toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
        customerName: `Customer ${i + 1}`,
        customerEmail: `customer${i + 1}@example.com`,
        customerPhone: `+91 9876543${String(i).padStart(4, "0")}`,
        customerAddress: `Address ${i + 1}`,
        status: "CONFIRMED",
        stage: "CONFIRMED",
        grossAmount: new Decimal((i + 1) * 1000), // ₹1000, ₹2000, etc.
        platformFee: new Decimal((i + 1) * 25), // ₹25, ₹50, etc.
        netPayable: new Decimal((i + 1) * 975), // ₹975, ₹1950, etc.
        createdAt: orderDate,
        items: {
          create: {
            productId: "seed-product-1",
            productName: `Test Product ${i + 1}`,
            quantity: i + 1,
            price: (i + 1) * 1000 * 100, // in paise
          },
        },
      },
    })

    // Create PLATFORM_FEE ledger entry
    const platformFee = (i + 1) * 25 // ₹25, ₹50, etc.
    const gstAmount = (platformFee * 18) / 100 // 18% GST
    const cgst = gstAmount / 2 // 9% CGST
    const sgst = gstAmount / 2 // 9% SGST

    await prisma.ledgerEntry.create({
      data: {
        merchantId: merchant1.id,
        orderId: order.id,
        type: LedgerType.PLATFORM_FEE,
        amount: new Decimal(platformFee),
        description: `Platform fee for Order #${order.orderNumber}`,
        status: LedgerStatus.COMPLETED,
        // Note: Advanced tax fields (baseAmountPaise, cgstPaise, sgstPaise, igstPaise, totalAmountPaise, taxType, currency, occurredAt) removed from schema
        createdAt: orderDate,
      },
    })

    console.log(`✅ Created order ${i + 1} for merchant 1: ${order.orderNumber}`)
  }

  // Create sample orders and ledger entries for merchant 2 (different state - will use IGST)
  for (let i = 0; i < 5; i++) {
    const orderDate = new Date(baseDate)
    orderDate.setDate(baseDate.getDate() + i * 2)

    const order = await prisma.order.create({
      data: {
        merchantId: merchant2.id,
        orderNumber: `ORD-${merchant2.slug.toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
        customerName: `Customer ${i + 1}`,
        customerEmail: `customer${i + 1}@example.com`,
        customerPhone: `+91 9876543${String(i + 5).padStart(4, "0")}`,
        customerAddress: `Address ${i + 1}`,
        status: "CONFIRMED",
        stage: "CONFIRMED",
        grossAmount: new Decimal((i + 1) * 1500), // ₹1500, ₹3000, etc.
        platformFee: new Decimal((i + 1) * 30), // ₹30, ₹60, etc.
        netPayable: new Decimal((i + 1) * 1470), // ₹1470, ₹2940, etc.
        createdAt: orderDate,
        items: {
          create: {
            productId: "seed-product-2",
            productName: `Test Product ${i + 1}`,
            quantity: i + 1,
            price: (i + 1) * 1500 * 100,
          },
        },
      },
    })

    // Create PLATFORM_FEE ledger entry (IGST since different state)
    const platformFee = (i + 1) * 30
    const gstAmount = (platformFee * 18) / 100
    const igst = gstAmount // Full 18% as IGST

    await prisma.ledgerEntry.create({
      data: {
        merchantId: merchant2.id,
        orderId: order.id,
        type: LedgerType.PLATFORM_FEE,
        amount: new Decimal(platformFee),
        description: `Platform fee for Order #${order.orderNumber}`,
        status: LedgerStatus.COMPLETED,
        // Note: Advanced tax fields (baseAmountPaise, cgstPaise, sgstPaise, igstPaise, totalAmountPaise, taxType, currency, occurredAt) removed from schema
        createdAt: orderDate,
      },
    })

    console.log(`✅ Created order ${i + 1} for merchant 2: ${order.orderNumber}`)
  }

  console.log("\n✅ Billing data seeded successfully!")
  console.log("\n📊 Summary:")
  console.log(`   - Merchant 1 (Maharashtra): 5 orders with CGST+SGST`)
  console.log(`   - Merchant 2 (Delhi): 5 orders with IGST`)
  console.log("\n🧪 Test invoice generation:")
  console.log(`   - Merchant: /dashboard/billing`)
  console.log(`   - Admin: /admin/merchants/${merchant1.id}/billing`)
}

main()
  .catch((e) => {
    console.error("❌ Error seeding billing data:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
