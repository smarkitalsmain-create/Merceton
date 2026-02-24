# Merceton API Endpoint Catalog

Complete list of all API endpoints in `/app/api`, organized by category.

## Authentication & Authorization

### Auth Methods Used:
- **Merchant Auth**: `requireMerchant()` - ensures user has merchant account
- **Admin Auth**: `requireAdmin()` / `requireSuperAdmin()` - email allowlist based
- **Platform Admin**: `requirePlatformAdmin()` - alias for `requireAdmin()`
- **RBAC**: `requirePermission(PERMISSION)` - role-based access control
- **Cron Secret**: `X-CRON-SECRET` header matching `CRON_SECRET` env var

---

## Products API

### `GET /api/products`
- **Method**: GET
- **Auth**: Merchant (`authorizeRequest()`)
- **Request**: None
- **Response**: `{ products: Product[] }`
- **Side Effects**: None (read-only)
- **Tenant Isolation**: Scoped to `merchant.id`

### `POST /api/products`
- **Method**: POST
- **Auth**: Merchant (`authorizeRequest()`)
- **Request Body**: `{ name: string, description?: string, price: number, stock: number, images?: Array<{url: string, alt?: string}> }`
- **Response**: `{ product: Product }` (201)
- **Side Effects**: Creates product in DB, scoped to merchant
- **Tenant Isolation**: Auto-scoped to `merchant.id`

### `GET /api/products/[id]`
- **Method**: GET
- **Auth**: Merchant (`authorizeRequest()`)
- **Request**: None
- **Response**: `{ product: Product }`
- **Side Effects**: None
- **Tenant Isolation**: Validates product belongs to merchant (`ensureTenantAccess()`)

### `PUT /api/products/[id]`
- **Method**: PUT
- **Auth**: Merchant (`authorizeRequest()`)
- **Request Body**: `{ name?: string, description?: string, price?: number, stock?: number, isActive?: boolean }`
- **Response**: `{ product: Product }`
- **Side Effects**: Updates product in DB
- **Tenant Isolation**: Validates ownership before update

### `DELETE /api/products/[id]`
- **Method**: DELETE
- **Auth**: Merchant (`authorizeRequest()`)
- **Request**: None
- **Response**: `{ success: true }`
- **Side Effects**: Deletes product (cascade deletes images)
- **Tenant Isolation**: Validates ownership before delete

---

## Orders API

### `POST /api/orders/create`
- **Method**: POST
- **Auth**: Public (rate-limited: 10 req/min per IP)
- **Request Body**: Validated via `createOrderSchema` (Zod)
  - `merchantId: string`
  - `storeSlug: string`
  - `customerName: string`
  - `customerEmail: string` (required)
  - `customerPhone?: string`
  - `customerAddress: object`
  - `items: Array<{productId: string, quantity: number}>`
  - `paymentMethod: "COD" | "RAZORPAY"`
- **Response**: `{ order: Order }` (201) or `{ error: string }` (400)
- **Side Effects**:
  - Creates order, payment, order items in transaction
  - Updates product stock (decrement)
  - Creates ledger entry for platform fee
  - **Email**: Order confirmation to customer (non-blocking)
  - **Email**: New order notification to merchant (non-blocking)
  - **Email**: High-value order alert to ops (if threshold exceeded, non-blocking)

### `GET /api/orders/[orderId]/invoice.pdf`
- **Method**: GET
- **Auth**: Merchant (`requireMerchant()`)
- **Request**: None
- **Response**: PDF file (`application/pdf`) with invoice
- **Side Effects**:
  - Allocates invoice number (transaction-safe)
  - Generates PDF using PDFKit
  - Returns PDF buffer
- **Tenant Isolation**: Validates order belongs to merchant

---

## Merchant Orders API

### `GET /api/merchant/orders`
- **Method**: GET
- **Auth**: Merchant (Supabase session)
- **Query Params**: `stage?`, `paymentStatus?`, `q?`, `dateFrom?`, `dateTo?`
- **Response**: `{ orders: Order[] }`
- **Side Effects**: None
- **Tenant Isolation**: Scoped to merchant's orders

