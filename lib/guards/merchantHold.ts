import { prisma } from "@/lib/prisma"

/**
 * Check if merchant account is on hold
 * Throws error if on hold (for use in API routes)
 */
export async function requireMerchantNotOnHold(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      accountStatus: true,
      holdReasonCode: true,
      holdReasonText: true,
    },
  })

  if (!merchant) {
    throw new Error("Merchant not found")
  }

  if (merchant.accountStatus === "ON_HOLD") {
    const error = new Error("Account is on hold")
    ;(error as any).status = 403
    ;(error as any).holdReasonCode = merchant.holdReasonCode
    ;(error as any).holdReasonText = merchant.holdReasonText
    throw error
  }

  return merchant
}

/**
 * Check if merchant account is on hold (non-throwing)
 * Returns true if on hold, false otherwise
 */
export async function isMerchantOnHold(merchantId: string): Promise<boolean> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { accountStatus: true },
  })

  return merchant?.accountStatus === "ON_HOLD"
}
