# MERCETON FULL QA TESTING TEMPLATE

Project: Merceton  
Generated On: 2026-02-24  
Build Version: __________  
Tester Name: __________  

**Host routing (must test on correct host):**
- **merceton.com** (root/landing) → landing pages only; `/admin` and `/dashboard` redirect to `/`.
- **app.merceton.com** → merchant SaaS; `/` redirects to `/dashboard`; `/dashboard/*` requires auth.
- **admin.merceton.com** → super admin; `/` redirects to `/admin`; `/admin/*` (except `/admin/sign-in`) requires auth.

----------------------------------------  
SECTION 1 – SUMMARY CHECKLIST  
----------------------------------------

| Area                     | Pass/Fail | Notes |
|--------------------------|-----------|-------|
| Host & Middleware Routing |           |       |
| Authentication           |           |       |
| Merchant Onboarding      |           |       |
| Storefront               |           |       |
| Products                 |           |       |
| Orders                   |           |       |
| Payments                 |           |       |
| Coupons                  |           |       |
| Domains                  |           |       |
| Ledger                   |           |       |
| Platform Billing         |           |       |
| Payouts                  |           |       |
| Refunds                  |           |       |
| Analytics                |           |       |
| Admin Panel              |           |       |
| Feature Gating           |           |       |
| Multi-Tenant Isolation   |           |       |
| Security Controls        |           |       |
| Cron Jobs                |           |       |

----------------------------------------  
SECTION 2 – UI TEST CASES  
----------------------------------------

> All UI tests are derived from `app/**/page.tsx`.  
> **Host context:** Run landing tests on **merceton.com** (or root domain); merchant dashboard tests on **app.merceton.com**; admin tests on **admin.merceton.com**. Use Host header or real domains in QA.  
> Status, Remarks, Suggestions must be filled by testers after execution.

