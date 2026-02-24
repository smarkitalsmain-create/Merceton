# MERCETON PRODUCT BLUEPRINT (Fresh)

Last generated on: 2026-02-24

Status legend:
- **Implemented**: Fully wired and used in code.
- **Partial**: Structure or logic exists, but coverage or safety is incomplete.
- **Risk**: Present but with clear security/financial/safety gaps.

---

## 1. System Overview (Status: Implemented)

- **Core stack**
  - Framework: Next.js 14 App Router (`app/`), TypeScript.
  - ORM/DB: Prisma (`prisma/schema.prisma`) with PostgreSQL (`provider = "postgresql"`).
  - Runtime: Node.js for APIs (`export const runtime = "nodejs"` in `app/api/**/route.ts`).
  - Styling/UI: Tailwind-based (inferred from class names; configuration file not in scanned paths).

- **Auth system (Implemented)**
  - Primary auth: Supabase.
    - Supabase clients in `lib/supabase/*`:
      - `server.ts`, `server-readonly.ts`, `admin-server.ts`, `admin-server-readonly.ts`, `client.ts`, `admin-client.ts`.
    - App (merchant) auth helpers in `lib/auth.ts`:
      - `requireAuth()` → Supabase `auth.getUser()`, redirect to `/sign-in` if missing.
      - `requireUser()` → upserts `User` record with `authUserId`, default `role: "ADMIN"`.
      - `requireMerchant()` → requires linked `Merchant` or redirects to `/onboarding/create-store`.
      - `requireAdmin()` → enforces merchant-level admin (`user.role === "ADMIN"`).
      - `authorizeRequest(resourceMerchantId?)` → returns `{ user, merchant }`, optionally checks `resourceMerchantId`.
  - Platform admin / super admin (Implemented):
    - `lib/admin-auth.ts` with Supabase admin clients and allowlist-based checks (`isEmailInAllowlist`):
      - `isSuperAdmin()`, `requireSuperAdmin()`, `requireAdmin()`, `requirePlatformAdmin()`, `getAdminIdentity()`.

- **Payment gateway (Implemented, with Risks)**
  - Razorpay integration:
    - Client: `components/CheckoutForm.tsx` loads Razorpay script, calls `/api/payments/create-razorpay-order` and `/api/payments/verify`.
    - Server:
      - `app/api/payments/create-razorpay-order/route.ts` → creates Razorpay order, updates `Payment.razorpayOrderId`.
      - `app/api/payments/verify/route.ts` → verifies signature and updates `Payment`, `Order`, and `LedgerEntry`.
      - `app/api/webhooks/razorpay/route.ts` → handles webhooks, verifies signature and updates records.

- **Deployment & environment (Implemented)**
  - `lib/site.ts::getBaseUrl()`:
    - Uses `NEXT_PUBLIC_APP_URL` if valid.
    - Else `https://${VERCEL_URL}` if set.
    - Else `http://localhost:3000`.
  - `app/layout.tsx` sets `metadataBase: getBaseUrl()`.
  - No Next.js config file is in scanned paths; assume standard build.

---

## 2. User Roles (Status: Partial)

- **App-side roles (merchant workspace)**
  - Prisma enum `UserRole`:
    - `ADMIN`
    - `STAFF`
  - Code usage:
    - `lib/auth.ts::requireUser()` always creates users with `role: "ADMIN"`.
    - `requireAdmin()` checks `user.role !== "ADMIN"` and redirects.
  - **Status**: `ADMIN` is Implemented; `STAFF` exists in schema but no dedicated handling or UI → **Partial**.

- **Merchant account / KYC states (Implemented)**
  - `MerchantAccountStatus`: `ACTIVE`, `ON_HOLD`.
  - `MerchantKycStatus`: `PENDING`, `SUBMITTED`, `APPROVED`, `REJECTED`.
  - Used in:
    - `Merchant` model fields.
    - Status history models `MerchantStatusEvent`, `MerchantStatusHistory`.
    - Middleware routing (custom domain only for `accountStatus === "ACTIVE"`).
    - Email notifications via `lib/email/notifications.ts` and `app/actions/merchant-status.ts`.

