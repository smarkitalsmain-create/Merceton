# Onboarding Validation Fix - Production Security

## Problem Fixed
During merchant onboarding, Prisma internal type strings (like `StringFieldUpdateOperationsInput`, `NullableDateTimeFieldUpdateOperationsInput`) were leaking to the client UI, causing huge red error overlays with technical details.

**Root Cause:**
1. Server actions were passing raw request body directly to `prisma.merchantOnboarding.update()`
2. Using `updateData: any` allowed invalid shapes to reach Prisma
3. Prisma errors were returned raw to client without sanitization
4. UI displayed entire error objects including Prisma internals

## Solution Implemented

### 1. Validation & Sanitization Module
**File:** `lib/validation/merchantOnboarding.ts`

- Created Zod-based sanitizers for all onboarding steps:
  - `sanitizePanStep()` - PAN details
  - `sanitizeGstStep()` - GST + invoice address
  - `sanitizeBusinessBasicsStep()` - Business information
  - `sanitizeContactInfo()` - Contact details

**Features:**
- ✅ Trims all strings
- ✅ Converts empty strings to `null` for optional fields
- ✅ Validates phone (10-13 digits)
- ✅ Validates pincode (exactly 6 digits)
- ✅ Uppercases GSTIN and PAN
- ✅ Returns `Prisma.MerchantOnboardingUpdateInput` (type-safe)
- ✅ Only includes allowed fields (explicit allowlist)

### 2. Safe Error Handler
**File:** `lib/api/error.ts`

- `toSafeApiError()` converts any error to safe API response:
  - Zod errors → 400 with user-friendly messages
  - Prisma errors → Generic messages (no internals)
  - Unknown errors → "Something went wrong" (no stack traces)
- `createErrorResponse()` creates NextResponse with safe errors

**Error Mapping:**
- `P2002` (unique constraint) → "A record with this value already exists" (409)
- `P2003` (foreign key) → "Invalid reference to related record" (400)
- `P2025` (not found) → "Record not found" (404)
- Prisma validation → "Invalid data format" (400)
- Unknown → "Something went wrong" (500)

### 3. Updated Server Actions
**File:** `app/actions/onboarding.ts`

All 7 onboarding actions updated:
- `savePanStep()`
- `saveGstStep()`
- `saveBusinessBasicsStep()`
- `updateOnboardingPan()`
- `updateOnboardingGst()`
- `updateOnboardingBusiness()`
- `updateOnboardingContactInfo()`

**Changes:**
- ✅ Accept `unknown` instead of typed input
- ✅ Use sanitizer functions before Prisma
- ✅ Use `toSafeApiError()` for all error handling
- ✅ Return minimal response (only `id`, `onboardingStatus`, `profileCompletionPercent`)
- ✅ Never spread raw body into Prisma
- ✅ Never return raw error objects

### 4. UI Error Handling
**Files:** `components/OnboardingForm.tsx`, `components/OnboardingDetailsForm.tsx`

**Status:** ✅ Already safe
- UI only displays `result.error` (string)
- Uses toast notifications
- No raw error objects displayed
- No debug panels showing error details

### 5. Regression Guard
**File:** `scripts/test-onboarding-validation.ts`

Test script that verifies:
- ✅ Valid data passes validation
- ✅ Invalid data is rejected with user-friendly errors
- ✅ No Prisma internals leak in error messages
- ✅ Empty strings converted to null
- ✅ Error handler sanitizes all error types

**Run:** `npx tsx scripts/test-onboarding-validation.ts`

## Files Changed

### Created
1. `lib/validation/merchantOnboarding.ts` - Validation & sanitization
2. `lib/api/error.ts` - Safe error handler
3. `scripts/test-onboarding-validation.ts` - Regression test

### Modified
1. `app/actions/onboarding.ts` - All 7 actions updated

### Verified (No Changes Needed)
1. `components/OnboardingForm.tsx` - Already safe
2. `components/OnboardingDetailsForm.tsx` - Already safe

## Security Guarantees

### ✅ Never Pass Raw Body to Prisma
- All inputs go through sanitizer first
- Sanitizer returns `Prisma.MerchantOnboardingUpdateInput`
- Type system prevents invalid shapes