### `GET /api/merchant/orders/[orderId]`
- **Method**: GET
- **Auth**: Merchant (Supabase session)
- **Request**: None
- **Response**: `{ order: Order }` (includes items, payment, shipments, refunds, events)
- **Side Effects**: None
- **Tenant Isolation**: Validates order belongs to merchant

### `POST /api/merchant/orders/[orderId]/stage`
- **Method**: POST
- **Auth**: Merchant (Supabase session)
- **Request Body**: `{ stage: string, reason?: string }`
- **Response**: `{ order: Order }`
- **Side Effects**:
  - Updates order stage/status in transaction
  - Creates order event (STAGE_CHANGE)
  - Validates stage transitions (ALLOWED_TRANSITIONS)
  - **Email**: Shipment update to customer (if stage → SHIPPED, non-blocking)
- **Tenant Isolation**: Validates order belongs to merchant

### `POST /api/merchant/orders/[orderId]/shipment`
- **Method**: POST
- **Auth**: Merchant (Supabase session)
- **Request Body**: `{ courierName: string, awb: string, trackingUrl?: string }`
- **Response**: `{ order: Order }`
- **Side Effects**:
  - Creates/updates shipment in transaction
  - Updates order stage to SHIPPED if was PACKED
  - Creates order events
  - **Email**: Shipment update to customer (if stage transitioned to SHIPPED, non-blocking)
- **Tenant Isolation**: Validates order belongs to merchant

### `POST /api/merchant/orders/[orderId]/cancel`
- **Method**: POST
- **Auth**: Merchant (Supabase session)
- **Request Body**: `{ reason: string }`
- **Response**: `{ order: Order }`
- **Side Effects**:
  - Updates order stage/status to CANCELLED in transaction
  - Creates order event (STAGE_CHANGE)
  - Validates order not already shipped
- **Tenant Isolation**: Validates order belongs to merchant

### `POST /api/merchant/orders/[orderId]/note`
- **Method**: POST
- **Auth**: Merchant (Supabase session)
- **Request Body**: `{ message: string }`
- **Response**: `{ event: OrderEvent }`
- **Side Effects**: Creates order event (NOTE type)
- **Tenant Isolation**: Validates order belongs to merchant

---

## Payments API

### `POST /api/payments/create-razorpay-order`
- **Method**: POST
- **Auth**: None (public, but validates order exists)
- **Request Body**: `{ orderId: string }`
- **Response**: `{ razorpayOrderId: string, amount: number, currency: string }`
- **Side Effects**:
  - Creates Razorpay order via Razorpay API
  - Updates payment record with `razorpayOrderId`
- **Validation**: Ensures payment method is RAZORPAY, status is CREATED

### `POST /api/payments/verify`
- **Method**: POST
- **Auth**: None (public, but validates order exists)
- **Request Body**: `{ orderId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string }`
- **Response**: `{ success: true }`
- **Side Effects**:
  - Verifies HMAC signature
  - Updates payment status to PAID in transaction
  - Updates order status to CONFIRMED
  - Updates ledger entries status to PROCESSING
- **Security**: Prevents duplicate processing

### `POST /api/webhooks/razorpay`
- **Method**: POST
- **Auth**: Webhook signature verification (HMAC-SHA256)
- **Request Body**: Razorpay webhook event JSON
- **Response**: `{ received: true }` (200)
- **Side Effects**:
  - Handles `payment.captured`: Updates payment/order/ledger in transaction
  - Handles `payment.failed`: Updates payment status to FAILED
  - **Email**: Webhook failure alert to ops (on error, non-blocking)
- **Security**: Verifies webhook signature, validates amounts, prevents replay

---

## Storefront API

### `GET /api/storefront/config`
- **Method**: GET
- **Auth**: Merchant (`requireMerchant()`)
- **Request**: None
- **Response**: `{ config: StorefrontConfig }` (normalized)
- **Side Effects**: None (read-only)
- **Note**: Returns draft config for builder

### `PUT /api/storefront/config`
- **Method**: PUT
- **Auth**: Merchant (`requireMerchant()`)
- **Request Body**: `{ config: StorefrontConfig, isDraft: boolean }`
- **Response**: `{ success: true }`
- **Side Effects**:
  - Normalizes config (handles old formats)
  - Updates `StorefrontSettings.themeConfig` (includes branding, seo)
  - Updates `StorefrontPage.layoutJson` (draft or published)
  - Sets `publishedAt` if not draft

