# Prisma Schema Fix Summary

## Problem
After reapplying the entire DB schema from scratch, runtime errors occurred:
- `Cannot read properties of undefined (reading 'findMany')` at `prisma.platformInvoice.findMany()`
- Missing Prisma models causing crashes in billing, store settings, and bank account modules

## Root Cause
The schema.prisma was missing several models that were being used in the codebase:
1. `PlatformInvoice` - Platform billing invoices
2. `PlatformInvoiceLineItem` - Invoice line items
3. `PlatformBillingProfile` - Platform billing configuration (singleton)
4. `PlatformSettlementCycle` - Weekly settlement cycles
5. `MerchantStoreSettings` - Store-specific settings (invoice prefix, branding, etc.)
6. `MerchantBankAccount` - Bank account details for payouts

Additionally, `PayoutBatch` was missing fields:
- `cycleId` - Link to settlement cycle
- `platformInvoiceId` - Link to platform invoice

## Changes Made

### 1. Added Missing Models to `prisma/schema.prisma`

#### PlatformBillingProfile (Singleton)
```prisma
model PlatformBillingProfile {
  id                String   @id @default("platform")
  legalName         String
  invoicePrefix     String
  invoiceNextNumber Int      @default(1)
  invoicePadding    Int      @default(5)
  seriesFormat      String   @default("{PREFIX}-{FY}-{NNNNN}")
  defaultSacCode    String   @default("9983")
  defaultGstRate    Decimal  @db.Decimal(5, 2) @default(18)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("platform_billing_profile")
}
```

#### PlatformSettlementCycle
```prisma
model PlatformSettlementCycle {
  id                String                    @id @default(cuid())
  periodStart       DateTime
  periodEnd         DateTime
  status            PlatformSettlementStatus  @default(DRAFT)
  invoiceGeneratedAt DateTime?
  createdAt         DateTime                  @default(now())
  updatedAt         DateTime                  @updatedAt

  invoices PlatformInvoice[]

  @@unique([periodStart, periodEnd])
  @@index([status])
  @@index([periodStart])
  @@index([periodEnd])
  @@map("platform_settlement_cycles")
}

enum PlatformSettlementStatus {
  DRAFT
  INVOICED
  PAID
}
```

#### PlatformInvoice
```prisma
model PlatformInvoice {
  id            String              @id @default(cuid())
  merchantId    String
  cycleId       String
  invoiceNumber String               @unique
  invoiceDate   DateTime
  currency      String               @default("INR")
  subtotal      Decimal              @db.Decimal(10, 2)
  gstAmount     Decimal              @db.Decimal(10, 2)
  total         Decimal              @db.Decimal(10, 2)
  status        PlatformInvoiceStatus @default(ISSUED)
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  merchant  Merchant                @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  cycle     PlatformSettlementCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  lineItems PlatformInvoiceLineItem[]
  payouts   PayoutBatch[]

  @@index([merchantId])
  @@index([cycleId])
  @@index([invoiceNumber])
  @@index([status])
  @@index([invoiceDate])
  @@index([merchantId, invoiceDate])
  @@map("platform_invoices")
}

enum PlatformInvoiceStatus {
  ISSUED
  PAID
  CANCELLED
}
```

#### PlatformInvoiceLineItem
```prisma
model PlatformInvoiceLineItem {
  id          String   @id @default(cuid())
  invoiceId   String
  type        String   // "PLATFORM_FEE", etc.
  description String
  sacCode     String?
  quantity    Decimal  @db.Decimal(10, 2)
  unitPrice   Decimal  @db.Decimal(10, 2)
  amount      Decimal  @db.Decimal(10, 2)
  gstRate     Decimal  @db.Decimal(5, 2)
  gstAmount   Decimal  @db.Decimal(10, 2)
  totalAmount Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())

  invoice PlatformInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
  @@map("platform_invoice_line_items")
}
```

