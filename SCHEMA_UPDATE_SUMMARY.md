# Invoice Fields Schema Update - Summary

## ✅ Completed Changes

### 1. Prisma Schema (`prisma/schema.prisma`)

Added invoice/billing address fields to `MerchantOnboarding` model:

**Required fields (String, NOT NULL):**
- `invoiceAddressLine1` - Billing address line 1
- `invoiceCity` - Billing city
- `invoicePincode` - Billing pincode (6 digits, stored as String)
- `invoiceState` - Billing state

**Optional fields (String?, nullable):**
- `invoiceAddressLine2` - Billing address line 2
- `invoicePhone` - Billing phone (10-13 digits, leading 0 allowed)
- `invoiceEmail` - Billing email
- `invoicePrefix` - Invoice number prefix (max 8 chars, A-Z0-9)

### 2. Migration (`prisma/migrations/20260222144321_add_invoice_fields_to_onboarding/migration.sql`)

Migration SQL that:
1. Adds all columns as nullable first (to handle existing rows)
2. Updates existing rows with empty strings for required fields
3. Makes required fields NOT NULL

### 3. Zod Validation (`lib/validation/invoiceStep.ts`)

Updated validation schema:
- ✅ `invoicePincode`: 6 digits string (required)
- ✅ `invoicePhone`: 10-13 digits string, optional, leading 0 allowed
- ✅ `invoiceEmail`: email format, optional
- ✅ `invoicePrefix`: alphanumeric max 8, optional
- ✅ `invoiceState`: required (updated from optional)

### 4. Update Logic (`app/actions/onboarding.ts`)

Fixed update logic to:
- Set required fields directly (no null checks)
- Handle optional fields with undefined checks

## 🚀 Next Steps

Run these commands to apply the migration:

```bash
# Apply migration and generate Prisma client
npx prisma migrate dev --name add_invoice_fields_to_onboarding

# If migration already exists, just generate client
npx prisma generate
```

## ✅ Verification Checklist

After running migration:

- [ ] Migration applied successfully
- [ ] Prisma client generated
- [ ] TypeScript compiles without errors
- [ ] Onboarding save works without "Unknown argument" error
- [ ] Required fields are validated on frontend
- [ ] Optional fields can be left empty
- [ ] Data persists to database correctly

## 📋 Field Requirements Summary

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| invoiceAddressLine1 | String | ✅ Yes | min 1 char |
| invoiceAddressLine2 | String? | ❌ No | - |
| invoiceCity | String | ✅ Yes | min 1 char |
| invoicePincode | String | ✅ Yes | exactly 6 digits |
| invoicePhone | String? | ❌ No | 10-13 digits |
| invoiceEmail | String? | ❌ No | valid email format |
| invoicePrefix | String? | ❌ No | max 8 chars, A-Z0-9 |
| invoiceState | String | ✅ Yes | min 1 char |
