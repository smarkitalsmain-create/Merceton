# Schema Alignment Summary

## Changes Made

### 1. Field Name Mappings (contact* → invoice*)

**Schema has:** `invoiceAddressLine1`, `invoiceAddressLine2`, `invoiceCity`, `invoiceState`, `invoicePincode`, `invoiceEmail`, `invoicePhone`

**Code was using:** `contactAddressLine1`, `contactAddressLine2`, `contactCity`, `contactState`, `contactPincode`, `contactEmail`, `contactPhone`

**Files Fixed:**
- ✅ `app/dashboard/orders/[orderId]/invoice/page.tsx` - Replaced all contact* with invoice*
- ✅ `components/invoices/PlatformInvoiceHtml.tsx` - Updated interface and field references
- ✅ `app/api/admin/merchants/[merchantId]/route.ts` - Updated select fields
- ✅ `app/api/billing/invoice.pdf/route.ts` - Updated select and usage
- ✅ `lib/validation/merchantOnboarding.ts` - Maps contact* to invoice* in data output
- ✅ `app/dashboard/settings/onboarding/page.tsx` - Maps invoice* to contact* for component
- ✅ `app/_app/dashboard/settings/onboarding/page.tsx` - Maps invoice* to contact* for component
- ✅ `app/admin/(protected)/merchants/[merchantId]/page.tsx` - Maps invoice* to contact* for component

### 2. Removed Non-Existent Fields

**Fields removed:**
- `panVerifiedAt` - Doesn't exist in schema
- `gstVerifiedAt` - Doesn't exist in schema
- `websiteUrl` - Doesn't exist in schema

**Files Fixed:**
- ✅ `app/actions/onboarding.ts` - Removed verification lock checks
- ✅ `components/OnboardingDetailsForm.tsx` - Removed panVerifiedAt/gstVerifiedAt from interface and logic
- ✅ `app/dashboard/settings/onboarding/page.tsx` - Removed from data mapping
- ✅ `app/_app/dashboard/settings/onboarding/page.tsx` - Removed from data mapping
- ✅ `components/admin/MerchantOnboardingTab.tsx` - Removed panVerifiedAt display

### 3. Enum Fixes (SUSPENDED → ON_HOLD)

**Schema has:** `MerchantAccountStatus` enum with values: `ACTIVE`, `ON_HOLD`

**Code was using:** `"SUSPENDED"` (doesn't exist)

**Files Fixed:**
- ✅ `app/s/[slug]/checkout/page.tsx` - Changed `"SUSPENDED"` to `"ON_HOLD"`
- ✅ `app/s/[slug]/p/[productId]/page.tsx` - Changed `"SUSPENDED"` to `"ON_HOLD"`
- ✅ `app/s/[slug]/page.tsx` - Changed `"SUSPENDED"` to `"ON_HOLD"`

### 4. Missing Action Exports

**Added wrapper functions in `app/actions/onboarding.ts`:**
- ✅ `updateOnboardingPan()` - Wrapper for `saveOnboardingStep({ step: "pan" })`
- ✅ `updateOnboardingGst()` - Wrapper for `saveOnboardingStep({ step: "gst" })`
- ✅ `updateOnboardingBusiness()` - Wrapper for `saveOnboardingStep({ step: "business" })`
- ✅ `updateOnboardingContactInfo()` - Maps contact* to invoice* and calls `saveOnboardingStep({ step: "invoice" })`

## Field Mapping Reference

### MerchantOnboarding Model (Schema → Code)

| Schema Field | Component/API Field | Notes |
|-------------|-------------------|-------|
| `invoiceAddressLine1` | `contactAddressLine1` (in components) | Mapped for UI compatibility |
| `invoiceAddressLine2` | `contactAddressLine2` (in components) | Mapped for UI compatibility |
| `invoiceCity` | `contactCity` (in components) | Mapped for UI compatibility |
| `invoiceState` | `contactState` (in components) | Mapped for UI compatibility |
| `invoicePincode` | `contactPincode` (in components) | Mapped for UI compatibility |
| `invoiceEmail` | `contactEmail` (in components) | Mapped for UI compatibility |
| `invoicePhone` | `contactPhone` (in components) | Mapped for UI compatibility |
| N/A | `websiteUrl` | Field doesn't exist - always null |
| N/A | `panVerifiedAt` | Field doesn't exist - always null |
| N/A | `gstVerifiedAt` | Field doesn't exist - always null |

### MerchantAccountStatus Enum

| Schema Value | Code Usage |
|-------------|-----------|
| `ACTIVE` | ✅ Correct |
| `ON_HOLD` | ✅ Fixed (was `SUSPENDED`) |

## Verification Command

```bash
npx tsc --noEmit
```

Expected: Significantly reduced TypeScript errors (from 237 to near zero for schema-related issues).
