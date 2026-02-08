# Prisma Schema Indexes Explanation

This document explains why each index exists in the multi-tenant ecommerce schema.

## Index Strategy

All indexes are designed for:
1. **Multi-tenant isolation**: Fast filtering by `merchantId`
2. **Query performance**: Optimize common query patterns
3. **Data integrity**: Support unique constraints

---

## Merchant Table

### `@@index([slug])`
- **Purpose**: Fast lookup by slug for storefront routes
- **Query**: `WHERE slug = 'demo-store'`
- **Frequency**: High (every storefront page load)
- **Why**: Storefront routes use slug, not ID

### `@@index([isActive])`
- **Purpose**: Filter active merchants
- **Query**: `WHERE isActive = true`
- **Frequency**: Medium (admin queries, storefront checks)
- **Why**: Only show active merchants in public storefronts

---

## User Table

### `@@unique([authUserId])`
- **Purpose**: One auth user maps to one User record
- **Query**: `WHERE authUserId = 'clerk_xxx'`
- **Frequency**: High (every authenticated request)
- **Why**: Prevent duplicate user records, fast auth lookups

### `@@index([merchantId])`
- **Purpose**: Fast lookup of users by merchant
- **Query**: `WHERE merchantId = 'xxx'`
- **Frequency**: Medium (admin user management)
- **Why**: List all users for a merchant

### `@@index([authUserId])`
- **Purpose**: Fast auth user lookup (redundant with unique, but helps joins)
- **Query**: `WHERE authUserId = 'clerk_xxx'`
- **Frequency**: High (every authenticated request)
- **Why**: Optimize auth middleware lookups

### `@@index([merchantId, isActive])`
- **Purpose**: Filter active users per merchant
- **Query**: `WHERE merchantId = 'xxx' AND isActive = true`
- **Frequency**: Medium (permission checks)
- **Why**: Composite index for common filter pattern

---

## StorefrontSettings Table

### `@@index([merchantId])`
- **Purpose**: Fast lookup (though unique, helps joins)
- **Query**: `WHERE merchantId = 'xxx'`
- **Frequency**: High (every storefront page load)
- **Why**: One-to-one relation, but index helps JOIN performance

---

## Product Table

### `@@index([merchantId])`
- **Purpose**: Fast lookup of products by merchant
- **Query**: `WHERE merchantId = 'xxx'`
- **Frequency**: High (storefront catalog, dashboard)
- **Why**: All product queries are scoped to merchant

### `@@index([merchantId, isActive])`
- **Purpose**: Filter active products per merchant
- **Query**: `WHERE merchantId = 'xxx' AND isActive = true`
- **Frequency**: High (storefront catalog)
- **Why**: Only show active products in storefront

### `@@index([merchantId, createdAt])`
- **Purpose**: Sort by newest per merchant
- **Query**: `WHERE merchantId = 'xxx' ORDER BY createdAt DESC`
- **Frequency**: Medium (dashboard product lists)
- **Why**: Common sorting pattern in merchant dashboard

---

## ProductImage Table

### `@@index([productId])`
- **Purpose**: Fast lookup of images by product
- **Query**: `WHERE productId = 'xxx'`
- **Frequency**: High (product detail pages)
- **Why**: Load all images for a product

### `@@index([productId, sortOrder])`
- **Purpose**: Sort images by order
- **Query**: `WHERE productId = 'xxx' ORDER BY sortOrder ASC`
- **Frequency**: High (product detail pages)
- **Why**: Display images in correct order

---

## Order Table

### `@@unique([merchantId, orderNumber])`
- **Purpose**: Unique order number per merchant
- **Query**: `WHERE merchantId = 'xxx' AND orderNumber = 'ORD-001'`
- **Frequency**: High (order lookups)
- **Why**: Prevent duplicate order numbers, fast lookups

### `@@index([merchantId])`
- **Purpose**: Fast lookup of orders by merchant
- **Query**: `WHERE merchantId = 'xxx'`
- **Frequency**: High (merchant dashboard)
- **Why**: All order queries are scoped to merchant

### `@@index([merchantId, status])`
- **Purpose**: Filter orders by status per merchant
- **Query**: `WHERE merchantId = 'xxx' AND status = 'PENDING'`
- **Frequency**: High (dashboard filters)
- **Why**: Common filter pattern (pending, confirmed, etc.)

### `@@index([merchantId, createdAt])`
- **Purpose**: Sort by date per merchant
- **Query**: `WHERE merchantId = 'xxx' ORDER BY createdAt DESC`
- **Frequency**: High (dashboard order lists)
- **Why**: Show newest orders first

### `@@index([orderNumber])`
- **Purpose**: Fast lookup by order number (for customer queries)
- **Query**: `WHERE orderNumber = 'ORD-001'`
- **Frequency**: Medium (customer order tracking)
- **Why**: Customers search by order number (not merchantId)

---

## OrderItem Table

### `@@index([orderId])`
- **Purpose**: Fast lookup of items by order
- **Query**: `WHERE orderId = 'xxx'`
- **Frequency**: High (order detail pages)
- **Why**: Load all items for an order

