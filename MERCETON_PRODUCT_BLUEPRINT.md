# Merceton Product Blueprint

Complete product specification compiled from codebase analysis.

---

## Table of Contents

1. [Feature List by Module](#feature-list-by-module)
2. [Permissions Matrix](#permissions-matrix)
3. [Data Model Summary](#data-model-summary)
4. [Money Flow Diagram](#money-flow-diagram)
5. [Missing Features Checklist](#missing-features-checklist)

---

## Feature List by Module

### 1. Authentication & User Management

#### 1.1 User Authentication
- ✅ Supabase Auth integration
- ✅ Email/password sign-in
- ✅ Email/password sign-up
- ✅ Password reset (via Supabase)
- ✅ Session management (middleware refresh)
- ✅ Cookie-based authentication
- ⚠️ Custom password reset flow (template ready, not implemented)

#### 1.2 User Roles
- ✅ Admin role (merchant admin)
- ✅ Staff role (merchant staff - defined but not used)
- ✅ Platform admin (email allowlist-based)
- ✅ Super admin (email allowlist-based)

#### 1.3 Multi-Tenancy
- ✅ Merchant isolation (all data scoped by `merchantId`)
- ✅ User-to-merchant association
- ✅ Tenant boundary enforcement
- ✅ Store slug-based routing

---

### 2. Merchant Management

#### 2.1 Merchant Onboarding
- ✅ Merchant creation flow
- ✅ Store setup (`/api/merchant/setup`)
- ✅ Store slug generation
- ✅ Default fee configuration assignment
- ✅ Onboarding status tracking
- ✅ Profile completion percentage

#### 2.2 Merchant Profile
- ✅ Store display name
- ✅ Store slug (unique, URL-friendly)
- ✅ Account status (ACTIVE, ON_HOLD, SUSPENDED)
- ✅ Custom domain configuration
- ✅ Domain verification
- ✅ Domain status tracking

#### 2.3 Merchant Settings
- ✅ Store settings (name, tagline, description)
- ✅ Branding (logo, banner, favicon, colors)
- ✅ Contact info (email, phone, address)
- ✅ Social links (Instagram, Facebook, LinkedIn, Twitter, YouTube)
- ✅ Policies (return, refund, shipping, terms, privacy)
- ✅ SEO settings (title, description, OG image)
- ✅ Operational settings (timezone, guest checkout, stock visibility)

#### 2.4 Compliance & Tax
- ✅ PAN details capture
- ✅ GST registration status
- ✅ GSTIN storage
- ✅ GST state code
- ✅ Invoice address
- ✅ Contact address
- ⚠️ Tax profile validation

---

### 3. Storefront Builder

#### 3.1 Theme Customization
- ✅ Theme mode (THEME, BUILDER, CUSTOM_CODE)
- ✅ Color customization (primary, secondary)
- ✅ Typography settings
- ✅ UI settings (radius, buttons, spacing)
- ✅ Custom CSS injection
- ✅ CSS variables system
- ✅ Theme presets

#### 3.2 Layout Builder
- ✅ Section-based page builder
- ✅ Drag-and-drop sections (Hero, Featured Products, Collections, Newsletter, Rich Text, Custom HTML)
- ✅ Section visibility toggles
- ✅ Section ordering
- ✅ Draft vs Published configurations
- ✅ Live preview in builder

#### 3.3 Branding & SEO
- ✅ Logo upload
- ✅ Favicon upload
- ✅ Banner image upload
- ✅ Store display name
- ✅ Tagline
- ✅ Footer copyright text
- ✅ Social links
- ✅ Meta title, description, keywords
- ✅ Open Graph image
- ✅ Twitter card image

#### 3.4 Storefront Pages
- ✅ Home page builder
- ✅ Page slug management
- ✅ Published/draft states
- ✅ Layout JSON storage
- ⚠️ Multi-page support (schema supports, UI limited to home)

---

### 4. Product Catalog

#### 4.1 Product Management
- ✅ Product CRUD operations
- ✅ Product name, description
- ✅ Price (in paise)
- ✅ MRP (optional)
- ✅ SKU (optional)
- ✅ Stock management
- ✅ Active/inactive status
- ✅ Product images (multiple, sortable)

#### 4.2 Product Tax
- ✅ HSN/SAC code
- ✅ GST rate (percentage)
- ✅ Taxable/non-taxable flag
- ✅ Tax metadata for invoices

#### 4.3 Product Display
- ✅ Storefront product listing
- ✅ Product detail page
- ✅ Image gallery
- ✅ Stock status display
- ✅ Price display (with MRP if applicable)

---

### 5. Order Management

#### 5.1 Order Creation
- ✅ Public order API (`/api/orders/create`)
- ✅ Order validation (products, stock, customer email)
- ✅ Order number generation (atomic, concurrency-safe)
- ✅ Order status tracking (PENDING, PLACED, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- ✅ Order stage tracking (NEW, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURNED)
- ✅ Customer information capture
- ✅ Shipping address
- ✅ Stock decrement on order creation

#### 5.2 Order Processing
- ✅ Order detail view
- ✅ Order status updates
- ✅ Order stage updates
- ✅ Order notes/events
- ✅ Order search and filtering
- ✅ Order export (CSV)

#### 5.3 Order Items
- ✅ Line items with product details
- ✅ Quantity tracking
- ✅ Price snapshot (at time of order)
- ✅ Product reference (for inventory)

---

### 6. Payment Processing

#### 6.1 Payment Methods
- ✅ Razorpay (online payment)
- ✅ COD (Cash on Delivery)
- ✅ UPI (mapped to Razorpay)

#### 6.2 Payment Flow
- ✅ Payment record creation (on order creation)
- ✅ Razorpay order creation (`/api/payments/create-razorpay-order`)
- ✅ Payment verification (`/api/payments/verify`)
- ✅ Webhook handling (`/api/webhooks/razorpay`)
- ✅ Payment status tracking (CREATED, PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED)
- ✅ Signature verification (HMAC)
- ✅ Idempotency (prevents duplicate processing)

#### 6.3 Payment Security
- ✅ HMAC signature verification
- ✅ Amount validation
- ✅ Duplicate payment prevention
- 🔴 **Missing**: Tenant isolation in payment routes

---

### 7. Financial Ledger

#### 7.1 Ledger Entries
- ✅ Gross order value entry (credit)
- ✅ Platform fee entry (debit)
- ✅ Order payout entry (credit)
- ✅ Ledger entry status (PENDING, PROCESSING, COMPLETED, FAILED)
- ✅ Ledger entry types (GROSS_ORDER_VALUE, PLATFORM_FEE, ORDER_PAYOUT, PAYOUT_PROCESSED)
- ✅ GST breakdown (CGST, SGST, IGST)
- ✅ Tax type tracking (CGST_SGST, IGST)
- ✅ Ledger entry metadata (JSON)

#### 7.2 Ledger Status Flow
- ✅ PENDING → PROCESSING (on payment verification)
- ⚠️ **Missing**: PROCESSING → COMPLETED (never transitions)

#### 7.3 Ledger Queries
- ✅ Merchant ledger view
- ✅ Ledger export (CSV)
- ✅ Ledger filtering by type, status, date
- ⚠️ **Missing**: Ledger reconciliation job

---

### 8. Platform Fees

#### 8.1 Fee Calculation
- ✅ Percentage fee (basis points)
- ✅ Flat fee (paise)
- ✅ Maximum cap (paise)
- ✅ Fee formula: `(gross × percentage_bps / 10000) + flat_fee`, capped at max
- ✅ Fee cannot exceed gross amount
- ✅ Net payable calculation (gross - fee)

#### 8.2 Fee Configuration
- ✅ Pricing packages (PUBLISHED, DRAFT, ARCHIVED)
- ✅ Merchant-level fee overrides
- ✅ Effective fee config (package + overrides)
- ✅ Default fee configuration
- ✅ Fee config per merchant

#### 8.3 Fee Display
- ✅ Fee breakdown in orders
- ✅ Fee summary in payouts dashboard
- ✅ Fee configuration display

---

### 9. Payouts & Settlements

#### 9.1 Payout Calculation
- ✅ Weekly payout cycle
- ✅ Payout eligibility (paid orders, non-cancelled)
- ✅ Net payable aggregation
- ✅ Platform invoice deduction
- ✅ Payout batch creation
- ✅ Payout status tracking (PENDING, PROCESSING, COMPLETED, FAILED)

#### 9.2 Payout Execution
- ✅ Weekly cron job (`/api/jobs/execute-weekly-payouts`)
- ✅ Payout batch creation
- ✅ Platform invoice linking
- ✅ Settlement cycle tracking
- ⚠️ **Missing**: Hold period (orders paid out immediately)
- ⚠️ **Missing**: Razorpay payout integration

#### 9.3 Payout Display
- ✅ Payout dashboard
- ✅ Payout history
- ✅ Payout details
- ✅ Settlement reference
- ✅ Bank account info (last 4 digits)

---

### 10. Platform Billing (Merceton → Merchant)

#### 10.1 Platform Invoices
- ✅ Platform invoice generation
- ✅ Invoice line items (PLATFORM_FEE, SHIPPING, ADJUSTMENT, PENALTY, OTHER)
- ✅ GST calculation (CGST/SGST or IGST)
- ✅ Invoice numbering (financial year-based)
- ✅ Invoice status (ISSUED, CANCELLED, PAID)
- ✅ Settlement cycle linking

#### 10.2 Settlement Cycles
- ✅ Weekly settlement cycles
- ✅ Period tracking (Thursday to Thursday)
- ✅ Cycle status (DRAFT, INVOICED, PAID)
- ✅ Invoice generation timestamp
- ✅ Payout execution timestamp

#### 10.3 Billing Profile
- ✅ Platform billing profile (Smarkitals)
- ✅ GSTIN, address, contact
- ✅ Invoice numbering settings
- ✅ Default SAC code
- ✅ Default GST rate
- ✅ Footer notes

---

### 11. Invoicing (Merchant → Customer)

#### 11.1 Invoice Generation
- ✅ Invoice number allocation (transaction-safe)
- ✅ Invoice settings (prefix, series format, padding, reset FY)
- ✅ Invoice type (TAX_INVOICE, BILL_OF_SUPPLY)
- ✅ GST-based invoice type determination
- ✅ Invoice HTML view
- ✅ Invoice PDF generation (PDFKit)
- ✅ Invoice logo (from storefront branding)

#### 11.2 Invoice Display
- ✅ Seller details (from onboarding/contact info)
- ✅ Buyer details (from order)
- ✅ Item-level tax breakdown
- ✅ GST calculation (CGST/SGST vs IGST)
- ✅ Totals and subtotals
- ✅ Cancelled order watermark

#### 11.3 Invoice Settings
- ✅ Invoice prefix configuration
- ✅ Invoice series format
- ✅ Next invoice number
- ✅ Number padding
- ✅ Financial year reset option

---

### 12. Shipping & Fulfillment

#### 12.1 Shipment Management
- ✅ Shipment creation
- ✅ Courier name
- ✅ AWB (Airway Bill) tracking
- ✅ Tracking URL
- ✅ Shipped date
- ✅ Delivered date

#### 12.2 Shipment Updates
- ✅ Shipment status updates
- ✅ Tracking information updates
- ✅ Customer email notification on shipment
- ✅ Order stage updates (SHIPPED, OUT_FOR_DELIVERY, DELIVERED)

---

### 13. Refunds

#### 13.1 Refund Model
- ✅ Refund record creation
- ✅ Refund amount
- ✅ Refund reason
- ✅ Refund status (PENDING, COMPLETED, FAILED)
- ✅ Refund-to-order linking

#### 13.2 Refund Processing
- ⚠️ **Missing**: Refund processing logic
- ⚠️ **Missing**: Refund email trigger
- ⚠️ **Missing**: Ledger entry reversal
- ⚠️ **Missing**: Payout adjustment on refund

#### 13.3 Refund Monitoring
- ✅ Refund threshold alert (cron job)
- ✅ Refund count tracking
- ✅ Refund total tracking
- ✅ Ops alert on threshold breach

---

### 14. Admin Panel (Super Admin)

#### 14.1 Merchant Management
- ✅ Merchant list view
- ✅ Merchant detail view
- ✅ Merchant stats (orders, products)
- ✅ Merchant activation/deactivation
- ✅ Merchant account hold
- ✅ Merchant pricing package assignment

#### 14.2 Order Management
- ✅ All merchants' orders view
- ✅ Order detail view
- ✅ Order search and filtering

#### 14.3 Pricing Management
- ✅ Pricing package CRUD
- ✅ Package status (DRAFT, PUBLISHED, ARCHIVED)
- ✅ Package visibility (PUBLIC, INTERNAL)
- ✅ Fee configuration per package
- ✅ Default package assignment

#### 14.4 Platform Settings
- ✅ Platform billing profile management
- ✅ Default fee configuration
- ✅ System settings (feature flags, maintenance mode)
- ✅ Audit logging

#### 14.5 RBAC (Role-Based Access Control)
- ✅ Admin user management
- ✅ Role management
- ✅ Permission management
- ✅ Role-permission assignment
- ✅ User-role assignment
- ⚠️ **Partially Used**: RBAC system exists but not widely used (email allowlist preferred)

---

### 15. Email Notifications

#### 15.1 Customer Emails
- ✅ Order confirmation
- ✅ Shipment update
- ⚠️ Refund initiated (template ready, not triggered)

#### 15.2 Merchant Emails
- ✅ New order notification
- ✅ Payout processed
- ⚠️ Commission summary (template ready, not triggered)

#### 15.3 Internal Emails
- ✅ High value order alert
- ✅ Webhook failure alert
- ✅ Refund threshold alert
- ✅ New merchant signup alert

#### 15.4 Email Infrastructure
- ✅ Resend integration
- ✅ Channel-based senders (orders, support, finance, ops)
- ✅ Email tagging for analytics
- ✅ Non-blocking error handling
- ⚠️ **Missing**: Email logging to DB
- ⚠️ **Missing**: Bounce handling
- ⚠️ **Missing**: Unsubscribe mechanism

---

### 16. Media Management

#### 16.1 Image Upload
- ✅ Cloudinary integration
- ✅ Image upload API (`/api/uploads/image`)
- ✅ File type validation
- ✅ File size validation
- ✅ Upload by kind (logo, favicon, banner, product, generic)
- ✅ Tenant-scoped uploads (folder structure)

#### 16.2 Image Types
- ✅ Product images
- ✅ Storefront logo
- ✅ Storefront favicon
- ✅ Storefront banner
- ✅ Invoice logo

---

### 17. Reporting & Analytics

#### 17.1 Order Reports
- ✅ Order export (CSV)
- ✅ Order filtering and search
- ✅ Order statistics

#### 17.2 Financial Reports
- ✅ Ledger export (CSV)
- ✅ Payout summary
- ✅ Fee breakdown
- ⚠️ **Missing**: Commission summary report
- ⚠️ **Missing**: Tax reports
- ⚠️ **Missing**: Sales analytics dashboard

---

## Permissions Matrix

### Role Definitions

| Role | Scope | Access Level |
|------|-------|--------------|
| **Customer** | Public | Storefront only (no dashboard) |
| **Merchant Admin** | Own merchant | Full access to own merchant data |
| **Merchant Staff** | Own merchant | Limited access (defined but not used) |
| **Platform Admin** | All merchants | Email allowlist-based, full platform access |
| **Super Admin** | All merchants | Email allowlist-based, full platform access |

### Permission Matrix

| Action | Customer | Merchant Admin | Merchant Staff | Platform Admin | Super Admin |
|--------|----------|----------------|----------------|----------------|-------------|
| **Storefront** |
| View storefront | ✅ | ✅ | ✅ | ✅ | ✅ |
| Place order | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Merchant Dashboard** |
| View dashboard | ❌ | ✅ | ⚠️ | ✅ | ✅ |
| Manage products | ❌ | ✅ | ⚠️ | ✅ | ✅ |
| Manage orders | ❌ | ✅ | ⚠️ | ✅ | ✅ |
| View payouts | ❌ | ✅ | ⚠️ | ✅ | ✅ |
| Manage storefront | ❌ | ✅ | ⚠️ | ✅ | ✅ |
| Manage settings | ❌ | ✅ | ❌ | ✅ | ✅ |
| Manage invoice settings | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Admin Panel** |
| View admin panel | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage merchants | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage orders (all) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage pricing | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage platform settings | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage billing profile | ❌ | ❌ | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ❌ | ❌ | ✅ | ✅ |
| **RBAC** |
| Manage admin users | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| Manage roles | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| Manage permissions | ❌ | ❌ | ❌ | ⚠️ | ✅ |

**Legend**:
- ✅ = Full access
- ⚠️ = Defined but not fully implemented
- ❌ = No access

### Permission Keys (RBAC System)

| Permission | Description | Used |
|-----------|-------------|------|
| `billing_profile.read` | Read platform billing profile | ⚠️ |
| `billing_profile.write` | Update platform billing profile | ⚠️ |
| `admin_users.read` | View admin users | ⚠️ |
| `admin_users.write` | Create/update admin users | ⚠️ |
| `admin_users.delete` | Delete admin users | ⚠️ |
| `roles.read` | View roles | ⚠️ |
| `roles.write` | Create/update roles | ⚠️ |
| `roles.delete` | Delete roles | ⚠️ |
| `audit_logs.read` | View audit logs | ⚠️ |
| `system_settings.read` | View system settings | ⚠️ |
| `system_settings.write` | Update system settings | ⚠️ |
| `platform_invoices.read` | View platform invoices | ⚠️ |
| `platform_invoices.write` | Create/update platform invoices | ⚠️ |
| `payouts.read` | View payouts | ⚠️ |
| `payouts.execute` | Execute payouts | ⚠️ |
| `merchants.read` | View merchants | ⚠️ |
| `merchants.write` | Create/update merchants | ⚠️ |

**Note**: RBAC system is implemented but not widely used. Platform admin access is currently email allowlist-based.

---

## Data Model Summary

### Core Entities

#### Merchant (Root Tenant)
- **Fields**: id, slug, displayName, isActive, accountStatus, customDomain, domainStatus
- **Relations**: users, products, orders, payments, ledgerEntries, payoutBatches, storefront, pages, feeConfig, bankAccount, onboarding, storeSettings, platformInvoices
- **Tenancy**: Root entity (no merchantId)

#### User
- **Fields**: id, merchantId, authUserId, email, name, role, isActive
- **Relations**: merchant (nullable)
- **Tenancy**: Scoped by merchantId (nullable)

#### Product
- **Fields**: id, merchantId, name, description, price, mrp, sku, stock, isActive, hsnOrSac, gstRate, isTaxable
- **Relations**: merchant, images, orderItems
- **Tenancy**: Scoped by merchantId

#### Order
- **Fields**: id, merchantId, orderNumber, customerName, customerEmail, customerPhone, customerAddress, status, stage, paymentStatus, settlementStatus, grossAmount, platformFee, netPayable, invoiceNumber, invoiceIssuedAt, invoiceType
- **Relations**: merchant, items, payment, ledgerEntries, shipments, refunds, events, platformInvoiceLinks
- **Tenancy**: Scoped by merchantId

#### Payment
- **Fields**: id, merchantId, orderId, paymentMethod, status, razorpayOrderId, razorpayPaymentId, razorpaySignature, amount
- **Relations**: merchant, order
- **Tenancy**: Scoped by merchantId

#### LedgerEntry
- **Fields**: id, merchantId, orderId, type, amount, description, status, payoutBatchId, baseAmountPaise, gstAmountPaise, totalAmountPaise, taxType, cgstPaise, sgstPaise, igstPaise, occurredAt
- **Relations**: merchant, order, payoutBatch, invoiceRecord
- **Tenancy**: Scoped by merchantId

#### PayoutBatch
- **Fields**: id, merchantId, totalAmount, status, razorpayPayoutId, processedAt, cycleId, platformInvoiceId
- **Relations**: merchant, ledgerEntries, platformInvoice
- **Tenancy**: Scoped by merchantId

### Financial Models

#### PlatformInvoice
- **Fields**: id, merchantId, cycleId, invoiceNumber, invoiceDate, currency, subtotal, gstAmount, total, status
- **Relations**: merchant, cycle, lineItems, payoutBatches, orders
- **Tenancy**: Scoped by merchantId

#### PlatformSettlementCycle
- **Fields**: id, periodStart, periodEnd, invoiceGeneratedAt, payoutScheduledFor, payoutExecutedAt, status
- **Relations**: invoices
- **Tenancy**: Platform-wide

#### InvoiceRecord
- **Fields**: id, merchantId, financialYear, invoiceNumber, periodFrom, periodTo, generatedAt, generatedBy
- **Relations**: merchant, ledgerEntries
- **Tenancy**: Scoped by merchantId

### Configuration Models

#### MerchantFeeConfig
- **Fields**: id, merchantId, pricingPackageId, fixedFeeOverridePaise, variableFeeOverrideBps, payoutFrequencyOverride, holdbackOverrideBps, isPayoutHoldOverride, domainSubscriptionActive
- **Relations**: merchant, pricingPackage
- **Tenancy**: Scoped by merchantId (one-to-one)

#### PricingPackage
- **Fields**: id, name, description, status, fixedFeePaise, variableFeeBps, domainPricePaise, domainAllowed, domainIncluded, payoutFrequency, holdbackBps, isPayoutHold, isActive, visibility, deletedAt
- **Relations**: merchantFeeConfigs, auditLogs, platformSettings
- **Tenancy**: Platform-wide

#### StorefrontSettings
- **Fields**: id, merchantId, mode, theme, themeConfig, customHtml, customCss, customJs, builderJson, builderHtml, builderCss, logoUrl, publishedAt
- **Relations**: merchant
- **Tenancy**: Scoped by merchantId (one-to-one)

#### MerchantStoreSettings
- **Fields**: id, merchantId, storeName, tagline, description, logoUrl, bannerUrl, faviconUrl, brandPrimaryColor, brandSecondaryColor, supportEmail, supportPhone, invoicePrefix, invoiceNextNumber, invoiceNumberPadding, invoiceSeriesFormat, resetFy, social links, SEO fields
- **Relations**: merchant
- **Tenancy**: Scoped by merchantId (one-to-one)

### Compliance Models

#### MerchantOnboarding
- **Fields**: id, merchantId, onboardingStatus, panType, panNumber, gstStatus, gstin, gstLegalName, gstTradeName, gstState, invoiceAddressLine1, invoiceAddressLine2, invoiceCity, invoicePincode, contactEmail, contactPhone, contactAddressLine1, contactAddressLine2, contactCity, contactState, contactPincode
- **Relations**: merchant
- **Tenancy**: Scoped by merchantId (one-to-one)

#### MerchantBankAccount
- **Fields**: id, merchantId, accountHolderName, bankName, accountNumber, ifscCode, accountType, isPrimary, verificationStatus, proofType, proofDocumentUrl
- **Relations**: merchant
- **Tenancy**: Scoped by merchantId (one-to-one)

### Admin Models

#### AdminUser
- **Fields**: id, userId, email, name, isActive, mustResetPassword
- **Relations**: roles
- **Tenancy**: Platform-wide

#### Role
- **Fields**: id, name, description, isSystem
- **Relations**: permissions, adminUsers
- **Tenancy**: Platform-wide

#### Permission
- **Fields**: id, key, label
- **Relations**: roles
- **Tenancy**: Platform-wide

#### AdminAuditLog
- **Fields**: id, actorUserId, actorEmail, action, entityType, entityId, reason, beforeJson, afterJson, ip, userAgent, metadata, pricingPackageId
- **Relations**: pricingPackage
- **Tenancy**: Platform-wide

### Singleton Models

#### PlatformSettings
- **Fields**: id (singleton), defaultFeePercentageBps, defaultFeeFlatPaise, defaultFeeMaxCapPaise, defaultPricingPackageId
- **Tenancy**: Platform-wide

#### SystemSettings
- **Fields**: id (singleton), maintenanceMode, maintenanceBanner, supportEmail, supportPhone, enableCustomDomains, enablePayouts, enablePlatformInvoices
- **Tenancy**: Platform-wide

#### PlatformBillingProfile
- **Fields**: id (platform), legalName, gstin, addressLine1, addressLine2, city, state, pincode, email, phone, invoicePrefix, invoiceNextNumber, invoicePadding, seriesFormat, defaultSacCode, defaultGstRate, footerNote
- **Tenancy**: Platform-wide

### Numbering Models

#### OrderCounter
- **Fields**: id, key (ORD-YYMM), seq
- **Tenancy**: Platform-wide

#### InvoiceSequence
- **Fields**: id, financialYear (2025-26), lastNumber
- **Tenancy**: Platform-wide

---

## Money Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDER CREATION FLOW                           │
└─────────────────────────────────────────────────────────────────┘

1. Customer places order
   ↓
2. Order created (status: PENDING/PLACED)
   ├─ Payment record created (status: CREATED/PENDING)
   ├─ Stock decremented
   └─ THREE ledger entries created (status: PENDING):
      ├─ GROSS_ORDER_VALUE (+amount) [Credit]
      ├─ PLATFORM_FEE (-fee) [Debit]
      └─ ORDER_PAYOUT (+net) [Credit]
   ↓
3. Platform fee calculated:
   fee = (gross × percentage_bps / 10000) + flat_fee
   if fee > max_cap: fee = max_cap
   if fee > gross: fee = gross
   net = gross - fee
   ↓
4. Order totals stored:
   order.grossAmount = gross
   order.platformFee = fee
   order.netPayable = net


┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT VERIFICATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

5. Payment method: RAZORPAY
   ├─ Razorpay order created (/api/payments/create-razorpay-order)
   ├─ Customer pays via Razorpay
   └─ Payment verified (/api/payments/verify OR webhook)
      ├─ Signature verified (HMAC)
      ├─ Amount validated
      ├─ Payment.status = PAID
      ├─ Order.status = CONFIRMED
      └─ Ledger entries: PENDING → PROCESSING
   ↓
6. Payment method: COD
   ├─ Payment.status = PENDING
   ├─ Order.status = PLACED
   └─ Ledger entries remain PENDING
   ⚠️ Missing: COD collection flow (ledger entries never move to PROCESSING)


┌─────────────────────────────────────────────────────────────────┐
│                    PLATFORM FEE COLLECTION                       │
└─────────────────────────────────────────────────────────────────┘

7. Platform fee deducted from gross:
   ├─ Ledger entry: PLATFORM_FEE (negative amount)
   ├─ Fee stored in order.platformFee
   └─ Fee config from: PricingPackage + MerchantFeeConfig overrides
   ↓
8. Net payable to merchant:
   ├─ Ledger entry: ORDER_PAYOUT (positive amount)
   ├─ Amount = gross - platform fee
   └─ Stored in order.netPayable


┌─────────────────────────────────────────────────────────────────┐
│                    SETTLEMENT & PAYOUT FLOW                      │
└─────────────────────────────────────────────────────────────────┘

9. Weekly Settlement Cycle (Thursday):
   ├─ Period: Thursday to Thursday
   ├─ Status: DRAFT → INVOICED → PAID
   └─ Platform invoices generated for each merchant
      ├─ Invoice line items: PLATFORM_FEE entries
      ├─ GST calculated (CGST/SGST or IGST)
      └─ Invoice total = platform fees for period
   ↓
10. Weekly Payout Execution (Friday):
    ├─ Find INVOICED settlement cycle
    ├─ For each merchant:
    │   ├─ Calculate total netPayable from paid orders in period
    │   ├─ Deduct platform invoice total
    │   ├─ Create PayoutBatch if amount > 0
    │   └─ Link to PlatformInvoice and SettlementCycle
    └─ Update cycle status: INVOICED → PAID
    ↓
11. Payout processing:
    ├─ PayoutBatch.status = PENDING
    ├─ Link ledger entries to payoutBatchId
    ├─ ⚠️ Missing: Razorpay payout API integration
    ├─ ⚠️ Missing: Ledger entries: PROCESSING → COMPLETED
    └─ Email notification to merchant


┌─────────────────────────────────────────────────────────────────┐
│                    REFUND FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

12. Refund initiated:
    ├─ Refund record created (status: PENDING)
    ├─ Refund.amount = refund amount
    ├─ Refund.reason = reason
    └─ ⚠️ Missing: Ledger entry reversal
       ├─ Should create: -GROSS_ORDER_VALUE
       ├─ Should create: +PLATFORM_FEE (reverse fee)
       └─ Should create: -ORDER_PAYOUT
    ↓
13. Refund processed:
    ├─ Refund.status = COMPLETED
    ├─ ⚠️ Missing: Email notification to customer
    ├─ ⚠️ Missing: Payout adjustment (if already paid out)
    └─ ⚠️ Missing: Order status update


┌─────────────────────────────────────────────────────────────────┐
│                    LEDGER STATUS FLOW                            │
└─────────────────────────────────────────────────────────────────┘

Current Flow (INCOMPLETE):
PENDING → PROCESSING → (missing: COMPLETED)

Should Be:
PENDING → PROCESSING → COMPLETED
  │         │            │
  │         │            └─ When: Order delivered OR Payout processed
  │         │
  │         └─ When: Payment verified
  │
  └─ When: Order created


┌─────────────────────────────────────────────────────────────────┐
│                    MONEY MOVEMENT SUMMARY                        │
└─────────────────────────────────────────────────────────────────┘

Customer Payment:
  Customer → Razorpay → Platform (gross amount)

Platform Fee:
  Platform keeps: platformFee (from gross)

Merchant Payout:
  Platform → Merchant: netPayable (gross - platformFee)

Platform Invoice (Merceton → Merchant):
  Platform invoices merchant for: platform fees collected
  Deducted from: merchant payouts

Net Flow:
  Customer pays: ₹1000 (gross)
  Platform keeps: ₹25 (platform fee)
  Merchant receives: ₹975 (net payable)
  Platform invoices merchant: ₹25 (platform fee)
  Merchant net: ₹975 - ₹25 = ₹950 (after platform invoice)
```

---

## Missing Features Checklist

### 🔴 Critical (Security & Financial)

#### Payment Security
- [ ] **Tenant isolation in payment routes** (`/api/payments/create-razorpay-order`, `/api/payments/verify`)
  - **Risk**: Anyone with orderId can create/verify payments
  - **Fix**: Add storeSlug validation or require authentication

#### Refund Processing
- [ ] **Refund processing logic** (create reverse ledger entries)
- [ ] **Refund email trigger** (template exists, not called)
- [ ] **Payout adjustment on refund** (if order already paid out)
- [ ] **Order status update on refund**

#### Ledger Status Flow
- [ ] **Ledger entries: PROCESSING → COMPLETED**
  - **When**: Order delivered OR payout processed
  - **Current**: Entries stay in PROCESSING forever

#### Payout Safety
- [ ] **Hold period for payouts** (e.g., 7 days after payment)
  - **Risk**: Chargebacks not accounted for
- [ ] **Payout reversal logic** (if refund after payout)

### 🟡 High Priority (Core Features)

#### Financial Reconciliation
- [ ] **Ledger reconciliation job** (verify entries match order totals)
- [ ] **Payout calculation from ledger entries** (currently uses order.netPayable)
- [ ] **Ledger entry balance validation** (GROSS - FEE = PAYOUT)

#### COD Flow
- [ ] **COD collection flow** (update payment status when collected)
- [ ] **COD collection triggers ledger update** (PENDING → PROCESSING)

#### Invoice Features
- [ ] **Invoice number stability validation** (prevent regeneration)
- [ ] **Invoice PDF download button in order list** (currently only in detail page)

### 🟢 Medium Priority (Enhancements)

#### Email System
- [ ] **Email logging to DB** (status, type, recipient, entityId, error)
- [ ] **Refund initiated email trigger**
- [ ] **Commission summary email trigger**
- [ ] **Bounce handling** (update user records on bounce)
- [ ] **Unsubscribe mechanism** (for transactional emails)

#### Reporting
- [ ] **Commission summary report generation**
- [ ] **Tax reports** (GST summary, tax breakdown)
- [ ] **Sales analytics dashboard** (revenue trends, product performance)
- [ ] **Financial year reports**

#### Storefront
- [ ] **Multi-page support** (currently only home page)
- [ ] **Page templates** (about, contact, etc.)
- [ ] **Blog/CMS pages**

#### Product Features
- [ ] **Product variants** (size, color, etc.)
- [ ] **Product categories** (hierarchical)
- [ ] **Product tags**
- [ ] **Bulk product operations** (import, export, update)

#### Order Features
- [ ] **Order cancellation flow** (with refund)
- [ ] **Order return flow** (with refund)
- [ ] **Partial refunds**
- [ ] **Order notes/comments** (internal)
- [ ] **Order history/audit trail** (who changed what)

### 🔵 Low Priority (Nice to Have)

#### Admin Features
- [ ] **RBAC fully implemented** (currently email allowlist preferred)
- [ ] **Admin dashboard analytics** (platform-wide stats)
- [ ] **Merchant activity monitoring**
- [ ] **Automated merchant onboarding workflow**

#### Merchant Features
- [ ] **Multi-user merchant accounts** (staff role fully implemented)
- [ ] **Merchant API keys** (for programmatic access)
- [ ] **Webhook endpoints** (merchant-defined)
- [ ] **Custom domain SSL management**

#### Customer Features
- [ ] **Customer accounts** (order history, saved addresses)
- [ ] **Wishlist**
- [ ] **Product reviews/ratings**
- [ ] **Loyalty program**

#### Integrations
- [ ] **Shipping provider integration** (automated label generation)
- [ ] **Accounting software integration** (QuickBooks, Tally)
- [ ] **Inventory management integration**
- [ ] **Marketing automation** (email campaigns, abandoned cart)

---

## Summary Statistics

### Implemented Features
- **Total Modules**: 17
- **Total Features**: ~150+
- **Email Templates**: 11 (9 active, 2 ready)
- **Database Models**: 35
- **API Routes**: 50+

### Missing Features
- **Critical**: 5 items
- **High Priority**: 6 items
- **Medium Priority**: 15 items
- **Low Priority**: 12 items
- **Total Missing**: 38 items

### Security Gaps
- **Payment routes**: Missing tenant isolation
- **Refund processing**: Not implemented
- **Ledger status**: Incomplete flow

### Financial Gaps
- **Payout hold period**: Not implemented
- **Refund reversal**: Not implemented
- **Ledger reconciliation**: Not implemented

---

## Next Steps Recommendations

### Phase 1: Critical Fixes (Week 1-2)
1. Fix payment route tenant isolation
2. Implement refund processing with ledger reversal
3. Complete ledger status flow (PENDING → PROCESSING → COMPLETED)
4. Add payout hold period

### Phase 2: Core Features (Week 3-4)
1. Implement COD collection flow
2. Add ledger reconciliation job
3. Switch payout calculation to use ledger entries
4. Add email logging to DB

### Phase 3: Enhancements (Month 2)
1. Commission summary report
2. Tax reports
3. Sales analytics dashboard
4. Multi-page storefront support

### Phase 4: Advanced Features (Month 3+)
1. RBAC full implementation
2. Customer accounts
3. Product variants
4. Shipping integrations