- **Platform admin / super admin (Implemented, Risk: central allowlist)**
  - Not stored as a DB enum; determined by:
    - Supabase admin session (`createSupabaseAdminServerReadonlyClient()`).
    - `isEmailInAllowlist` function (in `lib/admin-allowlist.ts`, inferred from imports).
  - Functions:
    - `requireSuperAdmin()` → redirects non-super admins.
    - `requireAdmin()/requirePlatformAdmin()` → throws `UNAUTHORIZED` or `FORBIDDEN`.
  - **Risk**: Single allowlist without additional RBAC granularity.

- **Support ticket actor types (Implemented)**
  - Prisma enum `TicketSenderType`: `MERCHANT`, `ADMIN`.
  - Used in `TicketMessage.senderType` to distinguish who sent each message.

---

## 3. Route Map (Status: Implemented with Legacy/Partial Copies)

Only `app/**/page.tsx` under current routing are considered canonical. Many `_app` and `_admin` mirrors exist but are treated as legacy/redirected by `middleware.ts`.

### 3.1 Public and auth routes (Implemented)

- `/` → `app/page.tsx`
  - Role: Public.
  - Purpose: Landing/marketing/home.
  - Main actions: Render static/marketing content (implementation details not in scanned snippet).

- `/sign-in` → `app/sign-in/page.tsx`
  - Role: Public.
  - Purpose: Merchant login.
  - Main actions: Supabase login UI; entry point used by `middleware.ts` for protected route redirects.

- `/sign-up` → `app/sign-up/page.tsx`
  - Role: Public.
  - Purpose: Merchant registration (Implemented).

- `/forgot-password` → `app/forgot-password/page.tsx`
- `/reset-password` → `app/reset-password/page.tsx`
  - Role: Public.
  - Purpose: Password reset journeys.
  - Implementation: Pages exist; actual password email reset is Supabase-managed; custom email helper is present but unused → **Partial** custom reset implementation.

- `/503` → `app/503/page.tsx`
  - Role: Public.
  - Purpose: Degraded/DB-down state.
  - Main actions: Static error content; `lib/auth.ts` redirects here on DB connection errors.

### 3.2 Storefront routes (Implemented)

- `/s/[slug]` → `app/s/[slug]/page.tsx`
  - Role: Public shopper.
  - Purpose: Merchant storefront home by slug.
  - Main actions: Render theme/builder-based storefront using `StorefrontSettings` and `StorefrontPage`.

- `/s/[slug]/p/[productId]` → `app/s/[slug]/p/[productId]/page.tsx`
  - Role: Public.
  - Purpose: Product detail page.
  - Main actions: Show product information (name, images, price, description).

- `/s/[slug]/checkout` → `app/s/[slug]/checkout/page.tsx`
  - Role: Public customer.
  - Purpose: Checkout and payment entrypoint.
  - Main actions:
    - Uses `components/CheckoutForm.tsx`.
    - Creates orders via `/api/orders/create`.
    - Initiates Razorpay for online payments.

- `/s/[slug]/order/[orderId]` → `app/s/[slug]/order/[orderId]/page.tsx`
- `/s/[slug]/order/[orderId]/payment` → `app/s/[slug]/order/[orderId]/payment/page.tsx`
  - Role: Public (link-based).
  - Purpose: Order status and payment continuation.

### 3.3 Merchant dashboard routes (Implemented)

All `/dashboard/**` paths are protected by `middleware.ts` + `requireMerchant()`/`requireUser()` in server components.

- `/dashboard` → `app/dashboard/page.tsx`
  - Role: Merchant (logged in).
  - Purpose: High-level store dashboard.

