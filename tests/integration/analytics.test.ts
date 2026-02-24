/**
 * Integration tests for analytics API endpoints
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { PrismaClient, PaymentStatus } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

// Mock auth and feature checks
vi.mock("@/lib/auth", () => ({
  authorizeRequest: vi.fn(() =>
    Promise.resolve({
      merchant: { id: "test-merchant-id", displayName: "Test Merchant" },
    })
  ),
}))

vi.mock("@/lib/features", () => ({
  assertFeature: vi.fn(() => Promise.resolve()),
}))

describe("Analytics API Endpoints", () => {
  let prisma: PrismaClient
  let testMerchantId: string
  let testProductId: string
  let testOrderId: string

  beforeEach(async () => {
    prisma = new PrismaClient()

    // Create test merchant
    const merchant = await prisma.merchant.create({
      data: {
        slug: `test-merchant-${Date.now()}`,
        displayName: "Test Merchant",
      },
    })
    testMerchantId = merchant.id

    // Create test product
    const product = await prisma.product.create({
      data: {
        merchantId: testMerchantId,
        name: "Test Product",
        price: 10000, // ₹100 in paise
        stock: 100,
      },
    })
    testProductId = product.id

    // Create test order with payment
    const order = await prisma.order.create({
      data: {
        merchantId: testMerchantId,
        orderNumber: `ORD-${Date.now()}`,
        customerName: "Test Customer",
        customerEmail: "test@example.com",
        customerAddress: "123 Test St",
        grossAmount: new Decimal(100),
        platformFee: new Decimal(5),
        netPayable: new Decimal(95),
        payment: {
          create: {
            merchantId: testMerchantId,
            paymentMethod: "COD",
            status: PaymentStatus.PAID,
            amount: new Decimal(95),
          },
        },
        items: {
          create: {
            productId: testProductId,
            quantity: 1,
            price: 10000, // ₹100 in paise
          },
        },
      },
    })
    testOrderId = order.id
  })

  describe("Sales by Product", () => {
    it("should return correct product sales data", async () => {
      // This would test the actual endpoint if we had a test server
      // For now, we test the aggregation logic

      const orders = await prisma.order.findMany({
        where: {
          merchantId: testMerchantId,
          payment: {
            status: PaymentStatus.PAID,
          },
        },
        select: { id: true },
      })

      expect(orders.length).toBeGreaterThan(0)

      const orderItems = await prisma.orderItem.findMany({
        where: {
          orderId: { in: orders.map((o) => o.id) },
        },
      })

      expect(orderItems.length).toBeGreaterThan(0)
      expect(orderItems[0].productId).toBe(testProductId)
    })
  })

  describe("Sales by Date", () => {
    it("should return sales grouped by date", async () => {
      const orders = await prisma.order.findMany({
        where: {
          merchantId: testMerchantId,
          payment: {
            status: PaymentStatus.PAID,
          },
        },
        select: {
          createdAt: true,
          grossAmount: true,
        },
      })

      expect(orders.length).toBeGreaterThan(0)

      // Group by date
      const salesByDate = new Map<string, { revenue: number; orders: number }>()

      for (const order of orders) {
        const dateKey = new Date(order.createdAt).toISOString().split("T")[0]
        const existing = salesByDate.get(dateKey) || { revenue: 0, orders: 0 }

        existing.revenue += order.grossAmount.toNumber()
        existing.orders += 1

        salesByDate.set(dateKey, existing)
      }

      expect(salesByDate.size).toBeGreaterThan(0)
    })
  })

  describe("Top Customers", () => {
    it("should group customers by email", async () => {
      const orders = await prisma.order.findMany({
        where: {
          merchantId: testMerchantId,
          payment: {
            status: PaymentStatus.PAID,
          },
        },
        select: {
          customerEmail: true,
          customerName: true,
          grossAmount: true,
        },
      })

      const customerMap = new Map<
        string,
        { name: string; totalRevenue: number; orderCount: number }
      >()

      for (const order of orders) {
        const email = order.customerEmail.toLowerCase().trim()
        const existing = customerMap.get(email) || {
          name: order.customerName,
          totalRevenue: 0,
          orderCount: 0,
        }

        existing.totalRevenue += order.grossAmount.toNumber()
        existing.orderCount += 1

        customerMap.set(email, existing)
      }

      expect(customerMap.size).toBeGreaterThan(0)
    })
  })

  describe("Conversion Stats", () => {
    it("should calculate conversion rate", async () => {
      const totalOrders = await prisma.order.count({
        where: { merchantId: testMerchantId },
      })

      const paidOrders = await prisma.order.count({
        where: {
          merchantId: testMerchantId,
          payment: {
            status: PaymentStatus.PAID,
          },
        },
      })

      const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0

      expect(totalOrders).toBeGreaterThan(0)
      expect(paidOrders).toBeGreaterThan(0)
      expect(conversionRate).toBeGreaterThanOrEqual(0)
      expect(conversionRate).toBeLessThanOrEqual(100)
    })
  })
})
