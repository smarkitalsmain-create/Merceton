# Admin/Billing Module Cleanup Summary

## Disabled Modules

### Admin API Routes (app/api/admin/**)
All routes now return `501 Not Implemented`:
- ✅ `app/api/admin/admin-users/**` - Disabled
- ✅ `app/api/admin/roles/**` - Disabled
- ✅ `app/api/admin/system-settings/route.ts` - Disabled
- ✅ `app/api/admin/audit-logs/route.ts` - Disabled
- ✅ `app/api/admin/billing-profile/route.ts` - Disabled
- ✅ `app/api/admin/merchants/**` - Disabled (including hold/release/kyc)

### Admin Pages (app/admin/**)
- ✅ `app/admin/(protected)/page.tsx` - Shows "Admin Module Disabled" message

### Billing Routes (app/api/billing/**)
All routes now return `501 Not Implemented`:
- ✅ `app/api/billing/invoice.pdf/route.ts` - Disabled
- ✅ `app/api/billing/statement.csv/route.ts` - Disabled

## Removed/Updated Code

### Prisma Model References Removed
- ✅ `prisma.role` - Removed from `lib/auth/adminRbac.ts`
- ✅ `prisma.permission` - Removed from `lib/billing/seedPermissions.ts`
- ✅ `prisma.rolePermission` - Removed from `lib/auth/adminRbac.ts`
- ✅ `prisma.adminUser` - Stubbed in `lib/auth/adminRbac.ts` (returns null)
- ✅ `prisma.systemSettings` - Removed from admin routes
- ✅ `prisma.invoiceSequence` - Replaced with `PlatformBillingProfile` in `lib/billing/invoiceNumber.ts`
- ✅ `prisma.invoiceRecord` - Not found in codebase
- ✅ `prisma.adminAuditLog` - Stubbed in `lib/auth/adminRbac.ts` (logs to console only)

### TaxType Enum
- ✅ Removed `TaxType` import from `lib/billing/aggregate.ts` (replaced with local type)
- ✅ Removed `TaxType` import from `scripts/seed-billing-data.ts`
- ✅ Removed `taxType` field usage in seed script

### Advanced Ledger Fields
- ✅ `occurredAt` - Replaced with `createdAt` in `lib/billing/aggregate.ts`
- ✅ `baseAmountPaise`, `cgstPaise`, `sgstPaise`, `igstPaise`, `totalAmountPaise` - Not found in active code
- ✅ `taxType` - Removed from seed script
- ✅ `currency` - Not found in active code

### Invoice Sequence Logic
- ✅ `lib/billing/invoiceNumber.ts` - Updated to use `PlatformBillingProfile` instead of `invoiceSequence`
- ✅ `lib/billing/allocatePlatformInvoiceNumber.ts` - Already uses `PlatformBillingProfile` (no changes needed)

### RBAC Functions Updated
- ✅ `getAdminUser()` - Returns null (model removed)
- ✅ `hasPermission()` - Uses allowlist-based auth only
- ✅ `getAdminUserWithPermissions()` - Uses allowlist-based auth only
- ✅ `createAuditLog()` - Logs to console only (model removed)

## Active Subsystems

The following subsystems remain active and functional:

### Core Merchant System
- ✅ Merchant model and CRUD operations
- ✅ Merchant onboarding
- ✅ Merchant storefront settings
- ✅ Merchant bank accounts

### Storefront System
- ✅ Storefront pages and products
- ✅ Order placement and checkout
- ✅ Customer-facing invoices

### Orders System
- ✅ Order creation and management
- ✅ Order number generation (`OrderNumberCounter`)
- ✅ Order status tracking

### Basic Ledger
- ✅ `LedgerEntry` model (simplified - no advanced tax fields)
- ✅ Basic ledger operations (amount, type, status)
- ✅ Ledger export (if using basic fields only)

## Files Modified

### API Routes (Disabled)
1. `app/api/admin/admin-users/route.ts`
2. `app/api/admin/admin-users/[id]/route.ts`
3. `app/api/admin/admin-users/[id]/roles/route.ts`
4. `app/api/admin/admin-users/create/route.ts`
5. `app/api/admin/roles/route.ts`
6. `app/api/admin/roles/[id]/route.ts`
7. `app/api/admin/system-settings/route.ts`
8. `app/api/admin/audit-logs/route.ts`
9. `app/api/admin/billing-profile/route.ts`
10. `app/api/admin/merchants/route.ts`
11. `app/api/admin/merchants/[merchantId]/route.ts`
12. `app/api/admin/merchants/[merchantId]/hold/route.ts`
13. `app/api/admin/merchants/[merchantId]/release-hold/route.ts`
14. `app/api/admin/merchants/[merchantId]/kyc/approve/route.ts`
15. `app/api/admin/merchants/[merchantId]/ledger/route.ts`
16. `app/api/billing/invoice.pdf/route.ts`
17. `app/api/billing/statement.csv/route.ts`

### Library Files (Updated)
18. `lib/auth/adminRbac.ts` - Removed RBAC model references
19. `lib/billing/invoiceNumber.ts` - Replaced invoiceSequence with PlatformBillingProfile
20. `lib/billing/aggregate.ts` - Removed TaxType import, replaced occurredAt with createdAt
21. `lib/billing/seedPermissions.ts` - Stubbed (models removed)
22. `scripts/seed-billing-data.ts` - Removed TaxType import and taxType field

### Admin Pages (Disabled)
23. `app/admin/(protected)/page.tsx` - Shows disabled message

## Verification

Run TypeScript check:
```bash
npx tsc --noEmit
```

Expected: Error count should drop from 168 to near zero (only remaining errors should be unrelated to Admin/Billing modules).

## Notes

- Admin pages under `app/admin/(protected)/**` are still accessible but will show "Admin Module Disabled" message
- Merchant hold/release/kyc functionality is disabled (was in admin routes)
- Billing invoice generation is disabled temporarily
- RBAC is completely disabled - only allowlist-based super admin access remains
- Audit logging is disabled (logs to console only)
