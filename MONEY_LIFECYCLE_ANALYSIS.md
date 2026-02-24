# Money Lifecycle Analysis

Complete analysis of payment, ledger, and payout flows with identified security gaps.

---

## Money Lifecycle Flow

### 1. Order Created
**File**: `app/actions/orders.ts` - `createOrder()`

**What Happens**:
1. Order created with `status: PENDING` (or `PLACED` for COD)
2. Payment record created with `status: CREATED` (or `PENDING` for COD)
3. **Three ledger entries created immediately** (status: `PENDING`):
   - `GROSS_ORDER_VALUE` (+amount) - Credit entry
   - `PLATFORM_FEE` (-fee) - Debit entry
   - `ORDER_PAYOUT` (+net) - Credit entry (net payable to merchant)

**Code**:
```typescript
// app/actions/orders.ts:186-213
await tx.ledgerEntry.createMany({
  data: [
    {
      merchantId: merchant.id,
      orderId: newOrder.id,
      type: "GROSS_ORDER_VALUE",
      amount: new Decimal(grossAmountInInr), // Positive
      status: "PENDING",
    },
    {
      merchantId: merchant.id,
      orderId: newOrder.id,
      type: "PLATFORM_FEE",
      amount: new Decimal(platformFeeInInr * -1), // Negative
      status: "PENDING",
    },
    {
      merchantId: merchant.id,
      orderId: newOrder.id,
      type: "ORDER_PAYOUT",
      amount: new Decimal(netPayableInInr), // Positive
      status: "PENDING",
    },
  ],
})
```

**Key Points**:
- ✅ Ledger entries created atomically in same transaction
- ✅ Platform fee calculated using effective fee config (package + overrides)
- ⚠️ **Ledger entries created BEFORE payment is verified** (status: PENDING)
- ⚠️ **No validation that ledger entries sum to zero** (GROSS - FEE = PAYOUT)

---

### 2. Payment Created (Razorpay)
**File**: `app/api/payments/create-razorpay-order/route.ts`

**What Happens**:
1. Client calls `/api/payments/create-razorpay-order` with `orderId`
2. System finds order and payment record
3. Validates payment method is `RAZORPAY` and status is `CREATED`
4. Creates Razorpay order via Razorpay API
5. Updates payment record with `razorpayOrderId`

**Code**:
```typescript
// app/api/payments/create-razorpay-order/route.ts:78-93
const razorpayOrder = await razorpay.orders.create({
  amount: Math.round(order.payment.amount.toNumber() * 100), // Convert to paise
  currency: "INR",
  receipt: order.orderNumber,
  notes: {
    orderId: order.id,
    merchantId: order.merchantId,
    storeSlug: order.merchant.slug,
  },
})

await prisma.payment.update({
  where: { id: order.payment.id },
  data: { razorpayOrderId: razorpayOrder.id },
})
```

**Key Points**:
- ✅ Prevents duplicate Razorpay order creation (checks if `razorpayOrderId` exists)
- ✅ Validates payment method and status
- 🔴 **CRITICAL: No tenant isolation check** - Anyone with `orderId` can create Razorpay order
- 🔴 **CRITICAL: No authentication required** - Public endpoint
- ⚠️ **No validation that amount matches order amount**

---

### 3. Payment Verified
**Files**: 
- `app/api/payments/verify/route.ts` (client-side verification)
- `app/api/webhooks/razorpay/route.ts` (webhook verification)

**What Happens**:

#### A. Client-Side Verification (`/api/payments/verify`)
1. Client calls with `orderId`, `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`
2. System verifies HMAC signature
3. Validates `razorpayOrderId` matches payment record
4. **Updates payment status to `PAID`**
5. **Updates order status to `CONFIRMED`**
6. **Updates ledger entries from `PENDING` → `PROCESSING`**

**Code**:
```typescript
// app/api/payments/verify/route.ts:98-120
await prisma.$transaction([
  prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "PAID",
      razorpayPaymentId,
      razorpaySignature,
    },
  }),
  prisma.order.update({
    where: { id: order.id },
    data: { status: "CONFIRMED" },
  }),
  prisma.ledgerEntry.updateMany({
    where: {
      orderId: order.id,
      status: "PENDING",
    },
    data: { status: "PROCESSING" },
  }),
])
```

#### B. Webhook Verification (`/api/webhooks/razorpay`)
1. Razorpay sends webhook with `payment.captured` event
2. System verifies webhook signature (HMAC)
3. Validates amount matches
4. **Same updates as client-side verification** (idempotent)