#### MerchantStoreSettings
```prisma
model MerchantStoreSettings {
  id                        String   @id @default(cuid())
  merchantId                String   @unique
  
  // Store branding, contact, address, policies, social links, analytics, SEO, invoice settings
  // ... (see schema.prisma for full field list)
  
  merchant Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)

  @@index([merchantId])
  @@index([isStoreLive])
  @@map("merchant_store_settings")
}
```

#### MerchantBankAccount
```prisma
model MerchantBankAccount {
  id                  String                  @id @default(cuid())
  merchantId          String                  @unique
  
  // Account details
  accountHolderName   String
  bankName            String
  accountNumber       String
  ifscCode            String
  accountType         BankAccountType
  
  // Verification status
  verificationStatus  BankVerificationStatus  @default(NOT_SUBMITTED)
  
  // Proof document, submission & verification fields
  // ... (see schema.prisma for full field list)
  
  merchant Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)

  @@index([merchantId])
  @@index([verificationStatus])
  @@map("merchant_bank_accounts")
}

enum BankAccountType {
  SAVINGS
  CURRENT
}

enum BankVerificationStatus {
  NOT_SUBMITTED
  PENDING
  VERIFIED
  REJECTED
}

enum BankProofType {
  CANCELLED_CHEQUE
  BANK_STATEMENT
}
```

### 2. Updated PayoutBatch Model
Added missing fields:
```prisma
model PayoutBatch {
  // ... existing fields ...
  cycleId           String?
  platformInvoiceId String?
  
  platformInvoice PlatformInvoice? @relation(fields: [platformInvoiceId], references: [id], onDelete: SetNull)
  
  @@index([cycleId])
  @@index([platformInvoiceId])
}
```

### 3. Updated Merchant Model Relations
Added relations to new models:
```prisma
model Merchant {
  // ... existing fields ...
  platformInvoices PlatformInvoice[]
  storeSettings MerchantStoreSettings?
  bankAccount MerchantBankAccount?
}
```

### 4. Fixed Field Name Mismatches

#### lib/billing/queries.ts
Changed `onboarding` select fields from:
- `contactEmail` → `invoiceEmail`
- `contactPhone` → `invoicePhone`
- `addressLine1` → `invoiceAddressLine1`
- `addressLine2` → `invoiceAddressLine2`
- `city` → `invoiceCity`
- `state` → `invoiceState`
- `contactPincode` → `invoicePincode`

### 5. Added Dev-Time Prisma Model Validation

#### lib/prisma.ts
Added startup validation that:
- Lists all available Prisma models
- Checks for expected models
- Warns if models are missing (indicates schema/client mismatch)

## Files Changed

1. `prisma/schema.prisma` - Added 6 new models, 3 new enums, updated PayoutBatch and Merchant
2. `lib/billing/queries.ts` - Fixed field name mismatches in onboarding selects
3. `lib/prisma.ts` - Added dev-time model validation
4. `app/api/jobs/execute-weekly-payouts/route.ts` - Fixed bankAccount select to only include accountNumber

## Next Steps

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Create Migration:**
   ```bash
   npx prisma migrate dev --name add_missing_billing_models
   ```

3. **Verify Types:**
   ```bash
   npm run build
   ```

4. **Test Critical Paths:**
   - Merchant dashboard (should not crash)
   - Admin platform invoices page
   - Store settings page
   - Bank account settings page
   - Payout execution job

## Verification Checklist

- [x] All missing models added to schema
- [x] All relations properly defined
- [x] Field name mismatches fixed
- [x] Dev-time validation added
- [ ] Prisma client regenerated
- [ ] Migration created and applied
- [ ] TypeScript build passes
- [ ] No runtime Prisma errors

## Notes

- The schema now includes all models referenced in the codebase
- All relations are properly cascaded for data integrity
- Indexes are added for performance on commonly queried fields
- Dev-time validation will help catch future schema/client mismatches early
