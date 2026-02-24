# Email System Analysis

Complete analysis of email templates, triggers, recipients, and data injection.

---

## Email Infrastructure

### Provider: Resend
- **Config**: `lib/email/mailer.ts`
- **API Key**: `RESEND_API_KEY` (required)
- **Channels**: `orders`, `support`, `finance`, `ops`

### Sender Addresses (by Channel)
- **orders**: `EMAIL_FROM_ORDERS` or `"merceton Orders <no-reply@merceton.com>"`
- **support**: `EMAIL_FROM_SUPPORT` or `"Merceton Support <support@merceton.com>"`
- **finance**: `EMAIL_FROM_FINANCE` or `"Merceton Finance <billing@merceton.com>"`
- **ops**: `EMAIL_FROM_OPS` or `"Merceton Ops <ops@merceton.com>"`

### Reply-To Addresses (by Channel)
- **orders**: `support@merceton.com`
- **support**: `support@merceton.com`
- **finance**: `billing@merceton.com`
- **ops**: None (no default reply-to)

### Email Layout
- **Shared Layout**: `emails/_layout.ts` - `wrapEmail()`
- **Features**: Consistent branding, responsive design, preheader text, footer with support contact

---

## Email Templates

### 1. Order Confirmation (Customer)
**File**: `emails/orderConfirmation.ts`  
**Function**: `orderConfirmationTemplate()`

**Recipient**: Customer (order buyer)  
**Channel**: `orders`  
**Subject**: `Order Confirmed - {orderNumber}`

**Trigger**:
- **When**: Order created successfully
- **File**: `app/actions/orders.ts:259`
- **Condition**: After order creation (non-blocking, wrapped in try/catch)

**Data Injected**:
```typescript
{
  customerName: string          // From order.customerName
  orderId: string              // Internal ID (order.id)
  orderNumber: string          // Human-readable (order.orderNumber)
  orderDate?: string           // ISO string (order.createdAt.toISOString())
  items?: Array<{              // From order.items
    name: string               // item.product?.name || item.productName
    qty: number                // item.quantity
    price: number              // item.price / 100 (converted from paise)
  }>
  totalAmount: number          // order.grossAmount.toNumber()
  currency?: string            // "INR" (default: "₹")
  storeName?: string           // merchant.displayName
}
```

**Email Tags**:
- `type: "order_confirmation"`
- `order_id: {orderId}`

---

### 2. New Order Notification (Merchant)
**File**: `emails/newOrderForMerchant.ts`  
**Function**: `newOrderForMerchantTemplate()`

**Recipient**: Merchant (store owner)  
**Channel**: `orders`  
**Subject**: `New Order Received - {orderNumber}`

**Trigger**:
- **When**: Order created successfully
- **File**: `app/actions/orders.ts:286`
- **Condition**: After order creation (non-blocking, wrapped in try/catch)

**Data Injected**:
```typescript
{
  to: string                   // merchantEmail (from merchant.users[0].email)
  merchantName: string         // merchant.displayName
  orderId: string              // Internal ID (order.id)
  orderNumber: string          // Human-readable (order.orderNumber)
  orderDate?: string           // ISO string (order.createdAt.toISOString())
  customerName: string         // order.customerName
  customerEmail?: string       // customerEmail
  customerPhone?: string       // order.customerPhone
  items?: Array<{              // From order.items
    name: string
    qty: number
    price: number               // Converted from paise
  }>
  totalAmount: number          // order.grossAmount.toNumber()
  currency?: string            // "INR" (default: "₹")
  paymentMethod?: string       // order.payment?.paymentMethod
  adminUrl?: string            // Dashboard order URL
}
```

**Email Tags**:
- `type: "new_order_merchant"`
- `order_id: {orderId}`

---

### 3. Shipment Update (Customer)
**File**: `emails/shipmentUpdate.ts`  
**Function**: `shipmentUpdateTemplate()`

