# Invoice Fields Migration

## Schema Changes

Added the following invoice/billing address fields to `MerchantOnboarding` model:

- `invoiceAddressLine1` (String?, optional)
- `invoiceAddressLine2` (String?, optional)
- `invoiceCity` (String?, optional)
- `invoicePincode` (String?, optional)
- `invoicePincode` (String?, optional)
- `invoicePhone` (String?, optional)
- `invoiceEmail` (String?, optional)
- `invoicePrefix` (String?, optional)
- `invoiceState` (String?, optional)

## Migration Steps

1. **Run the migration:**
   ```bash
   npx prisma migrate dev --name add_invoice_fields_to_onboarding
   ```
   
   OR if the migration file already exists:
   ```bash
   npx prisma migrate deploy
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Verify the migration:**
   - Check that the migration was applied successfully
   - Verify the fields exist in the database
   - Test onboarding save with invoice fields

## Files Changed

1. **prisma/schema.prisma**
   - Added invoice fields to `MerchantOnboarding` model

2. **prisma/migrations/20240225000000_add_invoice_fields_to_onboarding/migration.sql**
   - Migration SQL to add columns to `merchant_onboarding` table

## Testing

After migration:
1. Start the app: `npm run dev`
2. Navigate to onboarding invoice step
3. Fill in invoice fields and click "Save & Continue"
4. Verify no Prisma errors occur
5. Check database to confirm fields are saved