- Onboarding and settings:
  - `/dashboard/onboarding` → `app/dashboard/onboarding/page.tsx`
  - `/dashboard/settings` → `app/dashboard/settings/page.tsx`
  - `/dashboard/settings/onboarding` → `app/dashboard/settings/onboarding/page.tsx`
  - `/dashboard/settings/store` → `app/dashboard/settings/store/page.tsx`
  - `/dashboard/settings/domain` → `app/dashboard/settings/domain/page.tsx`
  - `/dashboard/settings/bank` → `app/dashboard/settings/bank/page.tsx`
  - `/dashboard/settings/invoice` → `app/dashboard/settings/invoice/page.tsx`
  - Purpose: Merchant onboarding, store config, custom domain, bank account, invoice settings.

- Products:
  - `/dashboard/products` → `app/dashboard/products/page.tsx`
  - `/dashboard/products/new` → `app/dashboard/products/new/page.tsx`
  - `/dashboard/products/[id]/edit` → `app/dashboard/products/[id]/edit/page.tsx`
  - `/dashboard/products/import` → `app/dashboard/products/import/page.tsx`
  - Purpose: Product CRUD, CSV import.

- Orders:
  - `/dashboard/orders` → `app/dashboard/orders/page.tsx`
  - `/dashboard/orders/[orderId]` → `app/dashboard/orders/[orderId]/page.tsx`
  - `/dashboard/orders/[orderId]/invoice` → `app/dashboard/orders/[orderId]/invoice/page.tsx`
  - Purpose: Order list/detail/invoicing.

- Ledger & payouts:
  - `/dashboard/ledger` → `app/dashboard/ledger/page.tsx`
  - `/dashboard/payouts` → `app/dashboard/payouts/page.tsx`
  - `/dashboard/payouts/invoices` → `app/dashboard/payouts/invoices/page.tsx`
  - `/dashboard/payouts/invoices/[invoiceId]` → `app/dashboard/payouts/invoices/[invoiceId]/page.tsx`

- Billing & analytics:
  - `/dashboard/billing` → `app/dashboard/billing/page.tsx`
  - `/dashboard/analytics` → `app/dashboard/analytics/page.tsx`
    - Uses `AnalyticsDashboard` to query analytics APIs.

- Storefront builder:
  - `/dashboard/storefront` → `app/dashboard/storefront/page.tsx`
  - Purpose: Manage `StorefrontSettings` and custom code/builder outputs.

- Account hold:
  - `/dashboard/account-hold` → `app/dashboard/account-hold/page.tsx`
  - Purpose: Shows hold reason and restricts actions; status is driven by `Merchant.accountStatus`.

- Support:
  - `/dashboard/support` → `app/dashboard/support/page.tsx`
  - `/dashboard/support/new` → `app/dashboard/support/new/page.tsx`
  - `/dashboard/support/[id]` → `app/dashboard/support/[id]/page.tsx`
  - Purpose: Merchant ticket list, ticket creation, ticket detail (uses `Ticket` models and `app/actions/tickets.ts`).

### 3.4 Marketing / coupons (Implemented)

- `/dashboard/marketing/coupons` → `app/dashboard/marketing/coupons/page.tsx`
- `/dashboard/marketing/coupons/new` → `app/dashboard/marketing/coupons/new/page.tsx`
- `/dashboard/marketing/coupons/[id]/edit` → `app/dashboard/marketing/coupons/[id]/edit/page.tsx`
  - Role: Merchant with coupon feature.
  - Purpose: Manage `Coupon` entities; relies on `app/actions/coupons.ts`.

### 3.5 Admin routes (Implemented, Risk: allowlist-only RBAC)

Under `app/admin/(protected)/**`:

- Core admin:
  - `/admin` → admin home.
  - `/admin/sign-in` → admin login.

- Merchant management:
  - `/admin/merchants` and `/admin/merchants/[merchantId]`.
  - `/admin/merchants/[merchantId]/billing`, `/admin/merchants/[merchantId]/pricing`.

- Orders/payments/payouts/platform invoices:
  - `/admin/orders`, `/admin/orders/[orderId]`.
  - `/admin/payments`, `/admin/payouts`, `/admin/payouts/[payoutId]`.
  - `/admin/platform-invoices`, `/admin/platform-invoices/[invoiceId]`.

