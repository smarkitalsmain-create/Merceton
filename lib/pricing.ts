import type { PayoutFrequency } from "@prisma/client"
import type { FeeConfig } from "@/lib/fees"
import { prisma } from "@/lib/prisma"

const PLATFORM_ID = "singleton" as const

/** Resolved pricing for display and fee math (merchant package + overrides + fallbacks). */
export type EffectiveFeeConfig = {
  fixedFeePaise: number
  variableFeeBps: number
  payoutFrequency: PayoutFrequency
  packageId: string | null
  packageName: string | null
  /** Used when mapping to legacy {@link FeeConfig}; not shown on all UIs. */
  maxCapPaise: number | null
}

/**
 * Load effective per-order fee and payout settings for a merchant.
 * Order: `MerchantFeeConfig` overrides → linked or platform default `PricingPackage` → legacy `Merchant` fee columns → platform defaults.
 */
export async function getEffectiveFeeConfig(merchantId: string): Promise<EffectiveFeeConfig> {
  const [feeConfigRow, merchant, platform] = await Promise.all([
    prisma.merchantFeeConfig.findUnique({
      where: { merchantId },
      include: { pricingPackage: true },
    }),
    prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        feePercentageBps: true,
        feeFlatPaise: true,
        feeMaxCapPaise: true,
      },
    }),
    prisma.platformSettings.findUnique({
      where: { id: PLATFORM_ID },
      include: { defaultPricingPackage: true },
    }),
  ])

  const basePkg =
    feeConfigRow?.pricingPackage ?? platform?.defaultPricingPackage ?? null

  const baseFixed =
    basePkg?.fixedFeePaise ??
    merchant?.feeFlatPaise ??
    platform?.defaultFeeFlatPaise ??
    500
  const baseVariable =
    basePkg?.variableFeeBps ??
    merchant?.feePercentageBps ??
    platform?.defaultFeePercentageBps ??
    200
  const basePayout: PayoutFrequency = basePkg?.payoutFrequency ?? "WEEKLY"

  const maxCapPaise =
    merchant?.feeMaxCapPaise ?? platform?.defaultFeeMaxCapPaise ?? 2500

  const fixedFeePaise = feeConfigRow?.fixedFeeOverridePaise ?? baseFixed
  const variableFeeBps = feeConfigRow?.variableFeeOverrideBps ?? baseVariable
  const payoutFrequency = feeConfigRow?.payoutFrequencyOverride ?? basePayout

  const packageId = basePkg?.id ?? feeConfigRow?.pricingPackageId ?? null
  const packageName = basePkg?.name ?? null

  return {
    fixedFeePaise,
    variableFeeBps,
    payoutFrequency,
    packageId,
    packageName,
    maxCapPaise,
  }
}

/** Map package-style effective config to legacy {@link FeeConfig} (used by `lib/fees`). */
export function effectiveFeeConfigToLegacy(effective: EffectiveFeeConfig): FeeConfig {
  return {
    percentageBps: effective.variableFeeBps,
    flatPaise: effective.fixedFeePaise,
    maxCapPaise: effective.maxCapPaise,
  }
}
