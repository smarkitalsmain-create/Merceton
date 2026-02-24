# Feature Gating System Implementation

## Status: IN PROGRESS

This document tracks the implementation of the production-grade feature gating system.

## Completed ✅

### STEP 1: Database Schema
- ✅ Added `Feature` model (registry)
- ✅ Added `PricingPackageFeature` join table
- ✅ Added `MerchantFeatureOverride` for per-merchant overrides
- ✅ Added `FeatureAccessLog` for audit trail
- ✅ Updated `PricingPackage` and `Merchant` relations

### STEP 2: Seed Script
- ✅ Created `scripts/seed-features.ts` with all canonical features
- ✅ Added `db:seed-features` npm script
- ✅ Features include Starter and Growth plan features

### STEP 3: Feature Resolution Engine
- ✅ Created `lib/features/types.ts` with types and FeatureDeniedError
- ✅ Created `lib/features/resolver.ts` with resolution logic
- ✅ Created `lib/features/guards.ts` with canUseFeature, getFeatureValue, assertFeature
- ✅ Request-scoped caching implemented
- ✅ Special handling for UNLIMITED_PRODUCTS → PRODUCT_LIMIT = Infinity

### STEP 4: Admin UI - Package Features
- ✅ Created `components/admin/PackageFeaturesEditor.tsx`
- ✅ Integrated into package edit page (`app/admin/(protected)/pricing/[id]/edit/page.tsx`)
- ✅ Features grouped by Starter vs Growth
- ✅ Only DRAFT packages can be edited

### STEP 5: Server Actions
- ✅ Created `app/actions/features.ts` with:
  - `updatePricingPackageFeatures` (super admin)
  - `getPackageFeatures`
  - `getMerchantFeatureOverrides`
  - `getMerchantResolvedFeatures`
  - `setMerchantFeatureOverride`

## In Progress 🚧

### STEP 6: Enforcement in Routes
- ✅ Added product limit check to `POST /api/products`
- ⏳ Need to add to:
  - CSV import endpoint (BULK_PRODUCT_CSV_IMPORT)
  - Domain endpoints (CUSTOM_DOMAIN)
  - Ledger export endpoints (LEDGER_EXPORT_CSV, LEDGER_EXPORT_PDF)
  - Analytics endpoints (ANALYTICS_ADVANCED)
  - Coupon endpoints (COUPONS)
  - Variant endpoints (PRODUCT_VARIANTS)

### STEP 7: Merchant Override UI
- ⏳ Create `components/admin/MerchantFeatureOverrides.tsx`
- ⏳ Integrate into merchant detail page
- ⏳ Add "Effective Features" read-only view

## Pending 📋

### STEP 8: Tests
- ⏳ Unit tests for resolver (override precedence, defaults)
- ⏳ Integration tests for package features save/load
- ⏳ E2E tests for entitlement boundaries

### STEP 9: Documentation
- ⏳ Create `docs/FeatureGating.md` with:
  - How to add a new feature
  - How package mapping works
  - How overrides work
  - How to enforce in a route
  - Common pitfalls

### STEP 10: Migration & Rollout
- ⏳ Create Prisma migration
- ⏳ Run seed-features script
- ⏳ Backfill existing merchants with default package

## Next Steps

1. **Complete route enforcement** - Wire assertFeature into all critical endpoints
2. **Merchant override UI** - Build admin UI for managing merchant feature overrides
3. **Tests** - Add comprehensive test coverage
4. **Documentation** - Create developer guide
5. **Migration** - Run migration and seed in production

## Usage Examples

### Enforcing a Feature in an API Route

```typescript
import { assertFeature } from "@/lib/features"

export async function POST(request: NextRequest) {
  const { merchant } = await authorizeRequest()
  
  // Throws FeatureDeniedError (403) if feature not enabled
  await assertFeature(merchant.id, "CUSTOM_DOMAIN", request.nextUrl.pathname)
  
  // Continue with feature logic...
}
```

### Checking Product Limit

```typescript
import { getProductLimit } from "@/lib/features"

const limit = await getProductLimit(merchant.id)
if (productCount >= limit) {
  return NextResponse.json({ error: "Limit reached" }, { status: 403 })
}
```

### Checking Feature in UI (Server Component)

```typescript
import { canUseFeature } from "@/lib/features"

const canUseCustomDomain = await canUseFeature(merchant.id, "CUSTOM_DOMAIN")
```

## Feature Keys Reference

See `scripts/seed-features.ts` for complete list. Key features:

**Starter:**
- PRODUCT_LIMIT (NUMBER, default: 100)
- LEDGER_SUMMARY_VIEW (BOOLEAN)
- ANALYTICS_BASIC (BOOLEAN)

**Growth:**
- CUSTOM_DOMAIN (BOOLEAN)
- UNLIMITED_PRODUCTS (BOOLEAN)
- BULK_PRODUCT_CSV_IMPORT (BOOLEAN)
- LEDGER_EXPORT_CSV (BOOLEAN)
- LEDGER_EXPORT_PDF (BOOLEAN)
- COUPONS (BOOLEAN)
- ANALYTICS_ADVANCED (BOOLEAN)
