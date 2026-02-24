export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextRequest, NextResponse } from "next/server"
import { validateCoupon, calculateDiscount } from "@/lib/coupons/validation"

/**
 * GET /api/coupons/validate
 * 
 * Validate a coupon code and return discount amount
 * 
 * Query params:
 * - code: Coupon code
 * - merchantId: Merchant ID
 * - amount: Order amount in paise
 * - email: Customer email (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const merchantId = url.searchParams.get("merchantId")
    const amount = url.searchParams.get("amount")
    const email = url.searchParams.get("email")

    if (!code || !merchantId || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters: code, merchantId, amount" },
        { status: 400 }
      )
    }

    const orderAmountInPaise = parseInt(amount, 10)
    if (isNaN(orderAmountInPaise) || orderAmountInPaise <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      )
    }

    // Validate coupon
    const validation = await validateCoupon(
      merchantId,
      code,
      orderAmountInPaise,
      email || undefined
    )

    if (!validation.isValid || !validation.coupon) {
      return NextResponse.json(
        {
          valid: false,
          error: validation.error || "Invalid coupon code",
        },
        { status: 200 } // Return 200 even for invalid coupons (client handles it)
      )
    }

    // Calculate discount
    const discount = calculateDiscount(validation.coupon, orderAmountInPaise)

    return NextResponse.json({
      valid: true,
      coupon: {
        code: validation.coupon.code,
        type: validation.coupon.type,
      },
      discountAmount: discount.discountAmount,
      finalAmount: discount.finalAmount,
    })
  } catch (error) {
    console.error("Coupon validation error:", error)
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    )
  }
}