### `@@index([productId])`
- **Purpose**: Track product sales
- **Query**: `WHERE productId = 'xxx'`
- **Frequency**: Low (analytics, but useful for future features)
- **Why**: Analyze which products sell most

---

## Payment Table

### `@@index([merchantId])`
- **Purpose**: Fast lookup of payments by merchant
- **Query**: `WHERE merchantId = 'xxx'`
- **Frequency**: Medium (dashboard payment lists)
- **Why**: All payment queries are scoped to merchant

### `@@index([merchantId, status])`
- **Purpose**: Filter payments by status per merchant
- **Query**: `WHERE merchantId = 'xxx' AND status = 'PAID'`
- **Frequency**: Medium (dashboard filters)
- **Why**: Common filter pattern

### `@@index([orderId])`
- **Purpose**: Fast lookup by order (though unique, helps joins)
- **Query**: `WHERE orderId = 'xxx'`
- **Frequency**: High (order detail pages)
- **Why**: Load payment info for an order

### `@@index([razorpayOrderId])`
- **Purpose**: Fast Razorpay order lookup
- **Query**: `WHERE razorpayOrderId = 'order_xxx'`
- **Frequency**: Medium (webhook processing)
- **Why**: Razorpay webhooks send order ID, need fast lookup

### `@@index([razorpayPaymentId])`
- **Purpose**: Fast Razorpay payment lookup
- **Query**: `WHERE razorpayPaymentId = 'pay_xxx'`
- **Frequency**: Medium (webhook processing, payment verification)
- **Why**: Razorpay webhooks send payment ID

### `@@index([merchantId, createdAt])`
- **Purpose**: Sort by date per merchant
- **Query**: `WHERE merchantId = 'xxx' ORDER BY createdAt DESC`
- **Frequency**: Medium (dashboard payment lists)
- **Why**: Show newest payments first

---

## LedgerEntry Table

### `@@index([merchantId])`
- **Purpose**: Fast lookup of ledger entries by merchant
- **Query**: `WHERE merchantId = 'xxx'`
- **Frequency**: High (merchant payout dashboard)
- **Why**: All ledger queries are scoped to merchant

### `@@index([merchantId, type])`
- **Purpose**: Filter by type per merchant
- **Query**: `WHERE merchantId = 'xxx' AND type = 'PLATFORM_FEE'`
- **Frequency**: Medium (analytics, reporting)
- **Why**: Separate platform fees from payouts

### `@@index([merchantId, status])`
- **Purpose**: Filter by status per merchant
- **Query**: `WHERE merchantId = 'xxx' AND status = 'PENDING'`
- **Frequency**: High (payout processing)
- **Why**: Find pending entries for payout batches

### `@@index([orderId])`
- **Purpose**: Fast lookup by order
- **Query**: `WHERE orderId = 'xxx'`
- **Frequency**: Medium (order detail pages)
- **Why**: Show ledger entries for an order

### `@@index([payoutBatchId])`
- **Purpose**: Fast lookup by payout batch
- **Query**: `WHERE payoutBatchId = 'xxx'`
- **Frequency**: Medium (payout batch details)
- **Why**: List all entries in a payout batch

### `@@index([merchantId, createdAt])`
- **Purpose**: Sort by date per merchant
- **Query**: `WHERE merchantId = 'xxx' ORDER BY createdAt DESC`
- **Frequency**: Medium (ledger history)
- **Why**: Show newest entries first

---

## PayoutBatch Table

### `@@index([merchantId])`
- **Purpose**: Fast lookup of payout batches by merchant
- **Query**: `WHERE merchantId = 'xxx'`
- **Frequency**: Medium (merchant payout history)
- **Why**: All payout batch queries are scoped to merchant

### `@@index([merchantId, status])`
- **Purpose**: Filter by status per merchant
- **Query**: `WHERE merchantId = 'xxx' AND status = 'PENDING'`
- **Frequency**: Medium (payout processing)
- **Why**: Find pending batches to process

### `@@index([merchantId, createdAt])`
- **Purpose**: Sort by date per merchant
- **Query**: `WHERE merchantId = 'xxx' ORDER BY createdAt DESC`
- **Frequency**: Medium (payout history)
- **Why**: Show newest batches first

### `@@index([razorpayPayoutId])`
- **Purpose**: Fast Razorpay payout lookup
- **Query**: `WHERE razorpayPayoutId = 'pout_xxx'`
- **Frequency**: Low (webhook processing)
- **Why**: Razorpay webhooks send payout ID

---

## Index Best Practices Applied

1. **Composite indexes** for common filter patterns (`merchantId + status`, `merchantId + createdAt`)
2. **Foreign key indexes** for fast JOINs (`merchantId`, `orderId`, `productId`)
3. **Unique constraints** where data integrity is critical (`slug`, `merchantId + orderNumber`)
4. **Query-specific indexes** for high-frequency queries (storefront routes, dashboard filters)

## Performance Considerations

- **Write overhead**: More indexes = slower writes, but acceptable for ecommerce (reads >> writes)
- **Storage**: Indexes use additional storage, but necessary for performance
- **Maintenance**: PostgreSQL automatically maintains indexes on INSERT/UPDATE/DELETE
