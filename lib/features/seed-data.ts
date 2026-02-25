/**
 * Seed data: Growth-only features. No duplicates. No WhatsApp.
 * Starter includes Ledger Export + Support Tickets (always available, not feature flags).
 */

export interface FeatureSeedRow {
  key: string
  name: string
  description: string
  category: string
  isBeta: boolean
  valueType: "BOOLEAN" | "NUMBER" | "STRING" | "JSON"
}

export const FEATURE_DEFINITIONS: FeatureSeedRow[] = [
  { key: "G_CUSTOM_DOMAIN", name: "Custom Domain", description: "Connect custom domain", category: "storefront", isBeta: false, valueType: "BOOLEAN" },
  { key: "G_REMOVE_BRANDING", name: "Remove Merceton Branding", description: "Hide Powered by Merceton and platform branding", category: "storefront", isBeta: false, valueType: "BOOLEAN" },
  { key: "G_ADV_THEME", name: "Advanced Theme Controls", description: "Advanced theme customization", category: "storefront", isBeta: false, valueType: "BOOLEAN" },
  { key: "G_BANNER_SLIDER", name: "Homepage Banner Slider", description: "Banner slider on homepage", category: "storefront", isBeta: false, valueType: "BOOLEAN" },
  { key: "G_FEATURED_SECTIONS", name: "Featured Product Sections", description: "Featured product sections on storefront", category: "storefront", isBeta: false, valueType: "BOOLEAN" },
  { key: "G_UNLIMITED_PRODUCTS", name: "Unlimited Products", description: "No product cap", category: "catalog", isBeta: false, valueType: "BOOLEAN" },
  { key: "G_PRODUCT_VARIANTS", name: "Product Variants", description: "Size, color and other variants", category: "catalog", isBeta: false, valueType: "BOOLEAN" },
  { key: "G_BULK_CSV", name: "Bulk Product CSV Import", description: "Bulk import products via CSV", category: "catalog", isBeta: false, valueType: "BOOLEAN" },
  { key: "G_COUPONS", name: "Coupons", description: "Create and manage coupons", category: "marketing", isBeta: false, valueType: "BOOLEAN" },
  { key: "G_ABANDONED_CART_EMAIL", name: "Abandoned Cart Email Trigger", description: "Abandoned cart emails", category: "marketing", isBeta: false, valueType: "BOOLEAN" },
  { key: "G_ADV_ANALYTICS", name: "Advanced Analytics", description: "Advanced analytics widgets and endpoints", category: "analytics", isBeta: false, valueType: "BOOLEAN" },
]

export const STARTER_FEATURE_KEYS: Array<{ key: string; valueJson?: object }> = []

export const GROWTH_FEATURE_KEYS: Array<{ key: string; valueJson?: object }> = [
  { key: "G_CUSTOM_DOMAIN" },
  { key: "G_REMOVE_BRANDING" },
  { key: "G_ADV_THEME" },
  { key: "G_BANNER_SLIDER" },
  { key: "G_FEATURED_SECTIONS" },
  { key: "G_UNLIMITED_PRODUCTS" },
  { key: "G_PRODUCT_VARIANTS" },
  { key: "G_BULK_CSV" },
  { key: "G_COUPONS" },
  { key: "G_ABANDONED_CART_EMAIL" },
  { key: "G_ADV_ANALYTICS" },
]