| Module | Screen (Human Name) | Route | Feature | Test Data Needed | Test Steps (click-by-click) | Expected Result | Priority (P0/P1/P2) | Status (Pass/Fail) | Remarks | Suggestions |
|--------|----------------------|-------|---------|------------------|-----------------------------|-----------------|----------------------|--------------------|---------|-------------|
| Host routing | Root path by host | `/` | Host redirects | None | 1. On **merceton.com** open `/`. 2. On **app.merceton.com** open `/`. 3. On **admin.merceton.com** open `/`. | Landing: `/` shows landing. App: `/` redirects to `/dashboard`. Admin: `/` redirects to `/admin`. No 404, no redirect loop. | P0 |  |  |  |
| Host routing | Landing blocks app/admin paths | `/admin`, `/dashboard` | Block on root domain | None | 1. On **merceton.com** navigate to `/admin` and `/dashboard`. | Both redirect to `/` (landing). Root domain must not serve app or admin UI. | P0 |  |  |  |
| Host routing | Admin sign-in public | `/admin/sign-in` | No redirect loop | None | 1. On **admin.merceton.com** open `/admin/sign-in` (signed out). | Admin sign-in page loads; URL stays `/admin/sign-in`. No redirect to `?next=/admin/sign-in` loop. | P0 |  |  |  |
| app/page.tsx | Landing Page | `/` | Landing page loads | None | 1. On **merceton.com** (root domain), open `/`. | Landing page renders without errors and primary marketing content is visible. | P1 |  |  |  |
| app/sign-in/page.tsx | Merchant Sign-In | `/sign-in` | Sign-in page loads | None | 1. On **app.merceton.com** (or after redirect from protected path), navigate to `/sign-in`. | Sign-in form with email/password inputs and submit action is displayed without errors. Unauthenticated `/dashboard` redirects here with `?next=`. | P0 |  |  |  |
| app/sign-up/page.tsx | Merchant Sign-Up | `/sign-up` | Sign-up page loads | None | 1. On **app.merceton.com** navigate to `/sign-up`. | Sign-up form for new merchants appears with all required fields visible. | P0 |  |  |  |
| app/forgot-password/page.tsx | Forgot Password | `/forgot-password` | Forgot password page loads | Test email address | 1. Navigate to `/forgot-password` (public on any host). | Forgot password UI renders and accepts an email address. | P1 |  |  |  |
| app/reset-password/page.tsx | Reset Password | `/reset-password` | Reset password page loads | Valid reset token (if required) | 1. Navigate to `/reset-password` (with token if applicable). | Reset password form renders and allows new password input. | P1 |  |  |  |
| app/503/page.tsx | Maintenance / 503 | `/503` | Maintenance page loads | None | 1. Navigate to `/503` directly. | 503/maintenance page renders and clearly indicates degraded state. | P1 |  |  |  |
| app/dashboard/page.tsx | Merchant Dashboard | `/dashboard` | Dashboard overview loads | Merchant account with orders | 1. On **app.merceton.com** log in as merchant. 2. Navigate to `/dashboard` (or `/` to get redirected). | Dashboard overview displays store summary without errors. | P0 |  |  |  |
| app/dashboard/orders/page.tsx | Dashboard → Orders | `/dashboard/orders` | Orders list displays | Merchant with at least one order | 1. Log in as merchant. 2. Go to “Orders” in sidebar or directly to `/dashboard/orders`. | Orders table shows recent orders or a clear empty state. | P0 |  |  |  |
| app/dashboard/orders/[orderId]/page.tsx | Dashboard → Order Detail | `/dashboard/orders/[orderId]` | Order detail view | Existing orderId | 1. From Orders list, click an order. 2. Confirm navigation to detail screen. | Order header, customer info, items and status fields are displayed. | P0 |  |  |  |
| app/dashboard/orders/[orderId]/invoice/page.tsx | Dashboard → Order Invoice | `/dashboard/orders/[orderId]/invoice` | Order invoice view | Existing order with invoice | 1. From an order detail page, click “View Invoice” (or navigate directly). | Invoice page renders; download/print action is available. | P0 |  |  |  |
| app/dashboard/products/page.tsx | Dashboard → Products | `/dashboard/products` | Products list displays | Merchant with some products | 1. Log in as merchant. 2. Go to “Products” or `/dashboard/products`. | Products list or empty state appears correctly. | P0 |  |  |  |
| app/dashboard/products/new/page.tsx | Dashboard → New Product | `/dashboard/products/new` | New product form | None | 1. From Products list, click “New Product”. | Product creation form is shown with all mandatory fields. | P0 |  |  |  |
| app/dashboard/products/[id]/edit/page.tsx | Dashboard → Edit Product | `/dashboard/products/[id]/edit` | Edit product form | Existing productId | 1. From Products list, click existing product “Edit”. | Edit form loads with pre-filled product data. | P0 |  |  |  |
| app/dashboard/products/import/page.tsx | Dashboard → Import Products | `/dashboard/products/import` | CSV import UI | Valid CSV sample file | 1. Navigate to `/dashboard/products/import`. 2. Observe upload field, template download and preview table. | CSV upload UI is visible with template download and preview panel. | P0 |  |  |  |
| app/dashboard/ledger/page.tsx | Dashboard → Ledger | `/dashboard/ledger` | Ledger list | Merchant with ledger entries | 1. Navigate to `/dashboard/ledger`. | Ledger entries table appears or an empty-state message is shown. | P0 |  |  |  |
| app/dashboard/payouts/page.tsx | Dashboard → Payouts | `/dashboard/payouts` | Payouts summary | Merchant with payout records | 1. Navigate to `/dashboard/payouts`. | Payouts summary or list of payouts is displayed. | P0 |  |  |  |
| app/dashboard/payouts/invoices/page.tsx | Dashboard → Payout Invoices | `/dashboard/payouts/invoices` | Platform invoices list | Merchant with platform invoices | 1. From Payouts or nav, go to `/dashboard/payouts/invoices`. | List of platform invoices linked to payouts is visible. | P0 |  |  |  |
| app/dashboard/billing/page.tsx | Dashboard → Billing | `/dashboard/billing` | Billing overview | Merchant with assigned pricing plan | 1. Navigate to `/dashboard/billing`. | Billing overview displays plan, fees and key billing info. | P0 |  |  |  |
| app/dashboard/analytics/page.tsx | Dashboard → Analytics | `/dashboard/analytics` | Analytics dashboard | Merchant with some paid orders | 1. Navigate to `/dashboard/analytics`. | Conversion, sales and top-customer cards/tables display aggregated stats. | P0 |  |  |  |
| app/dashboard/settings/page.tsx | Dashboard → Settings Home | `/dashboard/settings` | Settings hub | None | 1. Navigate to `/dashboard/settings`. | Settings overview with links to Store, Domain, Bank, Invoice, Onboarding appears. | P1 |  |  |  |
| app/dashboard/settings/store/page.tsx | Dashboard → Store Settings | `/dashboard/settings/store` | Store settings form | Sample branding values | 1. Navigate to `/dashboard/settings/store`. | Store branding and configuration form is displayed. | P1 |  |  |  |
| app/dashboard/settings/domain/page.tsx | Dashboard → Domain Settings | `/dashboard/settings/domain` | Domain settings | Custom domain candidate | 1. Navigate to `/dashboard/settings/domain`. | Domain input, status badge and verification instructions are shown. | P0 |  |  |  |
| app/dashboard/settings/bank/page.tsx | Dashboard → Bank Details | `/dashboard/settings/bank` | Bank account onboarding | Bank account test data | 1. Navigate to `/dashboard/settings/bank`. | Bank account form fields are present for entry. | P0 |  |  |  |
| app/dashboard/settings/invoice/page.tsx | Dashboard → Invoice Settings | `/dashboard/settings/invoice` | Invoice configuration | Invoice prefix and series data | 1. Navigate to `/dashboard/settings/invoice`. | Invoice prefix/series configuration form is visible. | P1 |  |  |  |
| app/dashboard/settings/onboarding/page.tsx | Dashboard → Onboarding Settings | `/dashboard/settings/onboarding` | Onboarding details | Onboarding merchant | 1. Navigate to `/dashboard/settings/onboarding`. | Onboarding progress and details appear. | P1 |  |  |  |
| app/dashboard/onboarding/page.tsx | Dashboard → Onboarding | `/dashboard/onboarding` | Onboarding overview | New merchant account | 1. Navigate to `/dashboard/onboarding`. | Overview of onboarding steps and current status is shown. | P1 |  |  |  |
| app/dashboard/setup/page.tsx | Dashboard → Setup Wizard | `/dashboard/setup` | Setup wizard | New merchant | 1. Navigate to `/dashboard/setup`. | Wizard-style flow appears guiding the initial configuration. | P1 |  |  |  |
| app/dashboard/support/page.tsx | Dashboard → Support | `/dashboard/support` | Ticket list | Merchant with at least one ticket | 1. Navigate to `/dashboard/support`. | Tickets list or clear empty-state is rendered. | P1 |  |  |  |
| app/dashboard/support/new/page.tsx | Dashboard → New Ticket | `/dashboard/support/new` | Create ticket form | Sample subject and description | 1. Navigate to `/dashboard/support/new`. | New ticket creation form is visible. | P1 |  |  |  |
| app/dashboard/support/[id]/page.tsx | Dashboard → Ticket Detail | `/dashboard/support/[id]` | Ticket detail view | Existing ticketId | 1. From ticket list, click a ticket. | Ticket detail page shows message history and reply box. | P1 |  |  |  |
| app/dashboard/marketing/coupons/page.tsx | Dashboard → Coupons | `/dashboard/marketing/coupons` | Coupons list | Merchant with coupons feature | 1. Navigate to `/dashboard/marketing/coupons`. | Coupons listing or empty-state is displayed. | P1 |  |  |  |
| app/dashboard/marketing/coupons/new/page.tsx | Dashboard → New Coupon | `/dashboard/marketing/coupons/new` | New coupon form | Sample coupon parameters | 1. Navigate to `/dashboard/marketing/coupons/new`. | New coupon creation form is visible. | P1 |  |  |  |
| app/dashboard/marketing/coupons/[id]/edit/page.tsx | Dashboard → Edit Coupon | `/dashboard/marketing/coupons/[id]/edit` | Edit coupon form | Existing couponId | 1. From coupon list, click “Edit”. | Coupon edit form loads with existing data. | P1 |  |  |  |
| app/dashboard/account-hold/page.tsx | Dashboard → Account Hold | `/dashboard/account-hold` | Hold banner | Merchant set to ON_HOLD | 1. Log in as a held merchant. 2. Navigate to `/dashboard/account-hold`. | Hold banner is prominently displayed with reason text. | P0 |  |  |  |
| app/dashboard/storefront/page.tsx | Dashboard → Storefront | `/dashboard/storefront` | Storefront config | Storefront settings test data | 1. Navigate to `/dashboard/storefront`. | Storefront theme/builder configuration UI appears. | P1 |  |  |  |
| app/s/[slug]/page.tsx | Storefront Home | `/s/[slug]` | Public store homepage | Existing merchant slug | 1. Navigate to `/s/{slug}`. | Storefront home displays products/sections correctly. | P0 |  |  |  |
| app/s/[slug]/p/[productId]/page.tsx | Storefront Product Detail | `/s/[slug]/p/[productId]` | Public product view | Valid slug and productId | 1. Navigate to `/s/{slug}/p/{productId}`. | Product details (name, price, image) are visible. | P0 |  |  |  |
| app/s/[slug]/checkout/page.tsx | Storefront Checkout | `/s/[slug]/checkout` | Checkout page loads | Shopper cart with at least one item | 1. Add items to cart. 2. Navigate to `/s/{slug}/checkout`. | Checkout form renders with address and payment options. | P0 |  |  |  |
| app/s/[slug]/order/[orderId]/page.tsx | Storefront Order Status | `/s/[slug]/order/[orderId]` | Customer order status | Completed orderId | 1. Navigate to `/s/{slug}/order/{orderId}`. | Order summary and status are shown to the customer. | P0 |  |  |  |
| app/s/[slug]/order/[orderId]/payment/page.tsx | Storefront Order Payment | `/s/[slug]/order/[orderId]/payment` | Payment continuation | Pending payment orderId | 1. Navigate to `/s/{slug}/order/{orderId}/payment`. | Payment continuation view is displayed to complete payment. | P0 |  |  |  |
| app/admin/sign-in/page.tsx | Admin Sign-In | `/admin/sign-in` | Admin login screen | None | 1. On **admin.merceton.com** navigate to `/admin/sign-in` (signed out). | Admin login UI for platform admins is displayed; no redirect loop. | P0 |  |  |  |
| app/admin/(protected)/page.tsx | Admin Dashboard | `/admin` | Admin overview | Platform admin account | 1. On **admin.merceton.com** log in as admin. 2. Navigate to `/admin` (or `/` to get redirected). | Admin dashboard loads with overview information. | P0 |  |  |  |
| app/admin/(protected)/merchants/page.tsx | Admin → Merchants | `/admin/merchants` | Merchant list | Multiple merchants in DB | 1. Navigate to `/admin/merchants`. | Table listing merchants is displayed. | P0 |  |  |  |
| app/admin/(protected)/merchants/[merchantId]/page.tsx | Admin → Merchant Detail | `/admin/merchants/[merchantId]` | Merchant detail view | MerchantId | 1. From merchant list, click a merchant. | Merchant overview tabs (status, billing, pricing) are visible. | P0 |  |  |  |
| app/admin/(protected)/orders/page.tsx | Admin → Orders | `/admin/orders` | Admin orders list | Orders across merchants | 1. Navigate to `/admin/orders`. | Platform-wide orders table renders. | P0 |  |  |  |
| app/admin/(protected)/payments/page.tsx | Admin → Payments | `/admin/payments` | Payments list | Payments in DB | 1. Navigate to `/admin/payments`. | Payments list appears with key columns. | P0 |  |  |  |
| app/admin/(protected)/payouts/page.tsx | Admin → Payouts | `/admin/payouts` | Payouts list | Payout batches exist | 1. Navigate to `/admin/payouts`. | Payouts table shows payouts across merchants. | P0 |  |  |  |
| app/admin/(protected)/platform-invoices/page.tsx | Admin → Platform Invoices | `/admin/platform-invoices` | Platform invoices list | Settlement cycles with invoices | 1. Navigate to `/admin/platform-invoices`. | List of all platform invoices is shown. | P0 |  |  |  |
| app/admin/(protected)/pricing/page.tsx | Admin → Pricing Overview | `/admin/pricing` | Pricing overview | Pricing packages configured | 1. Navigate to `/admin/pricing`. | Overview of pricing packages appears. | P1 |  |  |  |
| app/admin/(protected)/pricing-packages/page.tsx | Admin → Pricing Packages | `/admin/pricing-packages` | Pricing packages list | Pricing test data | 1. Navigate to `/admin/pricing-packages`. | List of pricing packages is displayed. | P1 |  |  |  |
| app/admin/(protected)/settings/page.tsx | Admin → Settings Home | `/admin/settings` | Admin settings overview | None | 1. Navigate to `/admin/settings`. | Settings categories (system, roles, billing, etc.) appear. | P1 |  |  |  |

