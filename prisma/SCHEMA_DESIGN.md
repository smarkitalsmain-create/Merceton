# Prisma Schema Design - Multi-Tenant Ecommerce SaaS

## Overview

This schema implements a multi-tenant ecommerce platform where each merchant (tenant) has completely isolated data. All queries are scoped by `merchantId` to ensure data isolation.

## Key Design Principles

1. **Multi-tenant isolation**: Every record (except Merchant and User) is scoped to `merchantId`
2. **Separation of concerns**: User authentication, payments, and ledger entries are separate models
3. **Flexible payments**: Supports Razorpay, COD, and UPI payment methods
4. **Audit trail**: Ledger entries track all financial transactions (fees and payouts)
5. **Human-readable IDs**: Order numbers are unique per merchant and human-readable

## Entity Relationships

```
Merchant (Tenant)
├── User (1:N) - Multiple users per merchant
├── StorefrontSettings (1:1) - Storefront configuration
├── Product (1:N) - Products catalog
│   └── ProductImage (1:N) - Multiple images per product
├── Order (1:N) - Customer orders
│   ├── OrderItem (1:N) - Order line items
│   └── Payment (1:1) - Payment record
├── LedgerEntry (1:N) - Financial ledger entries
└── PayoutBatch (1:N) - Batch payouts
```

## Model Details

### Merchant (Tenant)
- **Purpose**: Root tenant entity
- **Key fields**: `slug` (unique), `displayName`, `isActive`
- **Isolation**: All other entities reference `merchantId`

### User
- **Purpose**: Links auth provider (Clerk) to merchant
- **Key fields**: `authUserId` (unique), `merchantId`, `role`, `email`
- **Note**: One auth user can only belong to one merchant (via unique `authUserId`)

### StorefrontSettings
- **Purpose**: Storefront configuration (one per merchant)
- **Key fields**: `logoUrl`, `theme` (default: "minimal")
- **Relation**: One-to-one with Merchant

### Product
- **Purpose**: Product catalog
- **Key fields**: `name`, `price`, `stock` (simple inventory)
- **Isolation**: Scoped to `merchantId`
- **Images**: Separate `ProductImage` model for multiple images

### ProductImage
- **Purpose**: Multiple images per product
- **Key fields**: `url`, `alt`, `sortOrder`
- **Note**: Images are ordered by `sortOrder` for display

### Order
- **Purpose**: Customer orders
- **Key fields**: `orderNumber` (unique per merchant), customer info, `status`
- **Isolation**: Scoped to `merchantId`
- **Order Number**: Format `ORD-YYYY-XXX` (e.g., `ORD-2024-001`)
- **Note**: No payment fields - payment is separate model

### OrderItem
- **Purpose**: Order line items
- **Key fields**: `quantity`, `price` (snapshot at order time)
- **Note**: Price is stored to handle price changes

### Payment
- **Purpose**: Payment records (supports Razorpay, COD, UPI)
- **Key fields**: `paymentMethod`, `status`, `amount`
- **Razorpay fields**: `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`
- **COD fields**: `codCollected`, `codCollectedAt`
- **UPI fields**: `upiTransactionId`
- **Relation**: One-to-one with Order

### LedgerEntry
- **Purpose**: Financial ledger for platform fees and payouts
- **Key fields**: `type` (PLATFORM_FEE, ORDER_PAYOUT, PAYOUT_PROCESSED), `amount`, `status`
- **Types**:
  - `PLATFORM_FEE`: Negative amount (deducted from order)
  - `ORDER_PAYOUT`: Positive amount (to be paid to merchant)
  - `PAYOUT_PROCESSED`: Negative amount (payout completed)
- **Relation**: Linked to Order and optional PayoutBatch

### PayoutBatch
- **Purpose**: Groups ledger entries for batch processing
- **Key fields**: `totalAmount`, `status`, `razorpayPayoutId`
- **Note**: Optional in MVP, but included for future scalability

## Index Strategy

See `INDEX_EXPLANATION.md` for detailed index documentation.

Key indexing patterns:
- **Composite indexes** for common queries: `[merchantId, status]`, `[merchantId, createdAt]`
- **Unique constraints** for data integrity: `[merchantId, orderNumber]`
- **Foreign key indexes** for JOIN performance: `[merchantId]`, `[orderId]`, `[productId]`

## Payment Methods

### RAZORPAY
- Online payment gateway
- Requires: `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`
- Status flow: `PENDING` → `PAID` (after verification)

### COD (Cash on Delivery)
- Payment on delivery
- Requires: `codCollected`, `codCollectedAt`
- Status flow: `PENDING` → `PAID` (when collected)

### UPI
- UPI payment (future implementation)
- Requires: `upiTransactionId`
- Status flow: `PENDING` → `PAID`

## Platform Fee Calculation

Platform fee is calculated per order and stored in `LedgerEntry`:
1. **PLATFORM_FEE** entry: Negative amount (e.g., -₹50 for 5% of ₹1000)
2. **ORDER_PAYOUT** entry: Positive amount (e.g., ₹950 = ₹1000 - ₹50)

When payment is confirmed:
- Both entries move to `PROCESSING` status
- Can be batched into `PayoutBatch` for processing

## Data Isolation

All queries MUST include `merchantId` filter:

```typescript
// ✅ Correct
const products = await prisma.product.findMany({
  where: { merchantId: merchant.id }
})

// ❌ Wrong - exposes all merchants' data
const products = await prisma.product.findMany()
```

## Migration Notes

When migrating from old schema:
1. `Merchant.clerkUserId` → `User.authUserId`
2. `Merchant.storeName` → `Merchant.displayName`
3. `Merchant.storeSlug` → `Merchant.slug`
4. `Product.imageUrl` → `ProductImage.url` (multiple images)
5. `Order.paymentStatus` → `Payment.status`
6. `Order.totalAmount` → Calculate from `OrderItem` or use `Payment.amount`
7. `PayoutLedger` → `LedgerEntry` (with type field)

## Seed Data

The seed script creates:
- 1 merchant: `demo-store`
- 1 admin user: `demo_user_123`
- 6 products with images (using placeholder URLs)

Run with: `npm run db:seed`
