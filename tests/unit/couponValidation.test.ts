/**
 * Unit tests for coupon validation and discount calculation
 */

import { describe, it, expect } from "vitest"
import { calculateDiscount } from "@/lib/coupons/validation"
import { CouponType } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

describe("Coupon Validation", () => {
  describe("calculateDiscount", () => {
    it("should calculate percentage discount correctly", () => {
      const coupon = {
        type: CouponType.PERCENT,
        value: new Decimal(20), // 20%
        maxDiscount: null,
      }
      const orderAmountInPaise = 10000 // ₹100

      const result = calculateDiscount(coupon, orderAmountInPaise)

      expect(result.discountAmount).toBe(20) // 20% of ₹100 = ₹20
      expect(result.finalAmount).toBe(80) // ₹100 - ₹20 = ₹80
    })

    it("should apply maximum discount cap for percentage coupons", () => {
      const coupon = {
        type: CouponType.PERCENT,
        value: new Decimal(50), // 50%
        maxDiscount: new Decimal(30), // Max ₹30
      }
      const orderAmountInPaise = 10000 // ₹100

      const result = calculateDiscount(coupon, orderAmountInPaise)

      // 50% of ₹100 = ₹50, but capped at ₹30
      expect(result.discountAmount).toBe(30)
      expect(result.finalAmount).toBe(70) // ₹100 - ₹30 = ₹70
    })

    it("should calculate fixed discount correctly", () => {
      const coupon = {
        type: CouponType.FIXED,
        value: new Decimal(25), // ₹25
        maxDiscount: null,
      }
      const orderAmountInPaise = 10000 // ₹100

      const result = calculateDiscount(coupon, orderAmountInPaise)

      expect(result.discountAmount).toBe(25)
      expect(result.finalAmount).toBe(75) // ₹100 - ₹25 = ₹75
    })

    it("should not allow discount to exceed order amount", () => {
      const coupon = {
        type: CouponType.FIXED,
        value: new Decimal(150), // ₹150
        maxDiscount: null,
      }
      const orderAmountInPaise = 10000 // ₹100

      const result = calculateDiscount(coupon, orderAmountInPaise)

      // Discount should be capped at order amount
      expect(result.discountAmount).toBe(100)
      expect(result.finalAmount).toBe(0)
    })

    it("should round discount to 2 decimal places", () => {
      const coupon = {
        type: CouponType.PERCENT,
        value: new Decimal(33.33), // 33.33%
        maxDiscount: null,
      }
      const orderAmountInPaise = 10000 // ₹100

      const result = calculateDiscount(coupon, orderAmountInPaise)

      // 33.33% of ₹100 = ₹33.33, rounded
      expect(result.discountAmount).toBe(33.33)
      expect(result.finalAmount).toBe(66.67)
    })

    it("should handle zero discount", () => {
      const coupon = {
        type: CouponType.PERCENT,
        value: new Decimal(0), // 0%
        maxDiscount: null,
      }
      const orderAmountInPaise = 10000 // ₹100

      const result = calculateDiscount(coupon, orderAmountInPaise)

      expect(result.discountAmount).toBe(0)
      expect(result.finalAmount).toBe(100)
    })

    it("should handle 100% discount (capped at order amount)", () => {
      const coupon = {
        type: CouponType.PERCENT,
        value: new Decimal(100), // 100%
        maxDiscount: null,
      }
      const orderAmountInPaise = 10000 // ₹100

      const result = calculateDiscount(coupon, orderAmountInPaise)

      expect(result.discountAmount).toBe(100)
      expect(result.finalAmount).toBe(0)
    })
  })
})
