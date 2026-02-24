/**
 * Feature Gating Types
 * 
 * Type definitions for the feature gating system.
 */

/**
 * Canonical feature keys
 * Add new features here and in seed-features.ts
 */
export type FeatureKey =
  // Starter
  | "STOREFRONT_SUBDOMAIN"
  | "BASIC_THEME"
  | "LOGO_BANNER_UPLOAD"
  | "PRODUCT_LIMIT"
  | "ORDERS_DASHBOARD"
  | "ORDER_STATUS_UPDATE"
  | "BASIC_CUSTOMER_DETAILS"
  | "PAYMENTS_RAZORPAY"
  | "PAYMENT_TRACKING"
  | "PLATFORM_FEE_DEDUCTION"
  | "ANALYTICS_BASIC"
  | "PAYOUTS_WEEKLY"
  | "LEDGER_SUMMARY_VIEW"
  // Growth
  | "CUSTOM_DOMAIN"
  | "REMOVE_MERCETON_BRANDING"
  | "THEME_ADVANCED"
  | "BANNER_SLIDER"
  | "FEATURED_SECTIONS"
  | "UNLIMITED_PRODUCTS"
  | "BULK_PRODUCT_CSV_IMPORT"
  | "PRODUCT_VARIANTS"
  | "ANALYTICS_ADVANCED"
  | "LEDGER_EXPORT_CSV"
  | "LEDGER_EXPORT_PDF"
  | "PLATFORM_FEE_BREAKDOWN"
  | "DEDUCTIONS_VIEW"
  | "COUPONS"
  | "DISCOUNT_RULES_BASIC"
  | "ABANDONED_CART_EMAIL_TRIGGER"

/**
 * Resolved feature state
 */
export interface ResolvedFeature {
  enabled: boolean
  value?: any
  source: "package" | "override" | "default"
}

/**
 * Map of all resolved features for a merchant
 */
export type ResolvedFeatures = Map<FeatureKey, ResolvedFeature>

/**
 * Feature denied error
 */
export class FeatureDeniedError extends Error {
  constructor(
    public featureKey: FeatureKey,
    public upgradeRequired: boolean = true,
    message?: string
  ) {
    super(message || `Feature ${featureKey} is not available`)
    this.name = "FeatureDeniedError"
  }

  toJSON() {
    return {
      error: this.message,
      featureKey: this.featureKey,
      upgradeRequired: this.upgradeRequired,
    }
  }
}
