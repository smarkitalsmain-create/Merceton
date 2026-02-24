/**
 * E2E Test Data Seeding Helper
 * 
 * Seeds test data using Prisma directly.
 * All seeded records use slug prefix "e2e-" for easy cleanup.
 */

import { PrismaClient, OrderStage, OrderStatus, PaymentStatus, SettlementStatus, LedgerType, LedgerStatus } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
import { generateOrderNumber } from "@/lib/order/generateOrderNumber"
import { prisma } from "@/lib/prisma"

export interface SeededData {
  merchantId: string
  merchantSlug: string
  productId: string
  orderId: string
  orderNumber: string
  ledgerEntryId: string
}

/**
 * Seed test merchant with required onboarding state
 */
export async function seedTestMerchant(): Promise<{ merchantId: string; merchantSlug: string }> {
  const randomSuffix = Date.now().toString(36)
  const slug = `e2e-merchant-${randomSuffix}`

  // Check if merchant already exists
  const existing = await prisma.merchant.findUnique({
    where: { slug },
  })

  if (existing) {
    return { merchantId: existing.id, merchantSlug: existing.slug }
  }

  const merchant = await prisma.merchant.create({
    data: {
      slug,
      displayName: `E2E Test Merchant ${randomSuffix}`,
      isActive: true,
      accountStatus: "ACTIVE",
      kycStatus: "APPROVED",
      onboarding: {
        create: {
          onboardingStatus: "COMPLETED",
          gstStatus: "REGISTERED",
          gstin: "27ABCDE1234F1Z5",
          gstState: "27",
          legalBusinessName: `E2E Test Merchant ${randomSuffix} Pvt Ltd`,
          invoiceEmail: `e2e-merchant-${randomSuffix}@test.example.com`,
          invoicePhone: "+91 9876543210",
          invoiceAddressLine1: "123 Test Street",
          invoiceCity: "Mumbai",
          invoiceState: "Maharashtra",
          invoicePincode: "400001",
        },
      },
    },
  })

  return { merchantId: merchant.id, merchantSlug: merchant.slug }
}

/**
 * Seed test product
 */
export async function seedTestProduct(merchantId: string): Promise<string> {
  const product = await prisma.product.create({
    data: {
      merchantId,
      name: "E2E Test Product",
      description: "Test product for E2E tests",
      price: 1000, // ₹10.00 in paise
      mrp: 1200,
      stock: 100,
      isActive: true,
      hsnOrSac: "9983",
      gstRate: 18,
      isTaxable: true,
    },
  })

  return product.id
}

/**
 * Seed test order with items
 */
export async function seedTestOrder(merchantId: string, productId: string): Promise<{ orderId: string; orderNumber: string }> {
  const orderNumber = await generateOrderNumber(prisma)

  const order = await prisma.order.create({
    data: {
      merchantId,
      orderNumber,
      customerName: "E2E Test Customer",
      customerEmail: "e2e-customer@test.example.com",
      customerPhone: "+91 9876543211",
      customerAddress: "456 Test Avenue, Test City",
      stage: OrderStage.CONFIRMED,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      settlementStatus: SettlementStatus.NOT_ELIGIBLE,
      subtotal: new Decimal("1000.00"),
      tax: new Decimal("180.00"),
      shippingFee: new Decimal("0.00"),
      discount: new Decimal("0.00"),
      totalAmount: new Decimal("1180.00"),
      grossAmount: new Decimal("1000.00"),
      platformFee: new Decimal("25.00"),
      netPayable: new Decimal("975.00"),
      items: {
        create: {
          productId,
          productName: "E2E Test Product",
          quantity: 1,
          price: 1000, // in paise
        },
      },
    },
  })

  return { orderId: order.id, orderNumber: order.orderNumber }
}

/**
 * Seed test ledger entry
 */
export async function seedTestLedgerEntry(merchantId: string, orderId: string): Promise<string> {
  const ledgerEntry = await prisma.ledgerEntry.create({
    data: {
      merchantId,
      orderId,
      type: LedgerType.PLATFORM_FEE,
      amount: new Decimal("25.00"),
      description: "E2E test platform fee",
      status: LedgerStatus.COMPLETED,
    },
  })

  return ledgerEntry.id
}

/**
 * Ensure platform billing profile exists
 */
export async function ensurePlatformBillingProfile(): Promise<void> {
  await prisma.platformBillingProfile.upsert({
    where: { id: "platform" },
    create: {
      id: "platform",
      legalName: "Merceton Platform",
      invoicePrefix: "SMK",
      invoiceNextNumber: 1,
      invoicePadding: 5,
      seriesFormat: "{PREFIX}-{FY}-{NNNNN}",
      defaultSacCode: "9983",
      defaultGstRate: new Decimal("18.00"),
    },
    update: {},
  })
}

/**
 * Seed all test data
 */
export async function seedAll(): Promise<SeededData> {
  // Ensure platform billing profile exists
  await ensurePlatformBillingProfile()

  // Seed merchant
  const { merchantId, merchantSlug } = await seedTestMerchant()

  // Seed product
  const productId = await seedTestProduct(merchantId)

  // Seed order
  const { orderId, orderNumber } = await seedTestOrder(merchantId, productId)

  // Seed ledger entry
  const ledgerEntryId = await seedTestLedgerEntry(merchantId, orderId)

  return {
    merchantId,
    merchantSlug,
    productId,
    orderId,
    orderNumber,
    ledgerEntryId,
  }
}

/**
 * Cleanup all E2E test data
 */
export async function cleanupE2EData(): Promise<void> {
  // Delete in reverse order of dependencies
  await prisma.ledgerEntry.deleteMany({
    where: {
      merchant: {
        slug: {
          startsWith: "e2e-",
        },
      },
    },
  })

  await prisma.orderItem.deleteMany({
    where: {
      order: {
        merchant: {
          slug: {
            startsWith: "e2e-",
          },
        },
      },
    },
  })

  await prisma.order.deleteMany({
    where: {
      merchant: {
        slug: {
          startsWith: "e2e-",
        },
      },
    },
  })

  await prisma.product.deleteMany({
    where: {
      merchant: {
        slug: {
          startsWith: "e2e-",
        },
      },
    },
  })

  await prisma.merchantOnboarding.deleteMany({
    where: {
      merchant: {
        slug: {
          startsWith: "e2e-",
        },
      },
    },
  })

  await prisma.merchant.deleteMany({
    where: {
      slug: {
        startsWith: "e2e-",
      },
    },
  })
}