### ✅ Never Return Prisma Internals
- All errors go through `toSafeApiError()`
- Prisma error codes mapped to generic messages
- Stack traces never included in responses

### ✅ Server-Side Logging Only
- `console.error()` logs full details (server-side)
- Client only receives safe messages
- No debug information in production

### ✅ Type Safety
- TypeScript ensures only valid Prisma fields
- Sanitizer return type is `Prisma.MerchantOnboardingUpdateInput`
- Compile-time checks prevent invalid data

## Validation Rules

### PAN Step
- `panType`: Enum (required)
- `panNumber`: 10 chars, uppercase, format: `AAAAA1234A` (required)
- `panName`: Non-empty string (required)
- `panDobOrIncorp`: Valid date (required)
- `panHolderRole`: Non-empty string (required)

### GST Step
- `gstStatus`: Enum (required)
- `gstin`: 15 chars, uppercase, format validated (required if REGISTERED)
- `gstLegalName`: String (required if REGISTERED)
- `gstState`: String (required if REGISTERED)
- `invoiceAddressLine1`: Non-empty string (required)
- `invoiceCity`: Non-empty string (required)
- `invoicePincode`: Exactly 6 digits (required)
- `invoicePhone`: 10-13 digits, or null
- `invoiceEmail`: Valid email, or null
- `invoiceAddressLine2`: String, or null
- `invoicePrefix`: String, defaults to "MRC"

### Business Basics Step
- `storeDisplayName`: Non-empty string (required)
- `primaryCategory`: Non-empty string (required)
- `legalBusinessName`: String, or null
- `yearStarted`: Integer 1900-current year, or null
- `businessType`: Enum, or null
- `secondaryCategory`: String, or null
- `avgPriceRange`: Enum, or null
- `expectedSkuRange`: Enum, or null

### Contact Info
- `contactAddressLine1`: Non-empty string (required)
- `contactCity`: Non-empty string (required)
- `contactState`: Non-empty string (required)
- `contactPincode`: Exactly 6 digits (required)
- `contactEmail`: Valid email, or null
- `contactPhone`: 10-13 digits, or null
- `websiteUrl`: Valid URL, or null
- `contactAddressLine2`: String, or null

## Testing

### Manual Test Checklist
1. ✅ Submit valid PAN data → Should save successfully
2. ✅ Submit invalid PAN (wrong format) → Should show "Invalid PAN format"
3. ✅ Submit empty required fields → Should show field-specific errors
4. ✅ Submit GST with missing required fields → Should show validation errors
5. ✅ Submit invalid pincode → Should show "Pincode must be 6 digits"
6. ✅ Check browser console → Should NOT see Prisma type strings
7. ✅ Check network response → Should NOT see Prisma internals

### Automated Test
Run: `npx tsx scripts/test-onboarding-validation.ts`

Expected output:
```
🧪 Testing onboarding validation and error handling...
✅ Valid PAN data passed validation
✅ Invalid PAN data correctly rejected
✅ Valid GST data passed validation
✅ Invalid GST data correctly rejected
✅ Prisma error converted to safe error
✅ Unknown error converted to safe error
✅ All tests passed!
```

## Migration Notes

### Breaking Changes
- **None** - All changes are backward compatible
- Server actions now accept `unknown` but still work with existing form data
- Response format unchanged (still returns `{ success, error, onboarding }`)

### Deployment
1. Deploy code changes
2. No database migration needed
3. No environment variables needed
4. Test onboarding flow manually
5. Run regression test script

## Future Improvements

1. **Add API route validation** - Apply same pattern to other API routes
2. **Centralize error handling** - Use `createErrorResponse()` in all API routes
3. **Add request logging** - Log validation failures for analytics
4. **Add rate limiting** - Prevent abuse of onboarding endpoints

## Summary

✅ **Problem Solved:** Prisma internals no longer leak to client
✅ **Security:** All errors sanitized before returning to client
✅ **Type Safety:** TypeScript ensures only valid Prisma fields
✅ **User Experience:** User-friendly error messages
✅ **Maintainability:** Centralized validation and error handling
✅ **Regression Protection:** Test script prevents future leaks