### `GET /api/storefront/settings`
- **Method**: GET
- **Auth**: Merchant (`requireMerchant()`)
- **Request**: None
- **Response**: `{ settings: StorefrontSettings }`
- **Side Effects**: Creates default settings if missing

### `PUT /api/storefront/settings`
- **Method**: PUT
- **Auth**: Merchant (`requireMerchant()`)
- **Request Body**: `{ mode?: "THEME" | "CUSTOM_CODE", theme?: string, themeConfig?: object, customHtml?: string, customCss?: string, customJs?: string }`
- **Response**: `{ settings: StorefrontSettings }`
- **Side Effects**: Updates storefront settings, clears `publishedAt` on change

### `POST /api/storefront/page`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request Body**: `{ slug?: string, title?: string, layoutJson?: object, isPublished?: boolean }`
- **Response**: `{ success: true }`
- **Side Effects**: Upserts storefront page

### `POST /api/storefront/publish`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request**: None
- **Response**: `{ publishedAt: Date, message: string }`
- **Side Effects**: Sets `publishedAt = now()` for storefront settings

### `POST /api/storefront/save-theme`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request Body**: `{ storeTitle?: string, logoUrl?: string, primaryColor?: string, theme?: "minimal" | "bold" }`
- **Response**: `{ storefront: StorefrontSettings, message: string }`
- **Side Effects**: Updates theme config, clears custom code fields

### `POST /api/storefront/save-code`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request Body**: `{ customHtml: string, customCss?: string, customJs?: string }`
- **Response**: `{ storefront: StorefrontSettings, message: string }`
- **Side Effects**: Updates custom code, sets mode to CUSTOM_CODE, clears `publishedAt`

### `POST /api/storefront/save-builder`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request Body**: `{ builderJson?: object, builderHtml?: string, builderCss?: string }`
- **Response**: `{ storefront: StorefrontSettings, message: string }`
- **Side Effects**: Saves builder draft (not published)

### `POST /api/storefront/publish-builder`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request Body**: `{ builderJson?: object, builderHtml?: string, builderCss?: string }`
- **Response**: `{ storefront: StorefrontSettings, message: string }`
- **Side Effects**: Saves and publishes builder (sets `publishedAt`)

---

## Uploads API

### `POST /api/uploads/image`
- **Method**: POST
- **Auth**: Merchant (`authorizeRequest()`)
- **Request**: `multipart/form-data` with `file: File`, `kind?: "logo" | "favicon" | "banner" | "product" | "generic"`
- **Response**: `{ url: string, publicId: string }`
- **Side Effects**:
  - Validates file type/size (by kind)
  - Uploads to Cloudinary
  - Returns secure URL
- **Validation**: File type (PNG/JPEG/WebP), size limits (2MB-10MB by kind)

### `POST /api/uploads/document`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request**: `multipart/form-data` with `file: File` (PDF/JPG/PNG, max 5MB)
- **Response**: `{ url: string, publicId: string }`
- **Side Effects**: Uploads to Cloudinary (raw for PDF, image for images)

### `POST /api/cloudinary/sign`
- **Method**: POST
- **Auth**: Merchant (Supabase session)
- **Request**: None
- **Response**: `{ cloudName: string, apiKey: string, timestamp: number, folder: string, signature: string }`
- **Side Effects**: Generates Cloudinary signed upload params

### `POST /api/upload/cloudinary-sign`
- **Method**: POST
- **Auth**: None
- **Request**: None
- **Response**: `{ timestamp: number, signature: string, apiKey: string, cloudName: string }`
- **Side Effects**: Generates Cloudinary signature for client-side upload

---

## Merchant Setup API

### `POST /api/merchant/setup`
- **Method**: POST
- **Auth**: Supabase session (user must exist)
- **Request Body**: `{ displayName: string, slug: string }`
- **Response**: `{ merchant: Merchant, user: User }` (201)
- **Side Effects**:
  - Creates merchant, storefront, default home page, fee config in transaction
  - Links user to merchant
  - **Email**: New merchant signup alert to ops (non-blocking)
- **Validation**: Slug uniqueness, min 3 chars

---

## Admin API