**Code**:
```typescript
// app/api/webhooks/razorpay/route.ts:95-117
await prisma.$transaction([
  prisma.payment.update({
    where: { id: dbPayment.id },
    data: {
      status: "PAID",
      razorpayPaymentId: payment.id,
      razorpaySignature: payment.notes?.signature || null,
    },
  }),
  prisma.order.update({
    where: { id: dbPayment.orderId },
    data: { status: "CONFIRMED" },
  }),
  prisma.ledgerEntry.updateMany({
    where: {
      orderId: dbPayment.orderId,
      status: "PENDING",
    },
    data: { status: "PROCESSING" },
  }),
])
```

**Key Points**:
- ✅ Signature verification (HMAC)
- ✅ Prevents duplicate processing (checks `status === "PAID"`)
- ✅ Idempotent (webhook and client-side can both run safely)
- ✅ Amount validation (webhook only)
- 🔴 **CRITICAL: No tenant isolation check** - Anyone with `orderId` can verify payment
- 🔴 **CRITICAL: No authentication required** - Public endpoint
- ⚠️ **Ledger entries move to `PROCESSING` but never to `COMPLETED`** (missing step)

---

### 4. Ledger Entries Status Flow

**Current Flow**:
```
PENDING → PROCESSING → (missing: COMPLETED)
```

**What Should Happen**:
1. Order created → Ledger entries: `PENDING`
2. Payment verified → Ledger entries: `PROCESSING`
3. **Missing**: Ledger entries should move to `COMPLETED` when:
   - Order is delivered (or after hold period)
   - Payout is processed

**Current Issue**:
- ⚠️ **Ledger entries never reach `COMPLETED` status**
- ⚠️ **No clear definition of when entries are "settled"**
- ⚠️ **Payout eligibility not clearly tied to ledger entry status**

---

### 5. Platform Fee Calculation
**File**: `lib/fees.ts` - `calculatePlatformFee()`

**Formula**:
```typescript
fee = (gross × percentage_bps / 10000) + flat_fee
if fee > max_cap: fee = max_cap
if fee > gross: fee = gross (never exceed gross)
net = gross - fee
```

**Fee Config Source**:
- `lib/pricing.ts` - `getEffectiveFeeConfig()` - Gets package + merchant overrides
- `lib/fees.ts` - `getEffectiveFeeConfigForFees()` - Converts to legacy format

**Key Points**:
- ✅ Fee calculated at order creation (atomic)
- ✅ Fee config supports percentage + flat + cap
- ✅ Fee cannot exceed gross amount
- ✅ Uses effective config (package + merchant overrides)
- ⚠️ **No validation that fee calculation is correct** (no unit tests visible)
- ⚠️ **Fee config can change after order creation** (but fee is locked at creation)

---

### 6. Payout Eligibility
**File**: `app/api/jobs/execute-weekly-payouts/route.ts`

**What Happens**:
1. Cron job runs every Friday
2. Finds latest `INVOICED` settlement cycle
3. For each merchant with invoice:
   - Calculates total `netPayable` from paid orders in period
   - Deducts platform invoice total
   - Creates `PayoutBatch` if amount > 0
   - Links to `PlatformInvoice` and `PlatformSettlementCycle`

**Code**:
```typescript
// app/api/jobs/execute-weekly-payouts/route.ts:70-98
const orders = await prisma.order.findMany({
  where: {
    merchantId: invoice.merchantId,
    createdAt: {
      gte: cycle.periodStart,
      lte: cycle.periodEnd,
    },
    payment: { status: "PAID" },
    stage: { not: "CANCELLED" },
  },
  select: {
    grossAmount: true,
    platformFee: true,
    netPayable: true,
  },
})

let totalNetPayable = new Decimal(0)
for (const order of orders) {
  totalNetPayable = totalNetPayable.add(order.netPayable || 0)
}

const payoutAmount = totalNetPayable.sub(invoice.total)
```

**Key Points**:
- ✅ Only includes paid orders (payment.status === "PAID")
- ✅ Excludes cancelled orders (stage !== "CANCELLED")
- ✅ Deducts platform invoice from net payable
- ⚠️ **Uses `order.netPayable` field, not ledger entries** (inconsistent source of truth)
- ⚠️ **No validation that ledger entries match order totals**
- ⚠️ **No hold period** (orders can be paid out immediately after payment)
- ⚠️ **No check for refunds** (refunded orders might still be included)

