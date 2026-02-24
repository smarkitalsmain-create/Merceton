# Invoice Fields Migration Instructions

## Schema Changes

Updated `MerchantOnboarding` model with invoice/billing address fields:

**Required fields:**
- `invoiceAddressLine1` (String)
- `invoiceCity` (String)
- `invoicePincode` (String) - 6 digits
- `invoiceState` (String)

**Optional fields:**
- `invoiceAddressLine2` (String?)
- `invoicePhone` (String?) - 10-13 digits
- `invoiceEmail` (String?)
- `invoicePrefix` (String?) - max 8 chars, A-Z0-9

## Migration Steps

1. **Run the migration:**
   ```bash
   npx prisma migrate dev --name add_invoice_fields_to_onboarding
   ```
   
   This will:
   - Apply the migration SQL to add columns to the database
   - Generate the Prisma client with the new fields

2. **If migration already exists, apply it:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

## Verification

After migration:

1. **Check Prisma Client:**
   - The generated Prisma client should now include the invoice fields
   - TypeScript should recognize these fields in `Prisma.MerchantOnboardingUpdateInput`

2. **Test onboarding save:**
   - Navigate to onboarding invoice step
   - Fill in required fields: address line 1, city, pincode, state
   - Fill in optional fields: address line 2, phone, email, prefix
   - Click "Save & Continue"
   - Should NOT see "Unknown argument" error
   - Fields should be saved to database

3. **Verify database:**
   ```sql
   SELECT 
     "invoiceAddressLine1",
     "invoiceCity", 
     "invoicePincode",
     "invoiceState",
     "invoiceAddressLine2",
     "invoicePhone",
     "invoiceEmail",
     "invoicePrefix"
   FROM "merchant_onboarding"
   WHERE "merchantId" = '<your-merchant-id>';
   ```

## Files Changed

1. **prisma/schema.prisma**
   - Added invoice fields to `MerchantOnboarding` model
   - Required fields: `invoiceAddressLine1`, `invoiceCity`, `invoicePincode`, `invoiceState`
   - Optional fields: `invoiceAddressLine2`, `invoicePhone`, `invoiceEmail`, `invoicePrefix`

2. **prisma/migrations/20260222144321_add_invoice_fields_to_onboarding/migration.sql**
   - Migration SQL to add columns
   - Handles existing rows by setting defaults
   - Makes required fields NOT NULL

3. **lib/validation/invoiceStep.ts**
   - Updated `invoiceState` to be required (was optional)
   - Validation rules match schema requirements

4. **app/actions/onboarding.ts**
   - Already includes `invoiceState` in update logic

## Validation Rules

- **invoicePincode**: Must be exactly 6 digits (string)
- **invoicePhone**: 10-13 digits (string, optional, leading 0 allowed)
- **invoiceEmail**: Valid email format (optional)
- **invoicePrefix**: Alphanumeric, max 8 characters, A-Z0-9 (optional)
