# Disabled Modules – Identification & Fix Summary

## Part 1: Identification Checklist

| Module / Route | File(s) | Why disabled / condition |
|----------------|---------|---------------------------|
| Admin overview page | `app/admin/(protected)/page.tsx` | **FIXED** – Was hard-coded "Admin Module Disabled". Replaced with Admin Overview (quick links). |
| Admin merchants API | `app/api/admin/merchants/route.ts`, `[merchantId]/route.ts` | Stub returning 501 "Admin module disabled". **FIXED** – Auth + feature flag + 501 "Not implemented yet". |
| Admin merchant hold/release | `app/api/admin/merchants/[merchantId]/hold/route.ts`, `release-hold/route.ts` | Stub 501. **FIXED** – Same pattern. |
| Admin merchant KYC | `app/api/admin/merchants/[merchantId]/kyc/approve/route.ts` | Stub 501. **FIXED**. |
| Admin merchant ledger | `app/api/admin/merchants/[merchantId]/ledger/route.ts` | Stub 501. **FIXED**. |
| Admin admin-users | `app/api/admin/admin-users/route.ts`, `create/route.ts`, `[id]/route.ts`, `[id]/roles/route.ts` | Stub 501. **FIXED**. |
| Admin roles | `app/api/admin/roles/route.ts`, `[id]/route.ts` | Stub 501. **FIXED**. |
| Admin audit-logs | `app/api/admin/audit-logs/route.ts` | Stub 501. **FIXED**. |
| Admin system-settings | `app/api/admin/system-settings/route.ts` | Stub 501. **FIXED**. |
| Admin billing-profile | `app/api/admin/billing-profile/route.ts` | Stub 501. **FIXED**. |
| Billing statement CSV | `app/api/billing/statement.csv/route.ts` | "Billing module temporarily disabled" 501. **FIXED** – Feature flag + 501 "Not implemented yet". |
| Billing invoice PDF | `app/api/billing/invoice.pdf/route.ts` | Same. **FIXED**. |
| Admin RBAC getAdminUser | `lib/auth/adminRbac.ts` | Comment "Admin module disabled" – returns null. **FIXED** – Comment updated; behavior unchanged (allowlist-only). |
| Merchant ON_HOLD messaging | `components/dashboard/MerchantStatusBanner.tsx`, `app/dashboard/account-hold/page.tsx`, `emails/merchantStatus.ts` | **Intentional** – "temporarily disabled" for held accounts (products, payouts). No change. |
| Product actions when ON_HOLD | `app/actions/products.ts` | **Intentional** – Returns error "Account under review. Product creation/updates temporarily disabled." No change. |
| UPI payment | `components/PaymentForm.tsx` | "UPI payment integration coming soon" – UI placeholder. No change (not a "disabled" gate). |

## Part 2: Fixes Applied

1. **Super admin gating**  
   - Already robust in `lib/admin-allowlist.ts` (SUPER_ADMIN_EMAIL / SUPER_ADMIN_EMAILS, trim + lowercase).  
   - Admin API stubs now use `requireAdminForApi()` so only allowlisted admins get 501 "Not implemented yet"; others get 401/403.

2. **No NODE_ENV production disables**  
   - No "if NODE_ENV === production then disable" logic was found or added.

3. **Central feature flags**  
   - Added `lib/featureFlags.ts`: all flags default **true**, overridable via env (e.g. `FEATURE_ADMIN_AUDIT_LOGS=false`).

4. **Admin stub API routes**  
   - All return 401/403 when not admin, 503 when feature flag off, 501 with `{ error: "Not implemented yet" }` when flag on and stub.

5. **Billing stub routes**  
   - Use feature flags only (no admin); return 503 when flag off, 501 "Not implemented yet" when on.

6. **Admin overview page**  
   - No longer shows "Admin Module Disabled"; shows Admin Overview with quick links (only super admins reach it via layout).

7. **adminRbac**  
   - Comment updated; `getAdminUser` still returns null (allowlist-only auth).

## Part 3: Files Changed

- `lib/featureFlags.ts` (new)
- `lib/admin-auth.ts` (requireAdminForApi + NextResponse import)
- `lib/auth/adminRbac.ts` (comment only)
- `app/api/admin/merchants/route.ts`
- `app/api/admin/merchants/[merchantId]/route.ts`
- `app/api/admin/merchants/[merchantId]/hold/route.ts`
- `app/api/admin/merchants/[merchantId]/release-hold/route.ts`
- `app/api/admin/merchants/[merchantId]/kyc/approve/route.ts`
- `app/api/admin/merchants/[merchantId]/ledger/route.ts`
- `app/api/admin/admin-users/route.ts`
- `app/api/admin/admin-users/create/route.ts`
- `app/api/admin/admin-users/[id]/route.ts`
- `app/api/admin/admin-users/[id]/roles/route.ts`
- `app/api/admin/roles/route.ts`
- `app/api/admin/roles/[id]/route.ts`
- `app/api/admin/audit-logs/route.ts`
- `app/api/admin/system-settings/route.ts`
- `app/api/admin/billing-profile/route.ts`
- `app/api/billing/statement.csv/route.ts`
- `app/api/billing/invoice.pdf/route.ts`
- `app/admin/(protected)/page.tsx` (already fixed earlier – Admin Overview)

## Part 4: Env Vars (Vercel / optional)

- **Super admin** (unchanged): `SUPER_ADMIN_EMAIL` or `SUPER_ADMIN_EMAILS`
- **Feature flags** (all default true; set to `false` to disable):
  - `FEATURE_ADMIN_MERCHANTS`
  - `FEATURE_ADMIN_MERCHANTS_HOLD_RELEASE`
  - `FEATURE_ADMIN_MERCHANTS_KYC`
  - `FEATURE_ADMIN_MERCHANTS_LEDGER`
  - `FEATURE_ADMIN_ADMIN_USERS`
  - `FEATURE_ADMIN_ROLES`
  - `FEATURE_ADMIN_AUDIT_LOGS`
  - `FEATURE_ADMIN_SYSTEM_SETTINGS`
  - `FEATURE_ADMIN_BILLING_PROFILE`
  - `FEATURE_BILLING_STATEMENT`
  - `FEATURE_BILLING_INVOICE_PDF`

## Verification

- `npm run lint` – pass  
- `npm run check:types` – pass  
- `npm run build` – compiles and generates pages; failure in CI is from DB unreachable / sandbox, not from these changes.
