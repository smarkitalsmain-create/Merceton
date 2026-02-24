# Prisma Model Fix Summary

## Problem
Code was getting "Unknown argument invoiceAddressLine1" error because:
- Prisma client wasn't regenerated after adding invoice fields to schema
- Some updates were using `where: { id }` instead of `where: { merchantId }` (though both work, merchantId is preferred as it's the unique constraint)

## ✅ Changes Made

### 1. **lib/onboarding.ts**
- **Updated `getMerchantOnboarding()`** to use `upsert` instead of `findUnique` + `create`
- **Added required invoice fields** to the create data with empty string defaults:
  - `invoiceAddressLine1: ""`
  - `invoiceCity: ""`
  - `invoicePincode: ""`
  - `invoiceState: ""`
- **Uses `where: { merchantId }`** (unique constraint) for upsert

**Before:**
```typescript
let onboarding = await prisma.merchantOnboarding.findUnique({
  where: { merchantId },
})
if (!onboarding) {
  onboarding = await prisma.merchantOnboarding.create({
    data: { merchantId, onboardingStatus: "NOT_STARTED" },
  })
}
```

**After:**
```typescript
const onboarding = await prisma.merchantOnboarding.upsert({
  where: { merchantId },
  update: {},
  create: {
    merchantId,
    onboardingStatus: "NOT_STARTED",
    invoiceAddressLine1: "",
    invoiceCity: "",
    invoicePincode: "",
    invoiceState: "",
  },
})
```

### 2. **app/actions/onboarding.ts**
- **Replaced all `where: { id: onboarding.id }`** with `where: { merchantId: merchant.id }`
- All 7 update calls now use `merchantId` (the unique constraint)

**Updated functions:**
- `savePanStep()` - Line 69
- `saveGstStep()` - Line 305
- `saveBusinessStep()` - Line 367
- `updatePanStep()` - Line 451
- `updateGstStep()` - Line 549
- `updateBusinessStep()` - Line 608
- `updateContactInfo()` - Line 664

**Before:**
```typescript
const updated = await prisma.merchantOnboarding.update({
  where: { id: onboarding.id },
  data: updateData,
})
```

**After:**
```typescript
const updated = await prisma.merchantOnboarding.update({
  where: { merchantId: merchant.id }, // Use merchantId (unique) instead of id
  data: updateData,
})
```

## ✅ Verification

### Schema Relations (Already Correct)
- ✅ `Merchant` has `onboarding MerchantOnboarding?` relation
- ✅ `MerchantOnboarding` has `merchant Merchant @relation(fields: [merchantId], references: [id])`
- ✅ Model is mapped to `merchant_onboarding` table
- ✅ `merchantId` is unique on `MerchantOnboarding`

### Model Usage (All Correct)
- ✅ All code uses `prisma.merchantOnboarding.*` (not `prisma.onboarding.*`)
- ✅ All updates use `where: { merchantId }` (unique constraint)
- ✅ `getMerchantOnboarding()` uses `upsert` with required fields

## 🚀 Next Steps

1. **Run Prisma generate:**
   ```bash
   npx prisma generate
   ```

2. **Run Prisma validate:**
   ```bash
   npx prisma validate
   ```

3. **Apply migration (if not already applied):**
   ```bash
   npx prisma migrate dev --name add_invoice_fields_to_onboarding
   ```

4. **Test onboarding save:**
   - Navigate to onboarding invoice step
   - Fill in invoice fields
   - Click "Save & Continue"
   - Should NOT see "Unknown argument invoiceAddressLine1" error
   - Fields should persist to database

## Files Changed

1. **lib/onboarding.ts**
   - Updated `getMerchantOnboarding()` to use `upsert` with required invoice fields

2. **app/actions/onboarding.ts**
   - Updated all 7 `prisma.merchantOnboarding.update()` calls to use `where: { merchantId }`

## Expected Behavior

After running `npx prisma generate`:
- ✅ Prisma client will recognize all invoice fields
- ✅ TypeScript will have proper types for `Prisma.MerchantOnboardingUpdateInput`
- ✅ Onboarding save will work without "Unknown argument" errors
- ✅ All invoice fields will persist correctly to the database