---

### 7. Refunds
**Current State**: **NOT IMPLEMENTED**

**What Should Happen**:
1. Refund created → `Refund` record with `status: PENDING`
2. Refund processed → `Refund.status = COMPLETED`
3. **Reverse ledger entries**:
   - Create negative `GROSS_ORDER_VALUE` entry
   - Create positive `PLATFORM_FEE` entry (refund fee)
   - Create negative `ORDER_PAYOUT` entry
4. **Update order** → Mark as refunded
5. **Update payout eligibility** → Exclude refunded orders

**Current Code**:
- `prisma/schema.prisma` - `Refund` model exists
- `app/api/cron/refund-threshold/route.ts` - Only monitors refund totals (alert)
- **No refund processing logic found**

**Key Points**:
- 🔴 **CRITICAL: Refunds not integrated into ledger**
- 🔴 **CRITICAL: Refunded orders still counted in payouts**
- 🔴 **CRITICAL: No reversal of platform fee on refund**
- ⚠️ **Refund model exists but no processing logic**

---

## Missing Safeguards

### 🔴 CRITICAL Issues

#### 1. Payment Routes Missing Tenant Isolation
**Files**:
- `app/api/payments/create-razorpay-order/route.ts`
- `app/api/payments/verify/route.ts`

**Issue**: No authentication or tenant validation

**Risk**:
- Attacker can create Razorpay orders for any merchant's orders
- Attacker can verify payments for any merchant's orders
- Could lead to payment fraud or unauthorized access

**Fix Required**:
```typescript
// Option A: Public API (storefront) - validate via storeSlug
const { orderId, storeSlug } = body
const order = await prisma.order.findFirst({
  where: {
    id: orderId,
    merchant: { slug: storeSlug, isActive: true },
  },
})

// Option B: Authenticated API - use authorizeRequest()
const { merchant } = await authorizeRequest()
const order = await prisma.order.findFirst({
  where: {
    id: orderId,
    merchantId: merchant.id,
  },
})
```

#### 2. Refunds Not Integrated
**Issue**: Refunds exist in schema but no processing logic

**Risk**:
- Refunded orders still counted in payouts
- Platform fees not reversed on refund
- Financial discrepancies

**Fix Required**:
```typescript
// When refund is processed:
// 1. Create reverse ledger entries
await prisma.ledgerEntry.createMany({
  data: [
    {
      type: "GROSS_ORDER_VALUE",
      amount: -order.grossAmount, // Negative
      status: "COMPLETED",
    },
    {
      type: "PLATFORM_FEE",
      amount: order.platformFee, // Positive (reverse fee)
      status: "COMPLETED",
    },
    {
      type: "ORDER_PAYOUT",
      amount: -order.netPayable, // Negative
      status: "COMPLETED",
    },
  ],
})

// 2. Mark order as refunded
// 3. Exclude from future payouts
```

#### 3. Ledger Entries Never Reach COMPLETED
**Issue**: Ledger entries stay in `PROCESSING` status forever

**Risk**:
- Unclear when entries are "settled"
- Payout eligibility not clearly defined
- Accounting confusion

**Fix Required**:
```typescript
// When order is delivered (or after hold period):
await prisma.ledgerEntry.updateMany({
  where: {
    orderId: order.id,
    status: "PROCESSING",
  },
  data: { status: "COMPLETED" },
})

// Or when payout is processed:
await prisma.ledgerEntry.updateMany({
  where: {
    payoutBatchId: payout.id,
    status: "PROCESSING",
  },
  data: { status: "COMPLETED" },
})
```

### 🟡 MEDIUM Issues

#### 4. Payout Uses Order Fields, Not Ledger Entries
**Issue**: Payout calculation uses `order.netPayable` instead of summing ledger entries

**Risk**:
- Inconsistency if order fields don't match ledger
- No single source of truth
- Harder to audit

**Fix Required**:
```typescript
// Calculate from ledger entries instead:
const ledgerEntries = await prisma.ledgerEntry.findMany({
  where: {
    merchantId: invoice.merchantId,
    orderId: { in: orderIds },
    type: "ORDER_PAYOUT",
    status: "COMPLETED", // Or PROCESSING
  },
})

let totalNetPayable = new Decimal(0)
for (const entry of ledgerEntries) {
  totalNetPayable = totalNetPayable.add(entry.amount)
}
```

