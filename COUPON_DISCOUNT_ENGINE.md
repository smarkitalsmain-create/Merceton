# Coupon/Discount Engine

## Status: ✅ COMPLETE

This document describes the implementation of the coupon/discount engine for the Merceton platform.

## Features Implemented

### 1. Database Schema ✅

**Updated `prisma/schema.prisma`:**

- **Coupon Model:**
  - `code` - Unique per merchant (uppercase, alphanumeric)
  - `type` - PERCENT or FIXED
  - `value` - Discount value (percentage 0-100 or fixed amount in INR)
  - `minOrderAmount` - Minimum order amount required (optional)
  - `maxDiscount` - Maximum discount cap for percentage coupons (optional)
  - `validFrom` / `validUntil` - Validity period
  - `usageLimit` - Maximum number of redemptions (optional, null = unlimited)
  - `isActive` - Enable/disable coupon
  - `description` - Optional description

- **CouponRedemption Model:**
  - Tracks each coupon usage
  - Links to order and coupon
  - Stores customer email/phone
  - Stores actual discount amount applied
  - Timestamp for audit

- **LedgerType Enum:**
  - Added `COUPON_DISCOUNT` type for ledger tracking

- **Relations:**
  - `Merchant.coupons[]` - All coupons for merchant
  - `Merchant.couponRedemptions[]` - All redemptions
  - `Order.couponRedemption` - Optional redemption record
  - `Coupon.redemptions[]` - All redemptions for coupon

### 2. Coupon Validation & Calculation ✅

**File:** `lib/coupons/validation.ts`

- **`validateCoupon()`**: Validates coupon code for merchant and order
  - Checks coupon exists and is active
  - Validates validity dates
  - Checks minimum order amount
  - Checks usage limit
  - Returns validation result with error message

- **`calculateDiscount()`**: Calculates discount amount
  - PERCENT: `(orderAmount * value) / 100`
  - FIXED: `value`
  - Applies maximum discount cap (for PERCENT)
  - Ensures discount doesn't exceed order amount
  - Rounds to 2 decimal places

### 3. Coupon Management Actions ✅

**File:** `app/actions/coupons.ts`

- **`createCoupon()`**: Create new coupon
  - Validates code format (uppercase, alphanumeric)
  - Checks for duplicate codes (per merchant)
  - Validates PERCENT value (0-100)
  - Validates date ranges
  - Feature-gated (requires COUPONS feature)

- **`updateCoupon()`**: Update existing coupon
  - Validates ownership (merchant check)
  - Prevents code changes after creation
  - Validates all fields

- **`deleteCoupon()`**: Soft delete (sets isActive = false)
- **`getCoupons()`**: List all coupons for merchant
- **`getCouponById()`**: Get single coupon with redemption count

### 4. Order Creation Integration ✅

**File:** `app/actions/orders.ts`

- **Coupon Validation:**
  - Validates coupon code before order creation
  - Checks all validation rules (dates, limits, minimum amount)
  - Returns error if invalid

- **Discount Application:**
  - Calculates discount amount
  - Applies to order: `discount` field
  - Updates `netPayable`: `grossAmount - discount - platformFee`

- **Platform Fee Calculation:**
  - **Decision: Fee calculated on PRE-DISCOUNT amount (grossAmount)**
  - This ensures platform fee is based on original order value
  - Consistent with business requirements

- **Coupon Redemption:**
  - Creates `CouponRedemption` record atomically with order
  - Stores customer email/phone
  - Stores actual discount amount

- **Ledger Impact:**
  - `GROSS_ORDER_VALUE`: Pre-discount amount (credit)
  - `COUPON_DISCOUNT`: Discount amount (debit, if coupon applied)
  - `PLATFORM_FEE`: Fee on pre-discount amount (debit)
  - `ORDER_PAYOUT`: Net payable after discount and fee (credit)

### 5. Coupon Management UI ✅