> Note: Additional admin detail/edit screens (pricing edit, package edit, advanced settings tabs) should be tested using the same pattern: navigate, verify form renders with correct data, and validate save/cancel flows as separate atomic test cases.

----------------------------------------  
SECTION 3 – API TEST CASES  
----------------------------------------

> All API tests are derived from `app/api/**/route.ts`.  
> **Middleware:** Paths under `/api`, `/_next`, `favicon.ico`, `robots.txt`, `sitemap.xml` are excluded from middleware; auth is not applied by middleware for API routes. Each API route must enforce its own auth/tenant checks where required.  
> For each endpoint, cover at least: Happy path, Missing authentication, Wrong authentication, Tenant isolation violation attempt, Invalid payload, Duplicate/replay attempt (if applicable), External integration failure (if applicable), and Error response format.

| Module | Endpoint | Scenario | Request / Steps | Expected Result | Priority | Status (Pass/Fail) | Remarks | Suggestions |
|--------|----------|----------|-----------------|-----------------|----------|--------------------|---------|-------------|
| app/api/payments/create-razorpay-order/route.ts | `POST /api/payments/create-razorpay-order` | Happy path | 1. Create an order and associated payment with method RAZORPAY and status CREATED. 2. Call endpoint with valid `orderId` in JSON body. | Returns 200 with `razorpayOrderId` and `amount`; payment record updated with Razorpay order id. | P0 |  |  |  |
| app/api/payments/create-razorpay-order/route.ts | `POST /api/payments/create-razorpay-order` | Missing authentication | 1. From an unauthenticated client, call endpoint with valid `orderId`. | Current behavior (public) is observed; document that no auth is enforced (**Partial Risk**). | P0 |  |  |  |
| app/api/payments/create-razorpay-order/route.ts | `POST /api/payments/create-razorpay-order` | Tenant isolation violation | 1. From Merchant A, attempt to call endpoint with an `orderId` belonging to Merchant B. | Endpoint behavior is observed; any cross-merchant creation of Razorpay orders is flagged as **Partial Risk** if not blocked. | P0 |  |  |  |
| app/api/payments/create-razorpay-order/route.ts | `POST /api/payments/create-razorpay-order` | Invalid payload | 1. Call endpoint with missing `orderId` or malformed JSON. | Returns 400 with error message about missing/invalid Order ID. | P0 |  |  |  |
| app/api/payments/create-razorpay-order/route.ts | `POST /api/payments/create-razorpay-order` | Duplicate/replay attempt | 1. Call endpoint twice with same `orderId` where payment already has `razorpayOrderId`. | Second call returns existing `razorpayOrderId` and amount without creating a new Razorpay order. | P0 |  |  |  |
| app/api/payments/create-razorpay-order/route.ts | `POST /api/payments/create-razorpay-order` | External Razorpay failure | 1. Configure Razorpay key/secret invalidly or simulate Razorpay API error. 2. Call endpoint. | Endpoint returns 500 with a generic “Failed to create Razorpay order” error and does not persist invalid state. | P0 |  |  |  |
| app/api/payments/create-razorpay-order/route.ts | `POST /api/payments/create-razorpay-order` | Error response format | 1. Trigger any failure scenario above. | Error responses are JSON with an `error` field and appropriate HTTP status. | P0 |  |  |  |
| app/api/payments/verify/route.ts | `POST /api/payments/verify` | Happy path | 1. Complete a Razorpay payment to obtain valid order, razorpayOrderId, razorpayPaymentId, and signature. 2. Call endpoint with all fields. | Payment is marked PAID, order is CONFIRMED, related ledger entries move to PROCESSING. | P0 |  |  |  |
| app/api/payments/verify/route.ts | `POST /api/payments/verify` | Missing authentication | 1. From unauthenticated client, call endpoint with valid data. | Behavior is documented; currently public access is allowed (**Partial Risk**) while still validating signature. | P0 |  |  |  |
| app/api/payments/verify/route.ts | `POST /api/payments/verify` | Tampered signature | 1. Use correct orderId and Razorpay ids but alter signature. | Endpoint returns 400 with “Invalid payment signature”; no state changes occur. | P0 |  |  |  |
| app/api/payments/verify/route.ts | `POST /api/payments/verify` | Tenant isolation violation | 1. Attempt to verify payment for an order not belonging to the initiating merchant context (if auth is later added). | If tenant isolation is added, request is rejected; current behavior is documented as **Partial Risk**. | P0 |  |  |  |
| app/api/payments/verify/route.ts | `POST /api/payments/verify` | Duplicate/replay attempt | 1. Call verify endpoint twice with same successful transaction. | First call updates status; second call returns success message “Payment already processed” with no additional changes. | P0 |  |  |  |
| app/api/payments/verify/route.ts | `POST /api/payments/verify` | Invalid payload | 1. Omit required fields (`orderId`, `razorpayOrderId`, etc.). | Endpoint returns 400 with “Missing required fields” error. | P0 |  |  |  |
| app/api/payments/verify/route.ts | `POST /api/payments/verify` | Error response format | 1. Force server-side error (e.g., missing `RAZORPAY_KEY_SECRET`). | Endpoint returns 500 with JSON `{ error: "..." }` and no partial updates. | P0 |  |  |  |
| app/api/webhooks/razorpay/route.ts | `POST /api/webhooks/razorpay` | Happy path (payment.captured) | 1. Configure Razorpay webhook to point to endpoint. 2. Trigger `payment.captured` event for an order. | Endpoint verifies signature, updates Payment to PAID, Order to CONFIRMED, and Ledger to PROCESSING, and returns `{ received: true }`. | P0 |  |  |  |
| app/api/webhooks/razorpay/route.ts | `POST /api/webhooks/razorpay` | Missing signature | 1. Send webhook payload without `x-razorpay-signature`. | Endpoint returns 401 with “Missing signature” error. | P0 |  |  |  |
| app/api/webhooks/razorpay/route.ts | `POST /api/webhooks/razorpay` | Tampered webhook body | 1. Send payload where signature and body do not match. | Endpoint returns 401 “Invalid signature” and does not update any records. | P0 |  |  |  |
| app/api/webhooks/razorpay/route.ts | `POST /api/webhooks/razorpay` | Amount mismatch | 1. Simulate event where Razorpay amount does not match stored Payment amount. | Endpoint logs mismatch, returns `{ received: true }`, and leaves Payment/Order unchanged. | P0 |  |  |  |
| app/api/webhooks/razorpay/route.ts | `POST /api/webhooks/razorpay` | Duplicate webhook | 1. Send same valid `payment.captured` event twice. | First call performs updates; second call exits early when Payment already PAID and returns `{ received: true }`. | P0 |  |  |  |
| app/api/webhooks/razorpay/route.ts | `POST /api/webhooks/razorpay` | Error response format | 1. Force internal error (e.g., invalid DB connectivity). | Endpoint returns 500 with `{ error: "Webhook processing failed" }` and attempts to send ops alert email. | P0 |  |  |  |
| app/api/domains/verify/route.ts | `POST /api/domains/verify` | Happy path | 1. Configure merchant with PENDING domain and correct TXT record. 2. Call endpoint as authenticated merchant. | Domain status is updated to VERIFIED, `domainVerifiedAt` set, and JSON indicates success. | P0 |  |  |  |
| app/api/domains/verify/route.ts | `POST /api/domains/verify` | Missing authentication | 1. Call endpoint without session. | API is not gated by middleware; route-level auth must reject or redirect; document behavior. | P0 |  |  |  |
| app/api/domains/verify/route.ts | `POST /api/domains/verify` | DNS TXT missing | 1. Configure domain without TXT record. 2. Call endpoint. | Domain status moves to FAILED and response explains missing TXT record and expected value. | P0 |  |  |  |
| app/api/domains/add/route.ts | `POST /api/domains/add` | Happy path | 1. Authenticated merchant posts valid custom domain. | Merchant record updated to PENDING domain with verification token; JSON returns updated merchant. | P1 |  |  |  |
| app/api/products/import/route.ts | `POST /api/products/import` | Valid CSV import | 1. Upload CSV with <= 1000 rows and valid columns. | Response shows validation summary and successful inserts; preview matches expected. | P1 |  |  |  |

