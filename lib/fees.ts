/**
 * Platform Fee Calculation
 * 
 * Supports:
 * - Percentage fee (in basis points, 100 bps = 1%)
 * - Flat fee (in paise)
 * - Maximum cap (in paise)
 * 
 * Default: 2% (200 bps) + ₹5 (500 paise), max ₹25 (2500 paise)
 */

export interface FeeConfig {
  percentageBps?: number | null // Basis points (100 = 1%)
  flatPaise?: number | null     // Flat fee in paise
  maxCapPaise?: number | null   // Maximum fee cap in paise
}

// Default fee configuration
const DEFAULT_FEE_CONFIG: Required<FeeConfig> = {
  percentageBps: 200,  // 2%
  flatPaise: 500,      // ₹5
  maxCapPaise: 2500,   // ₹25
}

/**
 * Calculate platform fee for an order
 * 
 * @param grossAmountInPaise - Gross order amount in paise
 * @param config - Fee configuration (uses defaults if not provided)
 * @returns Platform fee in paise
 */
export function calculatePlatformFee(
  grossAmountInPaise: number,
  config?: FeeConfig | null
): number {
  // Normalize nullable fee configuration values to numbers
  const percentageBps = config?.percentageBps ?? DEFAULT_FEE_CONFIG.percentageBps ?? 0
  const flatPaise = config?.flatPaise ?? DEFAULT_FEE_CONFIG.flatPaise ?? 0
  const maxCapPaise = config?.maxCapPaise ?? DEFAULT_FEE_CONFIG.maxCapPaise ?? 0

  let fee = 0

  // Calculate percentage fee
  if (percentageBps > 0) {
    const percentageFee = Math.round(
      (grossAmountInPaise * percentageBps) / 10000
    )
    fee += percentageFee
  }

  // Add flat fee
  if (flatPaise > 0) {
    fee += flatPaise
  }

  // Apply maximum cap
  if (maxCapPaise > 0 && fee > maxCapPaise) {
    fee = maxCapPaise
  }

  // Ensure fee doesn't exceed gross amount
  if (fee > grossAmountInPaise) {
    fee = grossAmountInPaise
  }

  // Ensure fee is non-negative
  return Math.max(0, fee)
}

/**
 * Calculate net payable to merchant
 * 
 * @param grossAmountInPaise - Gross order amount in paise
 * @param config - Fee configuration
 * @returns Net payable in paise
 */
export function calculateNetPayable(
  grossAmountInPaise: number,
  config?: FeeConfig | null
): number {
  const platformFee = calculatePlatformFee(grossAmountInPaise, config)
  return grossAmountInPaise - platformFee
}

/**
 * Get fee configuration from merchant
 * Returns null values if merchant uses platform defaults
 */
export function getFeeConfig(merchant: {
  feePercentageBps: number | null
  feeFlatPaise: number | null
  feeMaxCapPaise: number | null
}): FeeConfig {
  return {
    percentageBps: merchant.feePercentageBps,
    flatPaise: merchant.feeFlatPaise,
    maxCapPaise: merchant.feeMaxCapPaise,
  }
}