- Pricing & packages:
  - `/admin/pricing`, `/admin/pricing/new`, `/admin/pricing/[id]`, `/admin/pricing/[id]/edit`.
  - `/admin/pricing-packages`, `/admin/pricing-packages/new`, `/admin/pricing-packages/[id]/edit`.

- System & admin users:
  - `/admin/settings`, `/admin/settings/system`, `/admin/settings/billing`, `/admin/settings/roles`, `/admin/settings/admin-users`, `/admin/settings/audit-logs`.
  - `/admin/audit-logs` (top-level alias).

- Domains:
  - `/admin/domains`.

Legacy `_admin` and `_app` pages mirror these but are effectively superseded by current routing and `middleware.ts` rewrites → **Partial / Legacy**.

---

## 4. API Map (Status: Implemented with Risks)

Only APIs under `app/api/**/route.ts` are listed. All use runtime `"nodejs"` and many are marked `dynamic = "force-dynamic"` with `revalidate = 0`.

For brevity, grouped by domain.

### 4.1 Health & diagnostics

- `GET /api/health`
  - Auth: None.
  - DB writes: None.
  - External: None.
  - Risk: None observed (implementation details not visible, but typical health check).

- `GET /api/env-check`
  - Auth: None.
  - Implementation details: Not surfaced in inspected snippets.
  - Risk: **Partial** – requires manual review to ensure no sensitive env values are exposed.

### 4.2 Payments (Razorpay)

- `POST /api/payments/create-razorpay-order`
  - Auth: **Not found** (`requireMerchant()` / `authorizeRequest()` not used).
  - Logic:
    - Body JSON `{ orderId }`.
    - Loads `Order` with `merchant` and `payment`.
    - Validates:
      - Order exists.
      - Payment exists.
      - Payment `paymentMethod === "RAZORPAY"`.
      - Payment `status === "CREATED"`.
    - If `payment.razorpayOrderId` already set → returns it (idempotent).
    - Creates Razorpay order via `razorpay.orders.create`.
    - Updates `Payment` with `razorpayOrderId`.
  - DB writes: `payment.update`.
  - External: Razorpay Orders API.
  - Risk: **Risk**
    - No authentication or tenant check; any caller with `orderId` can create/obtain Razorpay order IDs.

- `POST /api/payments/verify`
  - Auth: Not enforced.
  - Logic:
    - Body JSON: `{ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }`.
    - Validates required fields.
    - Loads `Order` with `payment`.
    - Verifies:
      - HMAC signature (`RAZORPAY_KEY_SECRET`).
      - `payment.razorpayOrderId === razorpayOrderId`.
      - Prevents duplicate processing if `payment.status === "PAID"`.
    - In Prisma transaction:
      - Updates `Payment` to `PAID` with Razorpay IDs.
      - Updates `Order.status` to `CONFIRMED`.
      - Updates matching `LedgerEntry` rows from `PENDING` to `PROCESSING`.
  - DB writes: `payment.update`, `order.update`, `ledgerEntry.updateMany`.
  - External: None.
  - Risk: **Risk**
    - Public endpoint; while HMAC protects integrity, no tenant or auth check is present.

- `POST /api/webhooks/razorpay`
  - Auth: Validates `x-razorpay-signature` with `RAZORPAY_WEBHOOK_SECRET`.
  - Logic:
    - Parses event JSON.
    - `payment.captured`:
      - Finds `Payment` by `razorpayOrderId`.
      - Validates amount.
      - Idempotent check for `status === "PAID"`.
      - Transaction: `payment.update`, `order.update`, `ledgerEntry.updateMany` (to `PROCESSING`).
    - `payment.failed`:
      - Marks `Payment.status = FAILED` (if not already `PAID`).
    - Other events: ack.
  - DB writes: Payment/order/ledger updates as above.
  - External: None.
  - Risk: **Partial**
    - Trusts Razorpay mapping; no extra merchant-level cross-check (but incoming data is from PSP).

### 4.3 Merchant orders

