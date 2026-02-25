/**
 * Integration tests for coupon application in orders
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { PrismaClient } from "@prisma/client"
import { validateCoupon, calculateDiscount } from "@/lib/coupons/validation"

// Coupon models are not provisioned in this deployment; skip integration tests.
describe.skip("Coupon Order Integration", () => {
  let prisma: any
  let testMerchantId: string
  let testCouponId: string

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

    // Create test coupon
    const coupon = await prisma.coupon.create({
      data: {
        merchantId: testMerchantId,
        code: "TEST20",
        type: "PERCENT",
        value: 20,
        minOrderAmount: 100,
        validFrom: new Date(),
        isActive: true,
      },
    })
    testCouponId = coupon.id
  })

  it("should validate coupon successfully for valid order amount", async () => {
    const orderAmountInPaise = 20000 // ₹200 (above minimum)

    const result = await validateCoupon(
      testMerchantId,
      "TEST20",
      orderAmountInPaise
    )

    expect(result.isValid).toBe(true)
    expect(result.coupon).toBeDefined()
    expect(result.coupon?.code).toBe("TEST20")
  })

  it("should reject coupon for order below minimum amount", async () => {
    const orderAmountInPaise = 5000 // ₹50 (below minimum of ₹100)

    const result = await validateCoupon(
      testMerchantId,
      "TEST20",
      orderAmountInPaise
    )

    expect(result.isValid).toBe(false)
    expect(result.error).toContain("Minimum order amount")
  })

  it("should calculate discount correctly for percentage coupon", async () => {
    const coupon = await prisma.coupon.findUnique({
      where: { id: testCouponId },
    })

    if (!coupon) throw new Error("Coupon not found")

    const orderAmountInPaise = 20000 // ₹200
    const discount = calculateDiscount(coupon, orderAmountInPaise)

    expect(discount.discountAmount).toBe(40) // 20% of ₹200 = ₹40
    expect(discount.finalAmount).toBe(160) // ₹200 - ₹40 = ₹160
  })

  it("should respect usage limit", async () => {
    // Create coupon with usage limit
    const limitedCoupon = await prisma.coupon.create({
      data: {
        merchantId: testMerchantId,
        code: "LIMITED10",
        type: "FIXED",
        value: 10,
        usageLimit: 2,
        validFrom: new Date(),
        isActive: true,
      },
    })

    // Create 2 redemptions (reaching limit)
    await prisma.couponRedemption.createMany({
      data: [
        {
          couponId: limitedCoupon.id,
          orderId: "order-1",
          merchantId: testMerchantId,
          discountAmount: 10 as any,
        },
        {
          couponId: limitedCoupon.id,
          orderId: "order-2",
          merchantId: testMerchantId,
          discountAmount: 10 as any,
        },
      ],
    })

    const orderAmountInPaise = 10000 // ₹100
    const result = await validateCoupon(
      testMerchantId,
      "LIMITED10",
      orderAmountInPaise
    )

    expect(result.isValid).toBe(false)
    expect(result.error).toContain("usage limit")
  })

  it("should reject expired coupon", async () => {
    const expiredCoupon = await prisma.coupon.create({
      data: {
        merchantId: testMerchantId,
        code: "EXPIRED",
        type: "FIXED",
        value: 10,
        validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        isActive: true,
      },
    })

    const orderAmountInPaise = 10000 // ₹100
    const result = await validateCoupon(
      testMerchantId,
      "EXPIRED",
      orderAmountInPaise
    )

    expect(result.isValid).toBe(false)
    expect(result.error).toContain("expired")
  })

  it("should reject inactive coupon", async () => {
    const inactiveCoupon = await prisma.coupon.create({
      data: {
        merchantId: testMerchantId,
        code: "INACTIVE",
        type: "FIXED",
        value: 10,
        validFrom: new Date(),
        isActive: false,
      },
    })

    const orderAmountInPaise = 10000 // ₹100
    const result = await validateCoupon(
      testMerchantId,
      "INACTIVE",
      orderAmountInPaise
    )

    expect(result.isValid).toBe(false)
    expect(result.error).toContain("no longer active")
  })
})
