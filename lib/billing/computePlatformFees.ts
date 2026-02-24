import { prisma } from "@/lib/prisma"
import { getEffectiveFeeConfig } from "@/lib/pricing"
import { Decimal } from "@prisma/client/runtime/library"

interface PlatformFeeComputation {
  platformFee: Decimal
  gstAmount: Decimal
  total: Decimal
}

/**
 * Compute platform fees for a merchant for a given period.
 * Returns platform fee, GST on fee, and total.
 */
export async function computePlatformFeesForPeriod(
  merchantId: string,
  periodStart: Date,
  periodEnd: Date,
  gstRate: number = 18
): Promise<PlatformFeeComputation> {
  // Get effective fee config for merchant
  const feeConfig = await getEffectiveFeeConfig(merchantId)

  // Find all completed/paid orders in the period
  const orders = await prisma.order.findMany({
    where: {
      merchantId,
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
      payment: {
        status: "PAID",
      },
      stage: {
        not: "CANCELLED",
      },
    },
    select: {
      grossAmount: true,
      platformFee: true,
    },
  })

  // Sum platform fees
  let totalPlatformFee = new Decimal(0)
  for (const order of orders) {
    totalPlatformFee = totalPlatformFee.add(order.platformFee || 0)
  }

  // Calculate GST on platform fee
  const gstAmount = totalPlatformFee.mul(gstRate).div(100)

  // Total = platform fee + GST
  const total = totalPlatformFee.add(gstAmount)

  return {
    platformFee: totalPlatformFee,
    gstAmount,
    total,
  }
}
