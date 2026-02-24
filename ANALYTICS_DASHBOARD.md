# Analytics Dashboard

## Status: ✅ COMPLETE

This document describes the implementation of the advanced analytics dashboard for the Merceton platform.

## Features Implemented

### 1. Database Indexes ✅

**Updated `prisma/schema.prisma`:**

- **Order Model:**
  - Added composite index: `@@index([merchantId, createdAt, status])` for efficient date range + status queries

- **OrderItem Model:**
  - Added composite index: `@@index([productId, createdAt])` for sales by product queries

These indexes optimize:
- Date range filtering with status
- Product sales aggregation
- Time-series queries

### 2. API Endpoints ✅

All endpoints are feature-gated (require `ANALYTICS_BASIC` feature) and include proper error handling.

#### `/api/analytics/sales-by-product`
- **Method:** GET
- **Query Params:**
  - `from` (optional): Start date (ISO string)
  - `to` (optional): End date (ISO string)
  - `limit` (optional): Number of products (default: 20)
- **Returns:**
  - `products`: Array of product sales data
    - `productId`, `productName`, `sku`, `imageUrl`
    - `totalRevenue`, `totalQuantity`, `orderCount`
    - `averageOrderValue`
  - `totalRevenue`: Sum of all product revenues
  - `totalQuantity`: Sum of all quantities
  - `period`: Date range used

**Performance:**
- Filters orders by merchant and payment status first
- Aggregates order items in memory (safe, no SQL injection)
- Fetches product details in batch
- Sorted by revenue (descending)

#### `/api/analytics/sales-by-date`
- **Method:** GET
- **Query Params:**
  - `from` (required): Start date (ISO string)
  - `to` (required): End date (ISO string)
  - `groupBy` (optional): "day" | "week" | "month" (default: "day")
- **Returns:**
  - `sales`: Array of sales by date
    - `date`: Date key (formatted based on groupBy)
    - `revenue`: Total revenue for period
    - `orders`: Number of orders
    - `quantity`: Total items sold
    - `discount`: Total discounts applied
  - `totals`: Aggregated totals
  - `period`: Date range and groupBy used

**Performance:**
- Single query to fetch all orders in date range
- Groups by date in memory (flexible grouping logic)
- Efficient date key generation

#### `/api/analytics/top-customers`
- **Method:** GET
- **Query Params:**
  - `from` (optional): Start date (ISO string)
  - `to` (optional): End date (ISO string)
  - `limit` (optional): Number of customers (default: 20)
- **Returns:**
  - `customers`: Array of top customers
    - `email`, `name`, `phone`
    - `totalRevenue`, `orderCount`
    - `averageOrderValue`
    - `firstOrderDate`, `lastOrderDate`
  - `totals`: Aggregated totals
  - `period`: Date range used

**Performance:**
- Single query to fetch all orders
- Groups by customer email in memory
- Sorted by revenue (descending)

#### `/api/analytics/conversion`
- **Method:** GET
- **Query Params:**
  - `from` (optional): Start date (ISO string)
  - `to` (optional): End date (ISO string)
- **Returns:**
  - `totalOrders`: Total orders created (checkout started proxy)
  - `paidOrders`: Orders with PAID status (conversions)
  - `conversionRate`: (paidOrders / totalOrders) × 100
  - `totalRevenue`: Revenue from paid orders
  - `averageOrderValue`: Average order value
  - `statusBreakdown`: Count by payment status
  - `note`: Explanation of proxy metric

**Conversion Metric:**
- **Proxy:** Orders created vs orders paid
- **Formula:** `(Paid Orders / Total Orders) × 100`
- **Note:** This is a proxy metric since we don't have session tracking. True conversion would require tracking "checkout started" events.

### 3. Analytics Dashboard UI ✅

**File:** `app/dashboard/analytics/page.tsx`
- Server component with feature gating
- Renders `AnalyticsDashboard` client component

**File:** `components/analytics/AnalyticsDashboard.tsx`
- **Date Range Controls:**
  - From/To date pickers
  - Group by selector (day/week/month)
  - Refresh button
  - Default: Last 30 days

- **Conversion Stats Cards:**
  - Total Orders (checkout started)
  - Paid Orders (conversions)
  - Total Revenue
  - Top Customers count

- **Sales by Product Table:**
  - Product image, name, SKU
  - Quantity sold, order count
  - Revenue, average order value
  - Sorted by revenue

- **Sales by Date Table:**
  - Date, orders, quantity
  - Discount, revenue
  - Grouped by selected period

- **Top Customers Table:**
  - Customer name, email
  - Order count, total revenue
  - Average order value
  - Last order date

**Features:**
- Loading states
- Empty states
- Error handling with toast notifications
- Responsive design
- Real-time data refresh

### 4. Performance Optimizations ✅

1. **Database Indexes:**
   - Composite indexes for common query patterns
   - Optimized for date range + merchant filtering

2. **Query Efficiency:**
   - Filter orders first (smaller dataset)
   - Batch product lookups
   - In-memory aggregation (safe, flexible)

3. **Client-Side:**
   - Parallel API calls
   - Efficient re-renders
   - Date range caching