### `GET /api/admin/merchants`
- **Method**: GET
- **Auth**: Platform Admin (`requirePlatformAdmin()`)
- **Request**: None
- **Response**: `Merchant[]` (with stats: orders, products, GMV)
- **Side Effects**: None

### `GET /api/admin/merchants/[merchantId]`
- **Method**: GET
- **Auth**: Super Admin (`requireSuperAdmin()`)
- **Request**: None
- **Response**: `{ merchant: Merchant }` (includes onboarding)
- **Side Effects**: None

### `GET /api/admin/merchants/[merchantId]/ledger`
- **Method**: GET
- **Auth**: Super Admin (`requireSuperAdmin()`)
- **Query Params**: `from?`, `to?`, `type?`
- **Response**: CSV file (`text/csv`)
- **Side Effects**: Exports merchant ledger as CSV

### `GET /api/admin/admin-users`
- **Method**: GET
- **Auth**: Permission `ADMIN_USERS_READ`
- **Request**: None
- **Response**: `AdminUser[]` (with roles)
- **Side Effects**: None

### `POST /api/admin/admin-users`
- **Method**: POST
- **Auth**: Permission `ADMIN_USERS_WRITE`
- **Request Body**: `{ userId: string, email: string, name?: string, isActive?: boolean, reason?: string }`
- **Response**: `AdminUser` (with roles)
- **Side Effects**: Creates admin user, creates audit log

### `POST /api/admin/admin-users/create`
- **Method**: POST
- **Auth**: Super Admin (`requireSuperAdmin()`)
- **Request Body**: `{ email: string, name?: string, roleId: string, sendInviteEmail?: boolean }`
- **Response**: `{ adminUser: AdminUser, tempPassword?: string, createdNewSupabaseUser: boolean }`
- **Side Effects**:
  - Creates Supabase user if doesn't exist
  - Creates AdminUser + role assignment
  - Updates Supabase user metadata

### `PATCH /api/admin/admin-users/[id]`
- **Method**: PATCH
- **Auth**: Permission `ADMIN_USERS_WRITE`
- **Request Body**: `{ email?: string, name?: string, isActive?: boolean, reason?: string }`
- **Response**: `AdminUser` (with roles)
- **Side Effects**: Updates admin user, creates audit log

### `DELETE /api/admin/admin-users/[id]`
- **Method**: DELETE
- **Auth**: Permission `ADMIN_USERS_DELETE`
- **Request Body**: `{ reason?: string }`
- **Response**: `AdminUser` (soft delete: `isActive=false`)
- **Side Effects**: Soft deletes admin user, creates audit log

### `POST /api/admin/admin-users/[id]/roles`
- **Method**: POST
- **Auth**: Permission `ADMIN_USERS_WRITE`
- **Request Body**: `{ roleIds: string[], reason?: string }`
- **Response**: `AdminUser` (with updated roles)
- **Side Effects**: Replaces all role assignments, creates audit log

### `GET /api/admin/roles`
- **Method**: GET
- **Auth**: Permission `ROLES_READ`
- **Request**: None
- **Response**: `{ roles: Role[], allPermissions: Permission[] }`
- **Side Effects**: None

### `POST /api/admin/roles`
- **Method**: POST
- **Auth**: Permission `ROLES_WRITE`
- **Request Body**: `{ name: string, description?: string, permissionIds?: string[], reason?: string }`
- **Response**: `Role` (with permissions)
- **Side Effects**: Creates role, assigns permissions, creates audit log

### `PATCH /api/admin/roles/[id]`
- **Method**: PATCH
- **Auth**: Permission `ROLES_WRITE`
- **Request Body**: `{ name?: string, description?: string, permissionIds?: string[], reason?: string }`
- **Response**: `Role` (with permissions)
- **Side Effects**: Updates role, replaces permissions, creates audit log (blocks system roles)

### `DELETE /api/admin/roles/[id]`
- **Method**: DELETE
- **Auth**: Permission `ROLES_DELETE`
- **Request Body**: `{ reason?: string }`
- **Response**: `{ success: true }`
- **Side Effects**: Deletes role, creates audit log (blocks system roles)

