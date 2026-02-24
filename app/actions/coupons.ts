"use server"

import { revalidatePath } from "next/cache"
import { authorizeRequest, requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { CouponType } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
import { assertFeature } from "@/lib/features"

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

/**
 * Create a new coupon
 */
export async function createCoupon(input: z.infer<typeof createCouponSchema>) {
  const { merchant } = await authorizeRequest()

  // Check feature access
  await assertFeature(merchant.id, "COUPONS", "/dashboard/marketing/coupons")

  const validated = createCouponSchema.parse(input)

  // Normalize code (uppercase)
  const normalizedCode = validated.code.trim().toUpperCase()

  // Validate PERCENT type value (0-100)
  if (validated.type === "PERCENT" && validated.value > 100) {
    throw new Error("Percentage discount cannot exceed 100%")
  }

  // Validate dates
  if (validated.validUntil && validated.validUntil < validated.validFrom) {
    throw new Error("Valid until date must be after valid from date")
  }

  // Check if code already exists for this merchant
  const existing = await prisma.coupon.findUnique({
    where: {
      merchantId_code: {
        merchantId: merchant.id,
        code: normalizedCode,
      },
    },
  })

  if (existing) {
    throw new Error("A coupon with this code already exists")
  }

  // Create coupon
  const coupon = await prisma.coupon.create({
    data: {
      merchantId: merchant.id,
      code: normalizedCode,
      type: validated.type as CouponType,
      value: new Decimal(validated.value),
      minOrderAmount: validated.minOrderAmount ? new Decimal(validated.minOrderAmount) : null,
      maxDiscount: validated.maxDiscount ? new Decimal(validated.maxDiscount) : null,
      validFrom: validated.validFrom,
      validUntil: validated.validUntil || null,
      usageLimit: validated.usageLimit || null,
      description: validated.description || null,
      isActive: true,
    },
  })

  revalidatePath("/dashboard/marketing/coupons")
  return { success: true, coupon }
}

/**
 * Update a coupon
 */
export async function updateCoupon(input: z.infer<typeof updateCouponSchema>) {
  const { merchant } = await authorizeRequest()

  // Check feature access
  await assertFeature(merchant.id, "COUPONS", "/dashboard/marketing/coupons")

  const validated = updateCouponSchema.parse(input)
  const { id, ...updateData } = validated

  // Verify coupon belongs to merchant
  const existing = await prisma.coupon.findUnique({
    where: { id },
  })

  if (!existing || existing.merchantId !== merchant.id) {
    throw new Error("Coupon not found")
  }

  // Prepare update data
  const data: any = {}

  if (updateData.code !== undefined) {
    data.code = updateData.code.trim().toUpperCase()
    // Check for duplicate code (if changing code)
    if (data.code !== existing.code) {
      const duplicate = await prisma.coupon.findUnique({
        where: {
          merchantId_code: {
            merchantId: merchant.id,
            code: data.code,
          },
        },
      })
      if (duplicate) {
        throw new Error("A coupon with this code already exists")
      }
    }
  }

  if (updateData.type !== undefined) {
    data.type = updateData.type as CouponType
  }

  if (updateData.value !== undefined) {
    // Validate PERCENT type value
    if ((updateData.type || existing.type) === "PERCENT" && updateData.value > 100) {
      throw new Error("Percentage discount cannot exceed 100%")
    }
    data.value = new Decimal(updateData.value)
  }

  if (updateData.minOrderAmount !== undefined) {
    data.minOrderAmount = updateData.minOrderAmount ? new Decimal(updateData.minOrderAmount) : null
  }

  if (updateData.maxDiscount !== undefined) {
    data.maxDiscount = updateData.maxDiscount ? new Decimal(updateData.maxDiscount) : null
  }

  if (updateData.validFrom !== undefined) {
    data.validFrom = updateData.validFrom
  }

  if (updateData.validUntil !== undefined) {
    data.validUntil = updateData.validUntil || null
    // Validate dates
    if (data.validUntil && data.validUntil < (data.validFrom || existing.validFrom)) {
      throw new Error("Valid until date must be after valid from date")
    }
  }

  if (updateData.usageLimit !== undefined) {
    data.usageLimit = updateData.usageLimit || null
  }

  if (updateData.description !== undefined) {
    data.description = updateData.description || null
  }

  if (updateData.isActive !== undefined) {
    data.isActive = updateData.isActive
  }

  // Update coupon
  const coupon = await prisma.coupon.update({
    where: { id },
    data,
  })

  revalidatePath("/dashboard/marketing/coupons")
  return { success: true, coupon }
}

/**
 * Delete a coupon (soft delete by setting isActive = false)
 */
export async function deleteCoupon(couponId: string) {
  const { merchant } = await authorizeRequest()

  // Check feature access
  await assertFeature(merchant.id, "COUPONS", "/dashboard/marketing/coupons")

  // Verify coupon belongs to merchant
  const existing = await prisma.coupon.findUnique({
    where: { id: couponId },
  })

  if (!existing || existing.merchantId !== merchant.id) {
    throw new Error("Coupon not found")
  }

  // Soft delete (set isActive = false)
  const coupon = await prisma.coupon.update({
    where: { id: couponId },
    data: { isActive: false },
  })

  revalidatePath("/dashboard/marketing/coupons")
  return { success: true, coupon }
}

/**
 * Get all coupons for merchant
 */
export async function getCoupons() {
  const { merchant } = await authorizeRequest()

  const coupons = await prisma.coupon.findMany({
    where: { merchantId: merchant.id },
    include: {
      _count: {
        select: { redemptions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return coupons
}

/**
 * Get coupon by ID
 */
export async function getCouponById(couponId: string) {
  const { merchant } = await authorizeRequest()

  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    include: {
      _count: {
        select: { redemptions: true },
      },
    },
  })

  if (!coupon || coupon.merchantId !== merchant.id) {
    throw new Error("Coupon not found")
  }

  return coupon
}