#### 5. No Hold Period for Payouts
**Issue**: Orders can be paid out immediately after payment

**Risk**:
- Chargebacks not accounted for
- Refunds processed after payout
- Financial losses

**Fix Required**:
```typescript
// Add hold period (e.g., 7 days):
const holdPeriodDays = 7
const eligibleDate = new Date()
eligibleDate.setDate(eligibleDate.getDate() - holdPeriodDays)

const orders = await prisma.order.findMany({
  where: {
    payment: { status: "PAID" },
    payment: { updatedAt: { lte: eligibleDate } }, // After hold period
    stage: { not: "CANCELLED" },
  },
})
```

#### 6. No Validation of Ledger Entry Totals
**Issue**: No check that GROSS - FEE = PAYOUT

**Risk**:
- Accounting errors
- Financial discrepancies
- Hard to detect bugs

**Fix Required**:
```typescript
// After creating ledger entries:
const entries = await prisma.ledgerEntry.findMany({
  where: { orderId: newOrder.id },
})

const gross = entries.find(e => e.type === "GROSS_ORDER_VALUE")?.amount || 0
const fee = Math.abs(entries.find(e => e.type === "PLATFORM_FEE")?.amount || 0)
const payout = entries.find(e => e.type === "ORDER_PAYOUT")?.amount || 0

if (gross - fee !== payout) {
  throw new Error("Ledger entries don't balance")
}
```

#### 7. No Amount Validation in Payment Creation
**Issue**: `create-razorpay-order` doesn't validate amount matches order

**Risk**:
- Amount mismatch between order and Razorpay order
- Payment fraud

**Fix Required**:
```typescript
// Validate amount before creating Razorpay order:
const expectedAmount = Math.round(order.payment.amount.toNumber() * 100)
// (Already done in webhook, but not in create-razorpay-order)
```

### 🟢 LOW Issues

#### 8. No Reconciliation Job
**Issue**: No automated check that ledger entries match order totals

**Fix**: Create cron job to reconcile:
```typescript
// app/api/jobs/reconcile-ledger/route.ts
// For each order:
// 1. Sum ledger entries by type
// 2. Compare to order.grossAmount, order.platformFee, order.netPayable
// 3. Alert if mismatch
```

#### 9. No Payout Reversal on Refund
**Issue**: If order is refunded after payout, no reversal logic

**Fix**: Implement payout reversal:
```typescript
// When refund is processed after payout:
// 1. Create negative payout ledger entry
// 2. Update payout batch total
// 3. Create reversal transaction
```

#### 10. COD Payment Flow Incomplete
**Issue**: COD orders create ledger entries but payment status stays `PENDING`

**Fix**: Implement COD collection flow:
```typescript
// When COD is collected:
// 1. Update payment.status = "PAID"
// 2. Update ledger entries: PENDING → PROCESSING
// 3. Update order.status = "CONFIRMED"
```

---

## Summary

### ✅ What's Working
1. **Order Creation**: Atomic transaction with ledger entries
2. **Fee Calculation**: Correct formula with config support
3. **Payment Verification**: Signature verification and idempotency
4. **Webhook Handling**: Secure signature verification
5. **Payout Calculation**: Basic logic exists

### 🔴 Critical Gaps
1. **Payment Routes**: Missing tenant isolation (HIGH RISK)
2. **Refunds**: Not integrated into ledger (HIGH RISK)
3. **Ledger Status**: Never reaches COMPLETED (MEDIUM RISK)

### 🟡 Medium Gaps
1. **Payout Source**: Uses order fields instead of ledger
2. **Hold Period**: No hold period for payouts
3. **Validation**: No ledger entry balance checks

### 🟢 Low Priority
1. **Reconciliation**: No automated reconciliation
2. **Payout Reversal**: No reversal on refunds
3. **COD Flow**: Incomplete COD collection

---

## Recommended Fix Priority

1. **IMMEDIATE**: Fix payment route tenant isolation
2. **IMMEDIATE**: Implement refund processing with ledger reversal
3. **HIGH**: Add ledger entry status flow (PENDING → PROCESSING → COMPLETED)
4. **HIGH**: Add hold period for payouts
5. **MEDIUM**: Switch payout calculation to use ledger entries
6. **MEDIUM**: Add ledger entry balance validation
7. **LOW**: Add reconciliation job
8. **LOW**: Complete COD flow