**Recipient**: Customer (order buyer)  
**Channel**: `orders`  
**Subject**: `Your Order {orderNumber} Has Shipped`

**Trigger**:
- **When**: Shipment created or updated
- **Files**: 
  - `app/api/merchant/orders/[orderId]/shipment/route.ts:138`
  - `app/api/merchant/orders/[orderId]/stage/route.ts:154`
- **Condition**: When shipment record is created or order stage changes to SHIPPED

**Data Injected**:
```typescript
{
  to: string                   // order.customerEmail
  customerName: string         // order.customerName
  orderId: string              // Internal ID (order.id)
  orderNumber: string          // Human-readable (order.orderNumber)
  carrier?: string             // shipment.courierName
  trackingId?: string          // shipment.awb
  trackingUrl?: string         // shipment.trackingUrl
  eta?: string                 // Optional ETA string
  storeName?: string           // merchant.displayName
}
```

**Email Tags**:
- `type: "shipment_update"`
- `order_id: {orderId}`

---

### 4. Refund Initiated (Customer)
**File**: `emails/refundInitiated.ts`  
**Function**: `refundInitiatedTemplate()`

**Recipient**: Customer (order buyer)  
**Channel**: `finance`  
**Subject**: `Refund Initiated for Order {orderNumber}`

**Trigger**:
- **When**: Refund is initiated
- **File**: Not found in codebase (template exists but no trigger found)
- **Status**: ⚠️ **NOT IMPLEMENTED** - Template ready but not called

**Data Injected** (when implemented):
```typescript
{
  to: string                   // order.customerEmail
  customerName: string         // order.customerName
  orderId: string              // Internal ID
  orderNumber: string         // Human-readable
  refundAmount: number         // refund.amount
  currency?: string            // Default: "₹"
  refundMode?: string          // Refund method (e.g., "Original Payment Method")
  expectedTimeline?: string    // Expected processing time
  storeName?: string           // merchant.displayName
}
```

**Email Tags**:
- `type: "refund_initiated"`
- `order_id: {orderId}`

---

### 5. Password Reset
**File**: `emails/passwordReset.ts`  
**Function**: `passwordResetTemplate()`

**Recipient**: User (customer or merchant)  
**Channel**: `support`  
**Subject**: `Reset Your Password`

**Trigger**:
- **When**: Password reset requested
- **File**: Not found in codebase
- **Status**: ⚠️ **NOT IMPLEMENTED** - Currently handled by Supabase/Clerk
- **Note**: Template ready for custom password reset flow

**Data Injected** (when implemented):
```typescript
{
  to: string                   // User email
  customerName?: string         // Optional user name
  resetUrl: string             // Password reset link
  expiresInMinutes?: number    // Default: 30
}
```

**Email Tags**:
- `type: "password_reset"`

---

### 6. Payout Processed (Merchant)
**File**: `emails/payoutProcessed.ts`  
**Function**: `payoutProcessedTemplate()`

**Recipient**: Merchant (store owner)  
**Channel**: `finance`  
**Subject**: `Payout Processed - {payoutId}`

**Trigger**:
- **When**: Weekly payout is executed
- **File**: `app/api/jobs/execute-weekly-payouts/route.ts:150`
- **Condition**: After payout batch is created (non-blocking, wrapped in try/catch)

**Data Injected**:
```typescript
{
  to: string                   // merchantUser.email (from merchant.users)
  merchantName: string         // invoice.merchant.displayName
  payoutId: string             // payout.id
  amount: number               // payoutAmount.toNumber()
  currency?: string             // "₹" (default)
  payoutDate?: string           // ISO string (new Date().toISOString())
  bankLast4?: string            // bankAccount.accountNumber.slice(-4)
  settlementRef?: string        // cycle.id
}
```

**Email Tags**:
- `type: "payout_processed"`
- `payout_id: {payoutId}`

---

