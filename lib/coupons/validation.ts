/**
 * Coupon Validation and Calculation
 * 
 * Handles coupon validation rules and discount calculation.
 */

import { prisma } from "@/lib/prisma"
import { CouponType } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

export interface CouponValidationResult {
  isValid: boolean
  error?: string
  coupon?: {
    id: string
    code: string
    type: CouponType
    value: Decimal
    minOrderAmount: Decimal | null
    maxDiscount: Decimal | null
  }
}

export interface DiscountCalculation {
  discountAmount: number // In INR
  finalAmount: number // In INR (after discount)
}

/**
 * Validate a coupon code for a merchant and order amount
 */
export async function validateCoupon(
  merchantId: string,
  code: string,
  orderAmountInPaise: number,
  customerEmail?: string
): Promise<CouponValidationResult> {
  // Normalize code (uppercase, trim)
  const normalizedCode = code.trim().toUpperCase()

  // Find coupon
  const coupon = await prisma.coupon.findUnique({
    where: {
      merchantId_code: {
        merchantId,
        code: normalizedCode,
      },
    },
  })

  if (!coupon) {
    return {
      isValid: false,
      error: "Invalid coupon code",
    }
  }

  // Check if coupon is active
  if (!coupon.isActive) {
    return {
      isValid: false,
      error: "This coupon is no longer active",
    }
  }

  // Check validity dates
  const now = new Date()
  if (coupon.validFrom > now) {
    return {
      isValid: false,
      error: "This coupon is not yet valid",
    }
  }

  if (coupon.validUntil && coupon.validUntil < now) {
    return {
      isValid: false,
      error: "This coupon has expired",
    }
  }

  // Check minimum order amount
  const orderAmountInInr = orderAmountInPaise / 100
  if (coupon.minOrderAmount) {
    const minAmount = Number(coupon.minOrderAmount)
    if (orderAmountInInr < minAmount) {
      return {
        isValid: false,
        error: `Minimum order amount of ₹${minAmount.toFixed(2)} required for this coupon`,
      }
    }
  }

  // Check usage limit
  if (coupon.usageLimit !== null) {
    const redemptionCount = await prisma.couponRedemption.count({
      where: { couponId: coupon.id },
    })

    if (redemptionCount >= coupon.usageLimit) {
      return {
        isValid: false,
        error: "This coupon has reached its usage limit",
      }
    }
  }

  return {
    isValid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount,
    },
  }
}

/**
 * Calculate discount amount for a coupon
 */
export function calculateDiscount(
  coupon: {
    type: CouponType
    value: Decimal
    maxDiscount: Decimal | null
  },
  orderAmountInPaise: number
): DiscountCalculation {
  const orderAmountInInr = orderAmountInPaise / 100
  const couponValue = Number(coupon.value)
  let discountAmount = 0

  if (coupon.type === "PERCENT") {
    // Percentage discount
    discountAmount = (orderAmountInInr * couponValue) / 100

    // Apply maximum discount cap if set
    if (coupon.maxDiscount) {
      const maxDiscount = Number(coupon.maxDiscount)
      discountAmount = Math.min(discountAmount, maxDiscount)
    }
  } else {
    // Fixed discount
    discountAmount = couponValue
  }

  // Ensure discount doesn't exceed order amount
  discountAmount = Math.min(discountAmount, orderAmountInInr)

  // Round to 2 decimal places
  discountAmount = Math.round(discountAmount * 100) / 100

  const finalAmount = Math.max(0, orderAmountInInr - discountAmount)

  return {
    discountAmount,
    finalAmount,
  }
}

/**
 * Get coupon by code (for display purposes)
 */
export async function getCouponByCode(merchantId: string, code: string) {
  const normalizedCode = code.trim().toUpperCase()

  return prisma.coupon.findUnique({
    where: {
      merchantId_code: {
        merchantId,
        code: normalizedCode,
      },
    },
  })
}