- `GET /api/merchant/orders`
  - Auth: Implemented.
    - Uses Supabase server client (`createSupabaseServerClient` from `lib/supabase/server`) and `auth.getUser()`.
    - Loads `User`+`Merchant` via Prisma.
  - Logic:
    - Builds `where` filter by `merchantId`, optional `stage`, `paymentStatus`, `dateFrom`,`dateTo`, `q`.
    - Returns up to 100 orders with `payment` included.
  - DB writes: None.
  - External: None.
  - Risk: **Implemented**, but no pagination beyond `take: 100` → scalability limitation.

- `GET/POST /api/merchant/orders/[orderId]/...` (`cancel`, `note`, `shipment`, `stage`, `route` for detail)
  - Auth: Implemented (pattern: Supabase auth + merchant lookup, used consistently in these route handlers).
  - DB writes: Update `Order` state, create `Shipment`, etc.
  - External: None.
  - Risk: **Partial** – specific business rules for allowed transitions may or may not be fully enforced (not all route files inspected).

### 4.4 Orders & billing exports

- `GET /api/orders/[orderId]/invoice.pdf`
  - Auth: `requireMerchant()` ensures tenant-scoped access.
  - DB reads: `Order` with related data and store settings.
  - Response: PDF `Response` using `Uint8Array` body.
  - Risk: Implemented; no obvious risk.

- `GET /api/billing/invoice.pdf`, `GET /api/billing/statement.csv`
  - Auth: Merchant.
  - DB reads: `PlatformInvoice`, `LedgerEntry`, `Order`.
  - Response: PDF for invoices, CSV for statements.
  - Risk: Implemented; exports are merchant-scoped.

### 4.5 Analytics APIs

All analytics endpoints:
- Use `authorizeRequest()` to get `{ user, merchant }`.
- Use `assertFeature(merchant.id, "ANALYTICS_BASIC", request.nextUrl.pathname)` for gating.
- Are marked `dynamic = "force-dynamic"` and `revalidate = 0`.

- `GET /api/analytics/conversion`
  - DB reads: `order.count`, `order.groupBy`, `order.findMany` for revenue.
  - DB writes: None.
  - External: None.
  - Risk: **Implemented**, but in-memory aggregation; large tenants may stress memory/CPU.

- `GET /api/analytics/sales-by-date`
  - DB reads: `order.findMany` over `[from,to]` for paid orders.
  - Logic: Groups in-memory by day/week/month.
  - Risk: **Partial** – similar in-memory aggregation risk.

- `GET /api/analytics/sales-by-product`
  - DB reads: `order.findMany` to get IDs, then `orderItem.findMany`, then `product.findMany`.
  - Logic: Aggregates via `Map` and returns top N.
  - Risk: **Partial** – in-memory heavy; no DB-level aggregation.

- `GET /api/analytics/top-customers`
  - DB reads: `order.findMany` for paid orders.
  - Logic: Groups by `customerEmail` in-memory, sorts, returns top N.
  - Risk: **Partial** – same scalability concerns.

### 4.6 Coupons

- `GET /api/coupons/validate`
  - Auth: None (public).
  - Logic:
    - Uses URL search params: `code`, `merchantId`, `amount`, optional `email`.
    - Validates presence and numeric `amount`.
    - Calls `validateCoupon(merchantId, code, amount, email)` and `calculateDiscount`.
    - Returns `valid: true` or `false`, with discount details.
  - DB writes: None.
  - External: None.
  - Risk: **Implemented** – public read-only; safe for coupon validation.

### 4.7 Domain management

- `POST /api/domains/add`
  - Auth: `requireMerchant()`.
  - DB writes:
    - Updates `Merchant.customDomain`, `domainStatus`, `domainVerificationToken`, `domainVerifiedAt`.
    - Creates/updates `DomainClaim` in a transaction.
  - Validation: `normalizeDomain`, `isValidDomainFormat`, prevent platform domain usage, enforce uniqueness.
  - Risk: Implemented; well-scoped.