### `GET /api/admin/audit-logs`
- **Method**: GET
- **Auth**: Super Admin (`requireSuperAdmin()`)
- **Query Params**: `actorUserId?`, `entityType?`, `action?`, `startDate?`, `endDate?`, `limit?`, `offset?`
- **Response**: `AdminAuditLog[]`
- **Side Effects**: None

### `GET /api/admin/system-settings`
- **Method**: GET
- **Auth**: Permission `SYSTEM_SETTINGS_READ`
- **Request**: None
- **Response**: `SystemSettings` (creates default if missing)
- **Side Effects**: Creates default settings if missing

### `POST /api/admin/system-settings`
- **Method**: POST
- **Auth**: Permission `SYSTEM_SETTINGS_WRITE`
- **Request Body**: `{ maintenanceMode?: boolean, maintenanceBanner?: string, supportEmail?: string, supportPhone?: string, enableCustomDomains?: boolean, enablePayouts?: boolean, enablePlatformInvoices?: boolean, reason?: string }`
- **Response**: `SystemSettings`
- **Side Effects**: Updates system settings, creates audit log

### `GET /api/admin/billing-profile`
- **Method**: GET
- **Auth**: Admin (`requireAdmin()`)
- **Request**: None
- **Response**: `PlatformBillingProfile` (creates default if missing)
- **Side Effects**: Creates default profile if missing

### `POST /api/admin/billing-profile`
- **Method**: POST
- **Auth**: Admin (`requireAdmin()`)
- **Request Body**: `{ legalName: string, gstin?: string, addressLine1?: string, addressLine2?: string, city?: string, state?: string, pincode?: string, email?: string, phone?: string, invoicePrefix?: string, invoiceNextNumber?: number, invoicePadding?: number, seriesFormat?: string, defaultSacCode?: string, defaultGstRate?: number, footerNote?: string }`
- **Response**: `PlatformBillingProfile`
- **Side Effects**: Updates platform billing profile (Smarkitals details)

---

## Billing API

### `GET /api/billing/invoice.pdf`
- **Method**: GET
- **Auth**: Merchant (`requireMerchant()`) OR Super Admin (`requireSuperAdmin()`)
- **Query Params**: `merchantId?` (required for admin), `from: YYYY-MM-DD`, `to: YYYY-MM-DD`
- **Response**: PDF file (`application/pdf`)
- **Side Effects**:
  - Aggregates ledger entries for period
  - Allocates invoice number
  - Generates PDF
  - Creates invoice record (non-blocking)
- **Tenant Isolation**: Merchant can only access own invoice

### `GET /api/billing/statement.csv`
- **Method**: GET
- **Auth**: Merchant (`requireMerchant()`) OR Super Admin (`requireSuperAdmin()`)
- **Query Params**: `merchantId?` (required for admin), `from: YYYY-MM-DD`, `to: YYYY-MM-DD`
- **Response**: CSV file (`text/csv`)
- **Side Effects**: Exports ledger entries as CSV
- **Tenant Isolation**: Merchant can only access own statement

---

## Settings API

### `GET /api/settings/invoice`
- **Method**: GET
- **Auth**: Merchant (`requireMerchant()`)
- **Request**: None
- **Response**: `{ invoicePrefix: string, invoiceNextNumber: number, invoiceNumberPadding: number, invoiceSeriesFormat: string, resetFy: boolean, logoUrl: string | null }`
- **Side Effects**: None

### `POST /api/settings/invoice`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request Body**: `{ invoicePrefix: string, invoiceNextNumber: number, invoiceNumberPadding: number, invoiceSeriesFormat: string, resetFy: boolean }`
- **Response**: `{ success: true, ...validatedData }`
- **Side Effects**: Updates invoice settings in `MerchantStoreSettings`

---

## Domain API

### `POST /api/domain/save`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request Body**: `{ domain: string }`
- **Response**: `{ merchant: Merchant, message: string }`
- **Side Effects**: Saves custom domain, generates verification token, sets status to PENDING

### `POST /api/domain/verify`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request**: None
- **Response**: `{ verified: boolean, merchant: Merchant, message: string }`
- **Side Effects**: Performs DNS TXT lookup, updates domain status to VERIFIED if token matches

### `POST /api/domain/activate`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request**: None
- **Response**: `{ merchant: Merchant, message: string }`
- **Side Effects**: Sets domain status to ACTIVE (requires VERIFIED)