### 5. Tests ✅

**Unit Tests:** `tests/unit/analytics.test.ts`
- ✅ Sales by product aggregation logic
- ✅ Conversion rate calculation
- ✅ Date grouping (day/week/month)

**Integration Tests:** `tests/integration/analytics.test.ts`
- ✅ Sales by product data shape
- ✅ Sales by date grouping
- ✅ Top customers grouping
- ✅ Conversion rate calculation

## Data Flow

```
User selects date range
    ↓
AnalyticsDashboard component
    ↓
Parallel API calls:
  - /api/analytics/sales-by-product
  - /api/analytics/sales-by-date
  - /api/analytics/top-customers
  - /api/analytics/conversion
    ↓
Each endpoint:
  1. Authorize merchant
  2. Check ANALYTICS_BASIC feature
  3. Query orders (filtered by merchant + date + status)
  4. Aggregate data
  5. Return JSON
    ↓
Component renders tables and cards
```

## Security & Access Control

- **Feature Gating:** All endpoints require `ANALYTICS_BASIC` feature
- **Tenant Isolation:** All queries scoped to `merchantId`
- **Authorization:** Uses `authorizeRequest()` for auth check
- **Error Handling:** Returns 403 with upgrade message if feature denied

## Business Rules

1. **Only Paid Orders:** Analytics only includes orders with `payment.status = "PAID"`
2. **Revenue Calculation:** Uses `grossAmount` (pre-discount) for consistency
3. **Conversion Proxy:** Uses order creation vs payment completion as proxy
4. **Date Grouping:** Flexible grouping (day/week/month) for different views
5. **Customer Grouping:** Groups by email (case-insensitive, trimmed)

## Files Created/Modified

### New Files
- `app/api/analytics/sales-by-product/route.ts` - Sales by product endpoint
- `app/api/analytics/sales-by-date/route.ts` - Sales by date endpoint
- `app/api/analytics/top-customers/route.ts` - Top customers endpoint
- `app/api/analytics/conversion/route.ts` - Conversion stats endpoint
- `app/dashboard/analytics/page.tsx` - Analytics page
- `components/analytics/AnalyticsDashboard.tsx` - Dashboard component
- `tests/unit/analytics.test.ts` - Unit tests
- `tests/integration/analytics.test.ts` - Integration tests
- `ANALYTICS_DASHBOARD.md` - This document

### Modified Files
- `prisma/schema.prisma` - Added composite indexes for analytics queries

## Usage

1. **Navigate to Analytics:**
   - Go to `/dashboard/analytics`
   - Requires `ANALYTICS_BASIC` feature

2. **Select Date Range:**
   - Choose "From" and "To" dates
   - Select grouping (day/week/month)
   - Click "Refresh"

3. **View Metrics:**
   - Conversion stats cards (top)
   - Sales by product table
   - Sales by date table
   - Top customers table

## API Usage Examples

### Sales by Product
```bash
GET /api/analytics/sales-by-product?from=2024-01-01&to=2024-01-31&limit=20
```

### Sales by Date
```bash
GET /api/analytics/sales-by-date?from=2024-01-01&to=2024-01-31&groupBy=day
```

### Top Customers
```bash
GET /api/analytics/top-customers?from=2024-01-01&to=2024-01-31&limit=20
```

### Conversion Stats
```bash
GET /api/analytics/conversion?from=2024-01-01&to=2024-01-31
```

## Performance Considerations

1. **Indexes:** Composite indexes added for common query patterns
2. **Query Optimization:** Filter orders first, then aggregate
3. **Batch Operations:** Product lookups done in batch
4. **In-Memory Aggregation:** Safe, flexible, no SQL injection risk

## Future Enhancements

- [ ] Charts/visualizations (line charts, bar charts)
- [ ] Export to CSV/PDF
- [ ] Real-time updates (WebSocket/SSE)
- [ ] Advanced filters (product category, payment method)
- [ ] Comparison periods (YoY, MoM)
- [ ] Custom date presets (Last 7 days, Last month, etc.)
- [ ] Materialized views for faster queries
- [ ] Caching layer for frequently accessed data
- [ ] True conversion tracking (session-based)
- [ ] Customer lifetime value (LTV)
- [ ] Product performance trends
- [ ] Geographic analytics (if address data available)

## Migration Steps

1. **Run Prisma migration:**
   ```bash
   npx prisma migrate dev --name add_analytics_indexes
   npx prisma generate
   ```

2. **Test the dashboard:**
   - Navigate to `/dashboard/analytics`
   - Select a date range
   - Verify all metrics load correctly

3. **Run tests:**
   ```bash
   npm run test:unit -- tests/unit/analytics.test.ts
   npm run test:integration -- tests/integration/analytics.test.ts
   ```

## Notes

- **Conversion Metric:** Currently uses "orders created vs paid" as a proxy. True conversion tracking would require session tracking infrastructure.
- **Performance:** For large datasets, consider materialized views or scheduled aggregation jobs.
- **Feature Gating:** Analytics requires `ANALYTICS_BASIC` feature (available on Growth plan).
