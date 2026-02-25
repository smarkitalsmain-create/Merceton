"use server"

import { z } from "zod"
import { authorizeRequest } from "@/lib/auth"
import { assertFeature } from "@/lib/features"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"

const createCouponSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must be 50 characters or less")
    .regex(/^[A-Z0-9_-]+$/, "Code can only contain uppercase letters, numbers, hyphens, and underscores"),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().positive("Value must be positive"),
  minOrderAmount: z.coerce.number().positive().optional().nullable(),
  maxDiscount: z.coerce.number().positive().optional().nullable(),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
})

const updateCouponSchema = createCouponSchema.partial().extend({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
})

const NOT_AVAILABLE_ERROR = "Coupons not available: database not provisioned"

export async function createCoupon(input: z.infer<typeof createCouponSchema>) {
  const { merchant } = await authorizeRequest()
  await assertFeature(merchant.id, GROWTH_FEATURE_KEYS.G_COUPONS, "/dashboard/marketing/coupons")
  createCouponSchema.parse(input)
  throw new Error(NOT_AVAILABLE_ERROR)
}

export async function updateCoupon(input: z.infer<typeof updateCouponSchema>) {
  const { merchant } = await authorizeRequest()
  await assertFeature(merchant.id, GROWTH_FEATURE_KEYS.G_COUPONS, "/dashboard/marketing/coupons")
  updateCouponSchema.parse(input)
  throw new Error(NOT_AVAILABLE_ERROR)
}

export async function deleteCoupon(couponId: string) {
  const { merchant } = await authorizeRequest()
  await assertFeature(merchant.id, GROWTH_FEATURE_KEYS.G_COUPONS, "/dashboard/marketing/coupons")
  if (!couponId) {
    throw new Error("Coupon ID is required")
  }
  throw new Error(NOT_AVAILABLE_ERROR)
}

export async function getCoupons() {
  const { merchant } = await authorizeRequest()
  await assertFeature(merchant.id, GROWTH_FEATURE_KEYS.G_COUPONS, "/dashboard/marketing/coupons")
  return []
}

export async function getCouponById(couponId: string): Promise<null> {
  const { merchant } = await authorizeRequest()
  await assertFeature(merchant.id, GROWTH_FEATURE_KEYS.G_COUPONS, "/dashboard/marketing/coupons")
  if (!couponId) {
    throw new Error("Coupon ID is required")
  }
  return null
}