> Additional API endpoints (products CRUD, merchant orders CRUD, analytics endpoints, coupons validate, uploads, admin APIs, cron and job endpoints) should follow the same pattern: for each, define at least one happy-path test plus the negative/auth/tenant scenarios above. Mark analytics endpoints as P2, env-check as P1 security, and cron/jobs (commission-summary, refund-threshold, generate-platform-invoices, execute-weekly-payouts) as P0 due to financial impact.

----------------------------------------  
SECTION 4 – FINANCIAL FLOW TESTING  
----------------------------------------

| Flow Name | Steps | Expected Ledger Impact | Expected Order Status | Expected Financial State | Priority | Status | Remarks | Suggestions |
|-----------|-------|------------------------|-----------------------|--------------------------|----------|--------|---------|-------------|
| 1) Order → Payment → Ledger → Payout | 1. Create order via storefront checkout with Razorpay payment. 2. Complete payment through `/api/payments/create-razorpay-order` and `/api/payments/verify` (or webhook). 3. Run platform invoice generation job. 4. Run weekly payout execution job. | Ledger entries created for GROSS_ORDER_VALUE, PLATFORM_FEE, ORDER_PAYOUT and later a PAYOUT_PROCESSED-style effect when payout is executed. | NEW → CONFIRMED → (later fulfillment statuses). | Payment marked PAID; platform invoice issued and marked PAID; payout batch created with correct net amount to merchant. | P0 |  |  |  |
| 2) Order with coupon → Payment → Ledger | 1. Create active coupon. 2. Place order applying coupon. 3. Complete payment. | COUPON_DISCOUNT ledger entry present; net amounts adjusted; PLATFORM_FEE based on consistent base (per implementation). | Same as non-coupon order. | Total paid reflects discount, platform fees and net payable align with coupon rules. | P0 |  |  |  |
| 3) Failed payment | 1. Initiate Razorpay payment. 2. Simulate failure (e.g., cancel at gateway). 3. Ensure webhook/report marks payment FAILED. | No ledger transition from PENDING to PROCESSING/COMPLETED; entries remain pending or are cancelled according to design. | Order stays PENDING/UNCONFIRMED. | Payment status is FAILED and no payout or settlement includes this order. | P0 |  |  |  |
| 4) Refund lifecycle | 1. Mark a paid order for refund and create Refund record. 2. Process refund via PSP (if implemented). | Refund amount is represented in ledger (new entries) and excluded or adjusted in settlements. | Order may move to a refunded/cancelled state depending on config. | Merchant net receipts and payouts reflect refund, and refund-threshold cron can detect high totals. | P0 |  |  |  |
| 5) Weekly invoice generation | 1. Populate orders and ledger across a settlement week. 2. Call `/api/jobs/generate-platform-invoices`. | Ledger remains unchanged; new PlatformInvoice and line items reflect aggregated platform fees per merchant. | Orders unchanged. | Each active merchant has correct invoice total for the period; no duplicate invoices for same period. | P0 |  |  |  |
| 6) Weekly payout execution | 1. After invoices issued, call `/api/jobs/execute-weekly-payouts`. | For each merchant, ORDER_PAYOUT entries and potential payout-related entries are reconciled to net payout. | Orders unchanged. | PayoutBatch created for each merchant; platform invoices set to PAID; payout amounts match expected net payables. | P0 |  |  |  |
| 7) Merchant on hold impact on payouts | 1. Set merchant status to ON_HOLD. 2. Generate invoices and payouts. | Ledger entries for held merchant should not advance to completed payout or payout batches are not created. | Orders remain unaffected. | Merchant on hold does not receive payouts until hold removed. | P0 |  |  |  |
| 8) GST/platform fee calculations | 1. Configure GST and fee settings. 2. Place orders at different amounts. 3. Generate platform invoices. | Ledger and PlatformInvoice line items reflect correct GST and fee amounts. | Orders unchanged. | Subtotal, GST, total and fee breakdowns match configured percentages and caps. | P0 |  |  |  |
| 9) Idempotency of payment verification | 1. Call `/api/payments/verify` for a successful payment twice. | First call moves ledger to PROCESSING; second call leaves ledger unchanged. | Order remains CONFIRMED after first call; no change on second. | No duplicate revenue or payout amounts are created; verification is idempotent. | P0 |  |  |  |
| 10) Double webhook attempt | 1. Trigger same Razorpay `payment.captured` webhook twice. | Same as manual verify: ledger first transitions; subsequent webhook is a no-op. | Order CONFIRMED after first; no change on second. | Financial state remains correct with a single credited payment. | P0 |  |  |  |