**Files:**
- `app/dashboard/marketing/coupons/page.tsx` - List page
- `app/dashboard/marketing/coupons/new/page.tsx` - Create page
- `app/dashboard/marketing/coupons/[id]/edit/page.tsx` - Edit page
- `components/marketing/CouponsList.tsx` - List component
- `components/marketing/CouponForm.tsx` - Form component

**Features:**
- List all coupons with status badges
- Create/edit coupons with full validation
- Disable coupons (soft delete)
- Copy coupon code to clipboard
- Show redemption count and usage limits
- Display validity dates and conditions

### 6. Checkout Integration ✅

**File:** `components/CheckoutForm.tsx`

- **Coupon Input:**
  - Text input for coupon code
  - "Apply" button
  - Real-time validation via API
  - Shows applied coupon with discount amount
  - "Remove" button to clear coupon

- **Discount Display:**
  - Shows subtotal, discount, and final total
  - Updates dynamically when coupon applied
  - Visual indicators (green for discount)

- **API Integration:**
  - `/api/coupons/validate` - Validates coupon and returns discount
  - Sends coupon code with order creation

**File:** `app/api/coupons/validate/route.ts`
- Validates coupon code
- Returns discount amount for preview
- Used by checkout form for real-time validation

### 7. Tests ✅

**Unit Tests:** `tests/unit/couponValidation.test.ts`
- ✅ Percentage discount calculation
- ✅ Maximum discount cap application
- ✅ Fixed discount calculation
- ✅ Discount cap at order amount
- ✅ Rounding to 2 decimal places
- ✅ Edge cases (0%, 100%)

**Integration Tests:** `tests/integration/couponOrder.test.ts`
- ✅ Coupon validation for valid orders
- ✅ Minimum order amount validation
- ✅ Usage limit enforcement
- ✅ Expired coupon rejection
- ✅ Inactive coupon rejection
- ✅ Discount calculation integration

## Coupon Types

### PERCENT (Percentage Discount)
- Value: 0-100 (percentage)
- Calculation: `(orderAmount * value) / 100`
- Optional: `maxDiscount` cap
- Example: 20% off, max ₹50

### FIXED (Fixed Amount Discount)
- Value: Fixed amount in INR
- Calculation: `value`
- Example: ₹100 off

## Validation Rules

1. **Code Format:**
   - Uppercase letters, numbers, hyphens, underscores only
   - 1-50 characters
   - Unique per merchant

2. **Validity:**
   - `validFrom` must be in the past or present
   - `validUntil` must be after `validFrom` (if provided)

3. **Usage:**
   - `usageLimit` must be positive integer (if provided)
   - Cannot exceed limit

4. **Order Amount:**
   - Order must meet `minOrderAmount` (if set)

5. **Status:**
   - Coupon must be active (`isActive = true`)

## Platform Fee Calculation

**Decision: Fee calculated on PRE-DISCOUNT amount**

**Rationale:**
- Platform fee should be based on gross order value
- Discount is a merchant marketing cost, not platform cost
- Consistent with industry standards
- Ensures predictable fee structure

**Formula:**
```
grossAmount = sum(item prices)
discount = calculateDiscount(coupon, grossAmount)
platformFee = calculatePlatformFee(grossAmount, feeConfig) // On pre-discount
netPayable = grossAmount - discount - platformFee
```

## Order Amount Breakdown

```
Subtotal (grossAmount): ₹1000.00
Discount (coupon):     -₹200.00
Platform Fee:           -₹25.00
───────────────────────────────
Net Payable:            ₹775.00
```

## Ledger Entries

For an order with coupon:

1. **GROSS_ORDER_VALUE**: +₹1000.00 (credit)
2. **COUPON_DISCOUNT**: -₹200.00 (debit)
3. **PLATFORM_FEE**: -₹25.00 (debit)
4. **ORDER_PAYOUT**: +₹775.00 (credit)

## Files Created/Modified

