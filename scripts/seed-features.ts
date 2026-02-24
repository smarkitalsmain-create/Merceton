#!/usr/bin/env tsx
/**
 * Seed Canonical Features
 * 
 * Upserts all canonical feature keys into the Feature registry.
 * Safe to run multiple times (idempotent).
 */

import { prisma } from "@/lib/prisma"

interface FeatureSeed {
  key: string
  name: string
  description: string
  valueType: "BOOLEAN" | "NUMBER" | "STRING" | "JSON"
  defaultValue?: any
}

const CANONICAL_FEATURES: FeatureSeed[] = [
  // Starter Plan Features
  {
    key: "STOREFRONT_SUBDOMAIN",
    name: "Storefront Subdomain",
    description: "Access to subdomain-based storefront (e.g., merchant.merceton.com)",
    valueType: "BOOLEAN",
  },
  {
    key: "BASIC_THEME",
    name: "Basic Theme",
    description: "Access to basic storefront themes",
    valueType: "BOOLEAN",
  },
  {
    key: "LOGO_BANNER_UPLOAD",
    name: "Logo & Banner Upload",
    description: "Upload custom logo and banner images",
    valueType: "BOOLEAN",
  },
  {
    key: "PRODUCT_LIMIT",
    name: "Product Limit",
    description: "Maximum number of products allowed",
    valueType: "NUMBER",
    defaultValue: 100,
  },
  {
    key: "ORDERS_DASHBOARD",
    name: "Orders Dashboard",
    description: "View and manage orders",
    valueType: "BOOLEAN",
  },
  {
    key: "ORDER_STATUS_UPDATE",
    name: "Order Status Updates",
    description: "Update order status and stages",
    valueType: "BOOLEAN",
  },
  {
    key: "BASIC_CUSTOMER_DETAILS",
    name: "Basic Customer Details",
    description: "View customer information in orders",
    valueType: "BOOLEAN",
  },
  {
    key: "PAYMENTS_RAZORPAY",
    name: "Razorpay Payments",
    description: "Accept payments via Razorpay",
    valueType: "BOOLEAN",
  },
  {
    key: "PAYMENT_TRACKING",
    name: "Payment Tracking",
    description: "Track payment status and history",
    valueType: "BOOLEAN",
  },
  {
    key: "PLATFORM_FEE_DEDUCTION",
    name: "Platform Fee Deduction",
    description: "Automatic platform fee calculation and deduction",
    valueType: "BOOLEAN",
  },
  {
    key: "ANALYTICS_BASIC",
    name: "Basic Analytics",
    description: "Basic sales and order analytics",
    valueType: "BOOLEAN",
  },
  {
    key: "PAYOUTS_WEEKLY",
    name: "Weekly Payouts",
    description: "Weekly settlement and payouts",
    valueType: "BOOLEAN",
  },
  {
    key: "LEDGER_SUMMARY_VIEW",
    name: "Ledger Summary View",
    description: "View ledger summary (no export)",
    valueType: "BOOLEAN",
  },

  // Growth Plan Features (add-ons)
  {
    key: "CUSTOM_DOMAIN",
    name: "Custom Domain",
    description: "Connect and use custom domain (e.g., store.example.com)",
    valueType: "BOOLEAN",
  },
  {
    key: "REMOVE_MERCETON_BRANDING",
    name: "Remove Merceton Branding",
    description: "Remove Merceton branding from storefront",
    valueType: "BOOLEAN",
  },
  {
    key: "THEME_ADVANCED",
    name: "Advanced Theme Controls",
    description: "Advanced theme customization options",
    valueType: "BOOLEAN",
  },
  {
    key: "BANNER_SLIDER",
    name: "Banner Slider",
    description: "Multi-image banner slider on storefront",
    valueType: "BOOLEAN",
  },
  {
    key: "FEATURED_SECTIONS",
    name: "Featured Sections",
    description: "Custom featured product sections",
    valueType: "BOOLEAN",
  },
  {
    key: "UNLIMITED_PRODUCTS",
    name: "Unlimited Products",
    description: "No product limit (overrides PRODUCT_LIMIT)",
    valueType: "BOOLEAN",
  },
  {
    key: "BULK_PRODUCT_CSV_IMPORT",
    name: "Bulk Product CSV Import",
    description: "Import multiple products via CSV file",
    valueType: "BOOLEAN",
  },
  {
    key: "PRODUCT_VARIANTS",
    name: "Product Variants",
    description: "Create products with variants (size, color, etc.)",
    valueType: "BOOLEAN",
  },
  {
    key: "ANALYTICS_ADVANCED",
    name: "Advanced Analytics",
    description: "Advanced analytics with charts and insights",
    valueType: "BOOLEAN",
  },
  {
    key: "LEDGER_EXPORT_CSV",
    name: "Ledger Export CSV",
    description: "Export ledger entries as CSV",
    valueType: "BOOLEAN",
  },
  {
    key: "LEDGER_EXPORT_PDF",
    name: "Ledger Export PDF",
    description: "Export ledger entries as PDF",
    valueType: "BOOLEAN",
  },
  {
    key: "PLATFORM_FEE_BREAKDOWN",
    name: "Platform Fee Breakdown",
    description: "Detailed platform fee breakdown view",
    valueType: "BOOLEAN",
  },
  {
    key: "DEDUCTIONS_VIEW",
    name: "Deductions View",
    description: "View all deductions and fees",
    valueType: "BOOLEAN",
  },
  {
    key: "COUPONS",
    name: "Coupons",
    description: "Create and manage discount coupons",
    valueType: "BOOLEAN",
  },
  {
    key: "DISCOUNT_RULES_BASIC",
    name: "Basic Discount Rules",
    description: "Create basic discount rules and promotions",
    valueType: "BOOLEAN",
  },
  {
    key: "ABANDONED_CART_EMAIL_TRIGGER",
    name: "Abandoned Cart Emails",
    description: "Send automated abandoned cart reminder emails",
    valueType: "BOOLEAN",
  },
]

async function main() {
  console.log("🌱 Seeding canonical features...\n")

  let created = 0
  let updated = 0

  for (const feature of CANONICAL_FEATURES) {
    try {
      const existing = await prisma.feature.findUnique({
        where: { key: feature.key },
      })

      if (existing) {
        // Update if description changed
        if (existing.description !== feature.description || existing.name !== feature.name) {
          await prisma.feature.update({
            where: { key: feature.key },
            data: {
              name: feature.name,
              description: feature.description,
              valueType: feature.valueType,
            },
          })
          updated++
          console.log(`  ✅ Updated: ${feature.key}`)
        } else {
          console.log(`  ⏭️  Skipped: ${feature.key} (unchanged)`)
        }
      } else {
        await prisma.feature.create({
          data: {
            key: feature.key,
            name: feature.name,
            description: feature.description,
            valueType: feature.valueType,
          },
        })
        created++
        console.log(`  ✅ Created: ${feature.key}`)
      }
    } catch (error: any) {
      console.error(`  ❌ Failed: ${feature.key} - ${error.message}`)
    }
  }

  console.log(`\n✅ Feature seeding complete:`)
  console.log(`   Created: ${created}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Total: ${CANONICAL_FEATURES.length}\n`)
}

main()
  .catch((error) => {
    console.error("❌ Fatal error:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