- `POST /api/domains/verify`
  - Auth: `requireMerchant()`.
  - External: `dns.resolveTxt` on `_merceton-verify.<domain>`.
  - DB writes: `Merchant.domainStatus` updated to `FAILED` or `VERIFIED`, `domainVerifiedAt`.
  - Risk: Implemented; DNS-based domain verification; error paths return clear guidance.

- `POST /api/domains/disconnect` and `/api/domain/*`
  - Auth: `requireMerchant()`.
  - DB writes: Clears domain-related fields.
  - Risk: Implemented.

### 4.8 Storefront APIs

- `/api/storefront/config`, `/page`, `/settings`, `/publish`, `/save-builder`, `/save-code`, `/save-theme`
  - Auth: `requireMerchant()`.
  - DB writes/reads: Manage `StorefrontSettings` and `StorefrontPage` layouts.
  - Risk: Implemented; tenant-scoped.

### 4.9 Uploads

- `POST /api/uploads/image`
  - Auth: `authorizeRequest()` (merchant).
  - External: Cloudinary `v2.uploader.upload`.
  - Validation: `VALIDATION_RULES` by `kind` (max size, allowed MIME types).
  - Risk: Implemented; good validations. Some logging remains, but acceptable.

- `POST /api/uploads/document`
  - Auth: `requireMerchant()`.
  - Likely used for bank proofs/kyc; implements multipart-file handling (details in file).
  - Risk: **Partial** – need to review size/type limits; structure is present.

### 4.10 Cron / jobs

- `GET /api/cron/commission-summary`
  - Auth: Header `X-CRON-SECRET` vs `CRON_SECRET`.
  - Reads: `Merchant` and first admin `User`.
  - Writes: None (email only).
  - External: Sends `sendCommissionSummaryEmail`.
  - Status: **Partial** – placeholders for actual commission aggregation.

- `GET /api/cron/refund-threshold`
  - Auth: `X-CRON-SECRET`.
  - Reads: `Refund` where `createdAt` >= period; `status = COMPLETED`.
  - Writes: None; sends `sendOpsRefundThresholdAlert` if threshold exceeded.
  - Risk: Implemented; safe for alerts.

- `GET /api/jobs/generate-platform-invoices`
  - Auth: `X-CRON-SECRET`.
  - Reads/writes:
    - Finds/creates `PlatformSettlementCycle` for period.
    - Reads `PlatformBillingProfile` and active `Merchant`s.
    - Uses `computePlatformFeesForPeriod` to compute per-merchant totals.
    - Creates `PlatformInvoice` and one `PlatformInvoiceLineItem` per merchant.
    - Updates cycle to `INVOICED`.
  - Risk: **Partial**
    - Per-merchant error handling logs but continues; idempotency by `(periodStart,periodEnd)` + `status`.

- `GET /api/jobs/execute-weekly-payouts`
  - Auth: `X-CRON-SECRET`.
  - Reads/writes:
    - Finds most recent `PlatformSettlementCycle` with `status = INVOICED`.
    - For each invoice:
      - Sums `Order.netPayable` for paid orders in period.
      - Computes payout amount by subtracting invoice total.
      - Ensures payout not duplicate; creates `PayoutBatch`.
      - Marks `PlatformInvoice` as `PAID`.
      - Sends `sendPayoutProcessedEmail` to merchant user (if email found).
    - Updates cycle `status = PAID`.
  - Risk: **Partial**
    - No ledger-level payout entries (`PAYOUT_PROCESSED`) created yet.

### 4.11 Admin APIs

APIs under `/api/admin/**` manage:
- Merchants, admin users, roles, system settings, billing profile, pricing packages, audit logs, merchant ledgers.

Common traits:
- Auth: `requireAdmin()` or `requirePlatformAdmin()` from `lib/admin-auth.ts`; return `401/403` on failure.
- Writes:
  - Update `PricingPackage`, `MerchantFeeConfig`, `PlatformSettings`, `AdminAuditLog`, `Merchant` status properties, and admin user records.
- Risk: **Implement