### `POST /api/domain/disconnect`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request**: None
- **Response**: `{ merchant: Merchant, message: string }`
- **Side Effects**: Clears domain configuration

### `POST /api/domains/add`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request Body**: `{ customDomain: string }`
- **Response**: `{ merchant: Merchant, dnsInstructions: {type, name, value}, message: string }`
- **Side Effects**: Saves domain, generates token, sets status to PENDING

### `POST /api/domains/verify`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request**: None
- **Response**: `{ verified: boolean, merchant: Merchant, message: string }`
- **Side Effects**: Mock verification (sets status to VERIFIED if token exists)

### `POST /api/domains/activate`
- **Method**: POST
- **Auth**: Merchant (`requireMerchant()`)
- **Request**: None
- **Response**: `{ merchant: Merchant, message: string }`
- **Side Effects**: Sets domain status to ACTIVE

---

## Jobs / Cron API

### `GET /api/jobs/generate-platform-invoices`
- **Method**: GET
- **Auth**: Cron Secret (`X-CRON-SECRET` header)
- **Request**: None
- **Response**: `{ success: true, cycleId: string, periodStart: string, periodEnd: string, invoicesCreated: number, invoicesSkipped: number }`
- **Side Effects**:
  - Creates/finds settlement cycle (weekly: Friday to Thursday)
  - Computes platform fees for each merchant
  - Creates `PlatformInvoice` + line items for each merchant
  - Allocates invoice numbers
  - Updates cycle status to INVOICED
- **Schedule**: Weekly on Thursday

### `GET /api/jobs/execute-weekly-payouts`
- **Method**: GET
- **Auth**: Cron Secret (`X-CRON-SECRET` header)
- **Request**: None
- **Response**: `{ success: true, cycleId: string, payoutsCreated: number, payoutsSkipped: number }`
- **Side Effects**:
  - Finds latest INVOICED cycle
  - Calculates net payable (gross - platform fee - invoice total)
  - Creates `PayoutBatch` for each merchant
  - Marks invoices as PAID
  - Updates cycle status to PAID
  - **Email**: Payout processed to merchant (non-blocking)
- **Schedule**: Weekly on Friday

### `GET /api/cron/commission-summary`
- **Method**: GET
- **Auth**: Cron Secret (`X-CRON-SECRET` header)
- **Query Params**: `merchantId?`, `periodStart?`, `periodEnd?`
- **Response**: `{ success: true, message: string }`
- **Side Effects**:
  - **Email**: Commission summary to merchant (scaffold, non-blocking)
- **Note**: Scaffold implementation (TODO: calculate actual commission)

### `GET /api/cron/refund-threshold`
- **Method**: GET
- **Auth**: Cron Secret (`X-CRON-SECRET` header)
- **Query Params**: `periodHours?` (default: 24), `threshold?` (default: 10000)
- **Response**: `{ success: true, alertSent: boolean, periodLabel: string, refundCount: number, refundTotal: number, threshold: number }`
- **Side Effects**:
  - Calculates refund totals for period
  - **Email**: Refund threshold alert to ops (if threshold breached, non-blocking)

---

## Utility API

### `GET /api/env-check`
- **Method**: GET
- **Auth**: None
- **Request**: None
- **Response**: `{ DATABASE_URL: boolean, DIRECT_URL: boolean, SHADOW_DATABASE_URL: boolean, NODE_ENV: string }`
- **Side Effects**: None (diagnostic endpoint)

---

## Summary Statistics

- **Total Endpoints**: 60+
- **Public Endpoints**: 2 (order creation, webhook)
- **Merchant Endpoints**: 30+
- **Admin Endpoints**: 20+
- **Cron/Job Endpoints**: 4

## Common Patterns

### Tenant Isolation
- All merchant endpoints scope queries by `merchant.id`
- Resource-specific endpoints validate ownership with `ensureTenantAccess()`

### Email Triggers
- All email sends are non-blocking (wrapped in try/catch)
- Email failures don't fail the main operation

### Transaction Safety
- Critical operations use Prisma transactions
- Invoice number allocation is transaction-safe

### Error Handling
- DB connection errors return 503
- Auth errors return 401/403
- Validation errors return 400 with details

### Rate Limiting
- Public order creation: 10 req/min per IP