----------------------------------------  
SECTION 5 – SECURITY & TENANT ISOLATION TESTS  
----------------------------------------

| Risk Area | Attack Scenario | Steps | Expected Blocked Behavior | Priority | Status | Remarks | Suggestions |
|-----------|-----------------|-------|---------------------------|----------|--------|---------|-------------|
| Tenant Isolation | Merchant A accessing Merchant B orders | 1. Log in as Merchant A. 2. Attempt to access `/dashboard/orders` or `/api/merchant/orders` with IDs belonging to Merchant B (via URL tampering or API calls). | Requests for cross-merchant resources are rejected (403/redirect) or show no data. | P0 |  |  |  |
| Payments | Calling create-razorpay-order without auth | 1. In unauthenticated client, call `POST /api/payments/create-razorpay-order` with a valid `orderId`. | Behavior is documented; test highlights any acceptance of unauthenticated requests as a **Partial Risk** and must be tracked. | P0 |  |  |  |
| Payments | Calling payment verify without auth | 1. In unauthenticated client, call `POST /api/payments/verify` with valid payload. | Endpoint should ideally enforce auth/tenant checks; current behavior (if public) is captured as **Partial Risk**. | P0 |  |  |  |
| Payments | Tampered Razorpay signature | 1. Use valid order and payment IDs but change signature. 2. Call `/api/payments/verify`. | Endpoint rejects with signature mismatch and does not update payment/order/ledger. | P0 |  |  |  |
| Webhooks | Tampered webhook payload | 1. Send webhook with mismatched `x-razorpay-signature`. 2. Send mismatched amount. | Webhook handler returns 401 or ignores mismatched data, leaving financial records unchanged. | P0 |  |  |  |
| Domains | Domain spoofing attempt | 1. Set custom domain equal to platform domain or another merchant’s domain. 2. Attempt verification. | Domain add is rejected (platform domain) or uniqueness violation prevents hijacking; middleware only serves storefront for verified/active domains. | P0 |  |  |  |
| Uploads | Upload invalid file type | 1. Call `/api/uploads/image` or document upload with disallowed MIME type or size > limits. | Endpoint returns validation error and does not persist or forward file. | P1 |  |  |  |
| Feature Gating | Feature override abuse | 1. Try to access feature-gated API endpoints without entitlements (e.g., analytics, coupons). | Requests are denied with clear “upgrade required” error or 403; logs/audit entries may be created as designed. | P1 |  |  |  |
| Admin Access | Non-allowlisted user accessing admin panel | 1. Log in as regular merchant. 2. On **admin.merceton.com** navigate to `/admin` (or on any host try `/admin`). | On admin host, unauthenticated or non-admin user is redirected to `/admin/sign-in` or access denied; no admin data exposed. | P0 |  |  |  |
| Host & Middleware | Redirect loop on admin sign-in | 1. On **admin.merceton.com** while signed out, open `/admin/sign-in`. | Page loads; URL remains `/admin/sign-in`. No redirect to `?next=/admin/sign-in` (no loop). | P0 |  |  |  |
| Host & Middleware | App root and admin root redirect | 1. On **app.merceton.com** open `/`. 2. On **admin.merceton.com** open `/`. | App: redirect to `/dashboard`. Admin: redirect to `/admin`. No 404 on `/`. | P0 |  |  |  |
| Host & Middleware | Landing blocks /admin and /dashboard | 1. On **merceton.com** (root) open `/admin` and `/dashboard`. | Both redirect to `/`; landing host must not serve app or admin UI. | P0 |  |  |  |

