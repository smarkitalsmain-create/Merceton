/**
 * Coupon Validation and Calculation
 *
 * In this deployment, coupon tables are not provisioned in the database.
 * These helpers provide safe fallbacks so the app can compile and run.
 */

export interface CouponValidationResult {
  isValid: boolean
  error?: string
  coupon?: any
}

export interface DiscountCalculation {
  discountAmount: number // In INR
  finalAmount: number // In INR (after discount)
}

/**
 * Validate a coupon code for a merchant and order amount.
 * Since coupons are not available, always returns an error result.
 */
export async function validateCoupon(
  merchantId: string,
  code: string,
  orderAmountInPaise: number,
  customerEmail?: string
): Promise<CouponValidationResult> {
  return {
    isValid: false,
    error: "Coupons not available: database not provisioned",
  }
}

type CouponTypeLocal = "PERCENT" | "FIXED"

/**
 * Calculate discount amount for a coupon.
 * Purely numeric helper; does not depend on Prisma types.
 */
export function calculateDiscount(
  coupon: {
    type: CouponTypeLocal
    value: number
    maxDiscount: number | null
  },
  orderAmountInPaise: number
): DiscountCalculation {
  const orderAmountInInr = orderAmountInPaise / 100
  const couponValue = coupon.value
  let discountAmount = 0

  if (coupon.type === "PERCENT") {
    // Percentage discount
    discountAmount = (orderAmountInInr * couponValue) / 100

    // Apply maximum discount cap if set
    if (coupon.maxDiscount != null) {
      const maxDiscount = coupon.maxDiscount
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
 * Get coupon by code (for display purposes).
 * Returns null because coupons are not provisioned.
 */
export async function getCouponByCode(merchantId: string, code: string) {
  return null
}