### 7. Commission Summary (Merchant)
**File**: `emails/commissionSummary.ts`  
**Function**: `commissionSummaryTemplate()`

**Recipient**: Merchant (store owner)  
**Channel**: `finance`  
**Subject**: `Commission Summary - {periodLabel}`

**Trigger**:
- **When**: Commission summary generated
- **File**: Not found in codebase
- **Status**: ⚠️ **NOT IMPLEMENTED** - Template ready but no trigger found

**Data Injected** (when implemented):
```typescript
{
  to: string                   // merchant email
  merchantName: string         // merchant.displayName
  periodLabel: string          // e.g., "January 2024"
  totalOrders: number          // Total orders in period
  grossSales: number           // Total gross sales
  platformFees: number         // Total platform fees
  currency?: string            // Default: "₹"
  downloadUrl?: string         // Optional CSV download link
}
```

**Email Tags**:
- `type: "commission_summary"`
- `period: {periodLabel}`

---

### 8. High Value Order Alert (Internal)
**File**: `emails/internalHighValueOrder.ts`  
**Function**: `internalHighValueOrderTemplate()`

**Recipient**: Ops Team (internal)  
**Channel**: `ops`  
**Subject**: `High Value Order Alert - {orderId}`  
**To**: `OPS_ALERT_TO` env var or `ops@merceton.com`

**Trigger**:
- **When**: Order amount exceeds threshold
- **File**: `app/actions/orders.ts:317`
- **Condition**: `orderAmountInPaise >= HIGH_VALUE_ORDER_THRESHOLD` (default: 50000 paise = ₹500)
- **Timing**: After order creation (non-blocking)

**Data Injected**:
```typescript
{
  orderId: string              // order.id (internal ID)
  storeName: string            // merchant.displayName
  amount: number               // order.grossAmount.toNumber()
  currency?: string            // "INR" (default: "₹")
  customerEmail?: string       // customerEmail
  paymentMode?: string         // order.payment?.paymentMethod
  createdAt?: string            // order.createdAt.toISOString()
  adminUrl?: string            // Admin order URL
}
```

**Email Tags**:
- `type: "ops_high_value_order"`
- `order_id: {orderId}`

---

### 9. Webhook Failure Alert (Internal)
**File**: `emails/internalWebhookFailure.ts`  
**Function**: `internalWebhookFailureTemplate()`

**Recipient**: Ops Team (internal)  
**Channel**: `ops`  
**Subject**: `Webhook Failure: {eventName}`  
**To**: `OPS_ALERT_TO` env var or `ops@merceton.com`

**Trigger**:
- **When**: Webhook processing fails
- **File**: `app/api/webhooks/razorpay/route.ts:153`
- **Condition**: Catch block in webhook handler (non-blocking)

**Data Injected**:
```typescript
{
  eventName: string            // "razorpay.webhook"
  endpoint?: string             // "/api/webhooks/razorpay"
  errorMessage: string          // error.message || String(error)
  occurredAt?: string           // new Date().toISOString()
  requestId?: string            // Optional request ID
  adminUrl?: string             // Admin dashboard URL
}
```

**Email Tags**:
- `type: "ops_webhook_failure"`
- `event: {eventName}`

---

### 10. Refund Threshold Alert (Internal)
**File**: `emails/internalRefundThreshold.ts`  
**Function**: `internalRefundThresholdTemplate()`

**Recipient**: Ops Team (internal)  
**Channel**: `ops`  
**Subject**: `Refund Threshold Alert - {periodLabel}`  
**To**: `OPS_ALERT_TO` env var or `ops@merceton.com`

**Trigger**:
- **When**: Refund total exceeds threshold
- **File**: `app/api/cron/refund-threshold/route.ts:65`
- **Condition**: Cron job checks refund totals, sends alert if threshold breached
- **Default Threshold**: ₹10,000 (configurable via query param)
- **Default Period**: Last 24 hours (configurable via query param)