### New Files
- `lib/coupons/validation.ts` - Validation and calculation utilities
- `app/actions/coupons.ts` - Coupon management actions
- `app/api/coupons/validate/route.ts` - Coupon validation API
- `app/dashboard/marketing/coupons/page.tsx` - Coupons list page
- `app/dashboard/marketing/coupons/new/page.tsx` - Create coupon page
- `app/dashboard/marketing/coupons/[id]/edit/page.tsx` - Edit coupon page
- `components/marketing/CouponsList.tsx` - Coupons list component
- `components/marketing/CouponForm.tsx` - Coupon form component
- `tests/unit/couponValidation.test.ts` - Unit tests
- `tests/integration/couponOrder.test.ts` - Integration tests
- `COUPON_DISCOUNT_ENGINE.md` - This document

### Modified Files
- `prisma/schema.prisma` - Added Coupon, CouponRedemption models, COUPON_DISCOUNT ledger type
- `lib/validations/order.ts` - Added optional `couponCode` field
- `app/actions/orders.ts` - Added coupon validation, discount application, redemption creation, ledger entry
- `components/CheckoutForm.tsx` - Added coupon input, validation, discount display

## API Endpoints

### GET `/api/coupons/validate`
Query params:
- `code` - Coupon code
- `merchantId` - Merchant ID
- `amount` - Order amount in paise
- `email` - Customer email (optional)

Response:
```json
{
  "valid": true,
  "coupon": {
    "code": "SAVE20",
    "type": "PERCENT"
  },
  "discountAmount": 200.00,
  "finalAmount": 800.00
}
```

## Usage Flow

1. **Merchant Creates Coupon:**
   - Navigate to `/dashboard/marketing/coupons`
   - Click "Create Coupon"
   - Fill form (code, type, value, dates, limits)
   - Save

2. **Customer Applies Coupon:**
   - Add products to cart
   - Go to checkout
   - Enter coupon code
   - Click "Apply"
   - See discount applied

3. **Order Creation:**
   - Coupon validated server-side
   - Discount calculated
   - Order created with discount
   - Redemption record created
   - Ledger entries created

4. **Tracking:**
   - Redemption count tracked per coupon
   - Usage limit enforced
   - All redemptions auditable

## Security & Validation

- **Feature Gating:** Only merchants with `COUPONS` feature can create coupons
- **Tenant Isolation:** Coupons scoped to merchant (code unique per merchant)
- **Server-Side Validation:** All validations enforced server-side
- **Atomic Operations:** Coupon redemption created in same transaction as order
- **Audit Trail:** All redemptions logged with customer info and timestamp

## Business Rules

- **Code Uniqueness:** Coupon code must be unique per merchant
- **Code Immutability:** Code cannot be changed after creation
- **Platform Fee:** Calculated on pre-discount amount
- **Discount Cap:** Cannot exceed order amount
- **Usage Limits:** Enforced per coupon (not per customer)
- **Minimum Order:** Enforced at order creation time

## Error Messages

- "Invalid coupon code" - Code doesn't exist
- "This coupon is no longer active" - isActive = false
- "This coupon is not yet valid" - validFrom in future
- "This coupon has expired" - validUntil in past
- "Minimum order amount of ₹X required" - Order below minimum
- "This coupon has reached its usage limit" - Limit exceeded

## Migration Steps

1. **Run Prisma migration:**
   ```bash
   npx prisma migrate dev --name add_coupon_system
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

3. **Run tests:**
   ```bash
   npm run test:unit
   npm run test:integration
   ```

## Future Enhancements

- [ ] Per-customer usage limits (e.g., one per customer)
- [ ] Coupon categories/tags
- [ ] Bulk coupon generation
- [ ] Coupon analytics (redemption rate, revenue impact)
- [ ] Scheduled coupon activation/deactivation
- [ ] Coupon sharing/referral tracking
- [ ] First-order-only coupons
- [ ] Product-specific coupons
- [ ] Category-specific coupons