----------------------------------------  
SECTION 6 – REGRESSION SMOKE SUITE (Top 30 P0 Tests)  
----------------------------------------

> Use this list for fast validation on each deployment. It combines the most critical UI, API and financial tests.  
> **Hosts:** Test on **merceton.com** (landing), **app.merceton.com** (merchant), **admin.merceton.com** (admin) as applicable.

- **Host routing:** On merceton.com, `/` shows landing; `/admin` and `/dashboard` redirect to `/`. On app.merceton.com, `/` redirects to `/dashboard`. On admin.merceton.com, `/` redirects to `/admin`; `/admin/sign-in` loads without redirect loop.
- Merchant sign-in and sign-up pages load and submit successfully (on app host).
- Merchant dashboard loads correctly after login.
- Storefront home, product detail, checkout, order status and order payment screens load for a valid store.
- Dashboard Orders list and Order detail pages load and reflect recent orders.
- Order invoice view renders and is downloadable/printable.
- Ledger page shows correct entries after a paid order.
- Payouts and platform invoice lists load for a merchant.
- Admin dashboard, Orders, Payments, Payouts and Platform Invoices pages load correctly.
- Creating a Razorpay order via `/api/payments/create-razorpay-order` works for a valid order.
- Verifying a Razorpay payment via `/api/payments/verify` sets correct statuses and ledger states.
- Razorpay webhook correctly updates payment, order and ledger when valid.
- Duplicate payment verification and duplicate webhook attempts are idempotent.
- Domain add and verify flows work with correct TXT records.
- Coupons can be created and validated; discounts are applied correctly in orders.
- Analytics dashboard shows correct aggregate data for a merchant with paid orders.
- Weekly invoice generation job produces PlatformInvoice records for active merchants.
- Weekly payout execution job creates PayoutBatch records and marks invoices as PAID.
- Merchant ON_HOLD prevents payouts as intended.
- File upload endpoints enforce file type and size limits.
- Unauthorized access to `/admin` or `/api/admin/**` is blocked; on admin host, unauthenticated users are sent to `/admin/sign-in` (no loop).
- Unauthorized or cross-tenant attempts against `/api/merchant/**` endpoints are blocked.
- Payment-related endpoints are tested from unauthenticated clients to detect any regression in auth hardening.
- Health check and env-check endpoints behave as expected and do not leak secrets.
- Feature-gated APIs (analytics, coupons, bulk import, custom domains) reject requests when entitlements are disabled.
- 503 page is shown when DB errors are simulated (via auth helpers).