**Data Injected**:
```typescript
{
  periodLabel: string          // "Last 24h" or "Last {N}h"
  refundCount: number          // Number of refunds in period
  refundTotal: number          // Total refund amount
  threshold: number            // Threshold amount (default: 10000)
  currency?: string            // "₹" (default)
  adminUrl?: string            // Admin dashboard URL
}
```

**Email Tags**:
- `type: "ops_refund_threshold"`
- `period: {periodLabel}`

---

### 11. New Merchant Signup Alert (Internal)
**File**: `emails/internalNewMerchantSignup.ts`  
**Function**: `internalNewMerchantSignupTemplate()`

**Recipient**: Ops Team (internal)  
**Channel**: `ops`  
**Subject**: `New Merchant Signup: {merchantName}`  
**To**: `OPS_ALERT_TO` env var or `ops@merceton.com`

**Trigger**:
- **When**: New merchant signs up
- **File**: `app/api/merchant/setup/route.ts:171`
- **Condition**: After merchant creation (non-blocking, wrapped in try/catch)

**Data Injected**:
```typescript
{
  merchantName: string         // result.merchant.displayName
  merchantEmail: string        // userWithMerchant?.email || result.user?.email
  createdAt?: string           // result.merchant.createdAt.toISOString()
  planName?: string            // Optional pricing package name
  adminUrl?: string            // Admin merchant URL
}
```

**Email Tags**:
- `type: "ops_new_merchant"`
- `merchant_email: {merchantEmail}`

---

## Email Trigger Summary

### ✅ Implemented Triggers

| Template | Trigger Location | Condition |
|----------|-----------------|-----------|
| **Order Confirmation** | `app/actions/orders.ts:259` | Order created |
| **New Order (Merchant)** | `app/actions/orders.ts:286` | Order created |
| **High Value Order** | `app/actions/orders.ts:317` | Order amount ≥ threshold |
| **Shipment Update** | `app/api/merchant/orders/[orderId]/shipment/route.ts:138` | Shipment created |
| **Shipment Update** | `app/api/merchant/orders/[orderId]/stage/route.ts:154` | Order stage = SHIPPED |
| **Payout Processed** | `app/api/jobs/execute-weekly-payouts/route.ts:150` | Payout batch created |
| **Webhook Failure** | `app/api/webhooks/razorpay/route.ts:153` | Webhook error |
| **Refund Threshold** | `app/api/cron/refund-threshold/route.ts:65` | Refund total ≥ threshold |
| **New Merchant Signup** | `app/api/merchant/setup/route.ts:171` | Merchant created |

### ⚠️ Not Implemented (Templates Exist)

| Template | Status | Notes |
|----------|--------|-------|
| **Refund Initiated** | Template ready | No trigger found - refund processing not implemented |
| **Password Reset** | Template ready | Handled by Supabase/Clerk - ready for custom flow |
| **Commission Summary** | Template ready | No trigger found - commission summary not implemented |

---

## Recipient Categories

### Customer Emails
- **Order Confirmation** → Customer email (from order)
- **Shipment Update** → Customer email (from order)
- **Refund Initiated** → Customer email (from order) ⚠️ Not triggered

### Merchant Emails
- **New Order Notification** → Merchant admin email (from merchant.users[0].email)
- **Payout Processed** → Merchant admin email (from merchant.users)
- **Commission Summary** → Merchant email ⚠️ Not triggered

### Internal Emails (Ops Team)
- **High Value Order Alert** → `OPS_ALERT_TO` or `ops@merceton.com`
- **Webhook Failure Alert** → `OPS_ALERT_TO` or `ops@merceton.com`
- **Refund Threshold Alert** → `OPS_ALERT_TO` or `ops@merceton.com`
- **New Merchant Signup Alert** → `OPS_ALERT_TO` or `ops@merceton.com`

---

## Data Injection Patterns

