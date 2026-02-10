import { prisma } from "@/lib/prisma"

export interface EffectiveFeeConfig {
  fixedFeePaise: number
  variableFeeBps: number
  payoutFrequency: "WEEKLY" | "DAILY" | "MANUAL"
  holdbackBps: number
  isPayoutHold: boolean
  domainSubscriptionActive: boolean
  domainPricePaise: number
  domainIncluded: boolean
  packageId: string | null
  packageName: string | null
}

/**
 * Get effective fee configuration for a merchant
 * Computes: package values + merchant overrides
 */
export async function getEffectiveFeeConfig(
  merchantId: string
): Promise<EffectiveFeeConfig> {
  // Load or create merchant fee config
  let feeConfig = await prisma.merchantFeeConfig.findUnique({
    where: { merchantId },
    include: {
      pricingPackage: true,
    },
  })

  if (!feeConfig) {
    // Create default config
    const platformSettings = await prisma.platformSettings.findUnique({
      where: { id: "singleton" },
      include: {
        defaultPricingPackage: true,
      },
    })

    const defaultPackageId =
      platformSettings?.defaultPricingPackageId ||
      (await getDefaultPackageId())

    feeConfig = await prisma.merchantFeeConfig.create({
      data: {
        merchantId,
        pricingPackageId: defaultPackageId,
      },
      include: {
        pricingPackage: true,
      },
    })
  }

  // Determine package (use merchant's package or default)
  // Only use PUBLISHED packages
  let packageData = feeConfig.pricingPackage
    ? feeConfig.pricingPackage.status === "PUBLISHED"
      ? feeConfig.pricingPackage
      : null
    : null

  if (!packageData) {
    // Load default package (must be PUBLISHED)
    const defaultPackageId = await getDefaultPackageId()
    if (defaultPackageId) {
      packageData = await prisma.pricingPackage.findUnique({
        where: { id: defaultPackageId },
      })
      // Ensure it's PUBLISHED
      if (packageData && packageData.status !== "PUBLISHED") {
        packageData = null
      }
    }
  }

  // If still no package, use hardcoded defaults
  if (!packageData) {
    return {
      fixedFeePaise: 1000, // ₹10
      variableFeeBps: 100, // 1%
      payoutFrequency: "WEEKLY",
      holdbackBps: 0,
      isPayoutHold: false,
      domainSubscriptionActive: false,
      domainPricePaise: 9900, // ₹99
      domainIncluded: false,
      packageId: null,
      packageName: null,
    }
  }

  // Compute effective values: override ?? package value
  const fixedFeePaise =
    feeConfig.fixedFeeOverridePaise ?? packageData.fixedFeePaise
  const variableFeeBps =
    feeConfig.variableFeeOverrideBps ?? packageData.variableFeeBps
  const payoutFrequency =
    feeConfig.payoutFrequencyOverride ?? packageData.payoutFrequency
  const holdbackBps = feeConfig.holdbackOverrideBps ?? packageData.holdbackBps
  const isPayoutHold =
    feeConfig.isPayoutHoldOverride ?? packageData.isPayoutHold

  // Domain logic
  let domainSubscriptionActive = feeConfig.domainSubscriptionActive
  if (packageData.domainIncluded) {
    // If domain is included, force it to true
    domainSubscriptionActive = true
    // Update config if needed
    if (!feeConfig.domainIncludedApplied) {
      await prisma.merchantFeeConfig.update({
        where: { id: feeConfig.id },
        data: {
          domainSubscriptionActive: true,
          domainIncludedApplied: true,
        },
      })
    }
  } else if (!packageData.domainAllowed) {
    // If domain not allowed, force it to false
    domainSubscriptionActive = false
  }

  return {
    fixedFeePaise,
    variableFeeBps,
    payoutFrequency,
    holdbackBps,
    isPayoutHold,
    domainSubscriptionActive,
    domainPricePaise: packageData.domainPricePaise,
    domainIncluded: packageData.domainIncluded,
    packageId: packageData.id,
    packageName: packageData.name,
  }
}

/**
 * Get default pricing package ID
 * Creates "Starter" package if none exists
 */
async function getDefaultPackageId(): Promise<string | null> {
  // Check platform settings first
  const platformSettings = await prisma.platformSettings.findUnique({
    where: { id: "singleton" },
  })

  if (platformSettings?.defaultPricingPackageId) {
    const packageExists = await prisma.pricingPackage.findUnique({
      where: { id: platformSettings.defaultPricingPackageId },
    })
    if (packageExists && !packageExists.deletedAt) {
      return platformSettings.defaultPricingPackageId
    }
  }

  // Find or create default "Starter" package
  let starterPackage = await prisma.pricingPackage.findFirst({
    where: {
      name: "Starter",
      deletedAt: null,
    },
  })

  if (!starterPackage) {
    starterPackage = await prisma.pricingPackage.create({
      data: {
        name: "Starter",
        description: "Default starter plan",
        status: "PUBLISHED",
        fixedFeePaise: 1000, // ₹10
        variableFeeBps: 100, // 1%
        domainPricePaise: 9900, // ₹99
        domainAllowed: true,
        domainIncluded: false,
        payoutFrequency: "WEEKLY",
        holdbackBps: 0,
        isPayoutHold: false,
        isActive: true,
        visibility: "PUBLIC",
      },
    })

    // Set as default in platform settings
    await prisma.platformSettings.upsert({
      where: { id: "singleton" },
      update: {
        defaultPricingPackageId: starterPackage.id,
      },
      create: {
        id: "singleton",
        defaultPricingPackageId: starterPackage.id,
      },
    })
  }

  return starterPackage.id
}

/**
 * Convert effective fee config to legacy FeeConfig format (for backward compatibility)
 */
export function effectiveFeeConfigToLegacy(
  config: EffectiveFeeConfig
): {
  percentageBps: number
  flatPaise: number
  maxCapPaise: number | null
} {
  // Note: maxCapPaise is not in the new model, so we return null
  // You may want to add it to PricingPackage if needed
  return {
    percentageBps: config.variableFeeBps,
    flatPaise: config.fixedFeePaise,
    maxCapPaise: null,
  }
}
