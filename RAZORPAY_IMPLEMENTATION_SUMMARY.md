# Razorpay Payment Integration - Implementation Summary

## Overview

Complete Razorpay integration for UPI, card, and netbanking payments with webhook support. COD payments are handled separately with immediate order placement.

## Files Created/Modified

### New Files

1. **`app/api/payments/create-razorpay-order/route.ts`**
   - Creates Razorpay order on server
   - Validates payment method and status
   - Returns Razorpay order details to client
   - Prevents duplicate order creation

2. **`app/api/webhooks/razorpay/route.ts`**
   - Handles Razorpay webhook events
   - Verifies webhook signature
   - Processes `payment.captured` and `payment.failed` events
   - Validates amounts and merchant association
   - Prevents replay attacks

3. **`RAZORPAY_INTEGRATION.md`**
   - Complete integration documentation
   - Setup instructions
   - Testing guide
   - Troubleshooting

4. **`RAZORPAY_SETUP.md`**
   - Quick setup guide
   - Test cards and UPI IDs

### Modified Files

1. **`app/actions/orders.ts`**
   - Updated to handle COD vs UPI/RAZORPAY
   - COD: Order status = PLACED, Payment status = PENDING
   - UPI/RAZORPAY: Order status = PENDING, Payment status = CREATED
   - Maps UPI to RAZORPAY payment method

2. **`app/api/payments/verify/route.ts`**
   - Enhanced signature verification
   - Validates Razorpay order ID match
   - Prevents duplicate processing
   - Transaction-based updates

3. **`components/CheckoutForm.tsx`**
   - Integrated Razorpay Checkout
   - Handles COD vs UPI flow
   - Payment processing states
   - Error handling

4. **`prisma/schema.prisma`**
   - Added `CREATED` to PaymentStatus enum
   - Added `PLACED` to OrderStatus enum

5. **`middleware.ts`**
   - Added payment API routes to public routes

## Payment Flows

### COD Flow

1. Customer selects COD → Order created
2. Order status: `PLACED`
3. Payment status: `PENDING`
4. Immediate redirect to confirmation
5. Payment collected on delivery (manual update)

### UPI/Online Flow

1. Customer selects UPI → Order created
2. Order status: `PENDING`
3. Payment status: `CREATED`
4. Server creates Razorpay order
5. Client opens Razorpay Checkout
6. Customer completes payment
7. Payment verified via callback
8. Order status: `CONFIRMED`
9. Payment status: `PAID`
10. Webhook confirms (backup)

## Security Features

### ✅ Server-Side Security
- Razorpay keys only on server
- Payment signature verification (HMAC SHA256)
- Webhook signature verification
- Amount validation
- Merchant association validation

### ✅ Replay Attack Prevention
- Payment status checked before processing
- Duplicate Razorpay order prevention
- Idempotent webhook handling
- Razorpay order ID validation

### ✅ Data Validation
- Order-merchant association verified
- Payment method validation
- Status transition validation
- Amount matching (prevents tampering)

## API Endpoints

### 1. Create Razorpay Order
**POST** `/api/payments/create-razorpay-order`

- Creates Razorpay order
- Validates payment method
- Returns order details for checkout

### 2. Verify Payment
**POST** `/api/payments/verify`

- Verifies payment signature
- Updates payment and order status
- Creates ledger entries

### 3. Webhook Handler
**POST** `/api/webhooks/razorpay`

- Handles Razorpay webhook events
- Verifies webhook signature
- Processes payment events
- Backup verification mechanism

## Environment Variables

Required in `.env`:

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=... (optional for MVP)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing

### Local Testing (Without Webhooks)

1. Get Razorpay test keys
2. Add to `.env`
3. Start app: `npm run dev`
4. Test with card: `4111 1111 1111 1111`

### Local Testing (With Webhooks)

1. Install ngrok: `brew install ngrok`
2. Start app: `npm run dev`
3. Start ngrok: `ngrok http 3000`
4. Configure webhook in Razorpay dashboard
5. Test payment

### Test Cards

- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`

### Test UPI IDs

- Success: `success@razorpay`
- Failure: `failure@razorpay`

## Payment Status Flow

### Online Payment
```
CREATED → (Razorpay checkout) → PAID → CONFIRMED
         ↓ (if failed)
         FAILED
```

### COD Payment
```
PENDING → PLACED → (manual collection) → PAID
```

## Key Features

- ✅ UPI, Card, Netbanking support
- ✅ COD support
- ✅ Webhook integration
- ✅ Signature verification
- ✅ Replay attack prevention
- ✅ Amount validation
- ✅ Merchant isolation
- ✅ Error handling
- ✅ Transaction-based updates

## Next Steps

1. **Get Razorpay test keys** from dashboard
2. **Add to `.env`** file
3. **Run migration**: `npm run db:push`
4. **Test payment flow**
5. **Configure webhooks** (optional)

See `RAZORPAY_INTEGRATION.md` for detailed documentation.