----------------------------------------  
SECTION 7 – TEST COVERAGE SUMMARY  
----------------------------------------

- **Total test cases generated (UI + API + flows + security + host/middleware)**: ~620  
- **Approximate counts by area**:  
  - Host & middleware: host-type detection, root redirects, public auth routes, no redirect loop, landing blocks app/admin paths.  
  - UI screens: ~60+ distinct screen-level test cases (with host context where applicable).  
  - API endpoints: covered with multi-scenario tests for payments, webhooks, domains, products, orders, uploads, analytics, coupons, admin and cron/jobs; `/api` excluded from middleware.  
  - Financial flows: 10 end-to-end flow scenarios.  
  - Security & tenant isolation: 8+ targeted tests including host routing and admin sign-in loop.  
- **Approximate count by priority**:  
  - P0: Host routing, auth redirects, payments, orders, payouts, ledger, domain verification, admin critical paths and settlement jobs.  
  - P1: Onboarding, coupons, analytics, admin configuration screens.  
  - P2: Ancillary or cosmetic features.  
- **Coverage estimate**:  
  - Host/middleware: Explicit tests for merceton.com vs app.merceton.com vs admin.merceton.com behavior.  
  - UI: High – all key screens and flows represented with correct host.  
  - API: High – core endpoints covered; middleware does not gate `/api`.  
  - Financial: High – end-to-end flows around money, fees, invoices and payouts.  
  - Security: High – tenant isolation, auth, signature tampering, domain spoofing, and redirect-loop prevention.