### Order Data
- **orderId**: Internal Prisma ID (for tracking/logging)
- **orderNumber**: Human-readable order number (for display)
- **orderDate**: ISO string from `order.createdAt.toISOString()`
- **items**: Array mapped from `order.items` with price conversion (paise → INR)
- **totalAmount**: `order.grossAmount.toNumber()` (Decimal → number)

### Merchant Data
- **merchantName**: `merchant.displayName`
- **merchantEmail**: From `merchant.users[0].email` or `merchant.users.find(u => u.role === "ADMIN")`

### Customer Data
- **customerName**: `order.customerName`
- **customerEmail**: From order creation input
- **customerPhone**: `order.customerPhone` (optional)

### Financial Data
- **amount**: Always converted from Decimal to number using `.toNumber()`
- **currency**: Default "₹" or "INR"
- **price**: Converted from paise to INR (divide by 100)

### URL Generation
- **adminUrl**: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${order.id}`
- **adminUrl (internal)**: `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${order.id}`

---

## Error Handling

### Non-Blocking Pattern
All email sends are wrapped in try/catch blocks and do NOT fail the main operation:

```typescript
try {
  await sendOrderConfirmationEmailToCustomer({...})
  console.log(`[email][customer] orderId=${order.orderNumber}`)
} catch (emailError) {
  // Log but don't fail order creation
  console.error(`[email][customer] Failed to send...`, emailError)
}
```

### Email Logging
- ✅ Console logs for successful sends
- ✅ Console errors for failed sends
- ⚠️ **No persistent email log table** (TODO in `lib/email/notifications.ts:16`)

---

## Environment Variables

### Required
- `RESEND_API_KEY` - Resend API key

### Optional (with defaults)
- `EMAIL_FROM_ORDERS` - Default: `"merceton Orders <no-reply@merceton.com>"`
- `EMAIL_FROM_SUPPORT` - Default: `"Merceton Support <support@merceton.com>"`
- `EMAIL_FROM_FINANCE` - Default: `"Merceton Finance <billing@merceton.com>"`
- `EMAIL_FROM_OPS` - Default: `"Merceton Ops <ops@merceton.com>"`
- `OPS_ALERT_TO` - Default: `"ops@merceton.com"`
- `HIGH_VALUE_ORDER_THRESHOLD` - Default: `"50000"` (paise = ₹500)
- `NEXT_PUBLIC_APP_URL` - For generating admin URLs

---

## Missing Features

### 1. Email Logging
- **Status**: TODO in code (`lib/email/notifications.ts:16`)
- **Need**: Persist email logs to DB (status, type, recipient, entityId, error)

### 2. Refund Email Trigger
- **Status**: Template exists, no trigger
- **Need**: Call `sendRefundInitiatedEmail()` when refund is processed

### 3. Commission Summary Trigger
- **Status**: Template exists, no trigger
- **Need**: Implement commission summary generation and email trigger

### 4. Password Reset Custom Flow
- **Status**: Template exists, handled by Supabase/Clerk
- **Need**: Custom password reset flow if needed

### 5. Email Unsubscribe
- **Status**: Not implemented
- **Need**: Unsubscribe mechanism for transactional emails

### 6. Email Bounce Handling
- **Status**: Not implemented
- **Need**: Handle bounced emails and update user records

---

## Summary

### ✅ Working
- 9 email templates implemented
- 9 triggers active
- Non-blocking error handling
- Channel-based sender configuration
- Email tagging for analytics

### ⚠️ Gaps
- 3 templates not triggered (refund, password reset, commission summary)
- No email logging to DB
- No bounce handling
- No unsubscribe mechanism

### 📊 Email Volume Estimates
- **Customer**: ~2 emails per order (confirmation + shipment)
- **Merchant**: ~1 email per order (new order) + 1 per payout
- **Internal**: ~1 per high-value order + alerts for failures/thresholds