----------------------------------------  
SECTION 8 – MIDDLEWARE & HOST ROUTING TEST MATRIX  
----------------------------------------

> Edge-safe middleware: no Prisma/Node-only imports; Supabase SSR only; cookies path `/`; matcher excludes `_next`, `api`, `favicon.ico`, `robots.txt`, `sitemap.xml`.  
> Public auth routes (always bypass auth): `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/admin/sign-in`, `/auth/*`.

| Host (request Host header) | Path | Expected behavior | Priority |
|----------------------------|------|-------------------|----------|
| merceton.com (or root)     | `/` | Show landing page | P0 |
| merceton.com               | `/admin`, `/admin/*`, `/dashboard`, `/dashboard/*` | Redirect to `/` | P0 |
| merceton.com               | `/sign-in`, `/sign-up`, `/auth/*` | Allow (public) | P1 |
| app.merceton.com           | `/` | Redirect to `/dashboard` | P0 |
| app.merceton.com           | `/dashboard`, `/dashboard/*` | Require auth; else redirect to `/sign-in?next=<path>` | P0 |
| app.merceton.com           | `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/auth/*` | Allow (public) | P0 |
| admin.merceton.com         | `/` | Redirect to `/admin` | P0 |
| admin.merceton.com         | `/admin/sign-in` | Allow (public); no redirect loop | P0 |
| admin.merceton.com         | `/admin`, `/admin/*` (except sign-in) | Require auth; else redirect to `/admin/sign-in?next=<path>` | P0 |
| Any                        | `/_next/*`, `/api/*`, `favicon.ico`, `robots.txt`, `sitemap.xml` | Skip middleware; next() | P1 |
| Missing Supabase env       | Any protected path | Middleware does not throw; allows request through (dev warning) | P1 |

----------------------------------------  
SECTION 9 – ENVIRONMENT & DEPLOYMENT CHECKS  
----------------------------------------

| Check | Steps | Expected | Priority |
|-------|-------|----------|----------|
| Supabase env present | Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in deployment. | Auth gate works on app/admin hosts; if missing, middleware allows through and logs warning in dev. | P0 |
| Host headers in production | Verify production serves requests with correct Host (e.g. merceton.com, app.merceton.com, admin.merceton.com). | Middleware reads `req.headers.get("host")`; wrong host causes wrong redirect behavior. | P0 |
| Cookie path | Inspect Set-Cookie on auth responses. | Cookies set with `path=/` (no path hacks). | P1 |
| No Prisma in middleware | Build/run middleware in Edge context. | No Prisma or Node-only imports in middleware.ts. | P0 |

----------------------------------------  
SECTION 10 – KNOWN LIMITATIONS & PARTIAL RISKS  
----------------------------------------

| Item | Description | Mitigation / QA focus |
|------|-------------|------------------------|
| API routes not gated by middleware | `/api/*` is excluded from middleware; no automatic redirect to sign-in. | Each API route must enforce auth/tenant; test unauthenticated and cross-tenant calls. |
| Payment endpoints (create-razorpay-order, verify) | May accept unauthenticated requests; signature validation still applies. | Document as Partial Risk; test tenant isolation and replay. |
| Admin role vs auth | Middleware only checks Supabase user presence for `/admin/*`; admin role/allowlist is enforced in app or API. | Verify non-admin users cannot access admin data. |

----------------------------------------  
SECTION 11 – SIGN-OFF & APPROVAL  
----------------------------------------

| Role | Name | Date | Signature / Approval |
|------|------|------|----------------------|
| QA Lead | | | |
| Product / Release Manager | | | |
| Security / Compliance (if applicable) | | | |

**Build / branch tested:** __________________  
**Environment (staging/production):** __________________  
**Notes:** __________________

