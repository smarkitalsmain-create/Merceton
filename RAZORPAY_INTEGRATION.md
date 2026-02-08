# Razorpay Payment Integration Guide

## Overview

This document explains how Razorpay payment integration works and how to test it locally.

## Architecture

### Payment Flow

1. **Customer selects UPI/Online payment** → Order created with `paymentMethod: RAZORPAY`, `status: CREATED`
2. **Server creates Razorpay order** → `/api/payments/create-razorpay-order`
3. **Client opens Razorpay Checkout** → Customer completes payment
4. **Payment verification** → `/api/payments/verify` (client-side callback)
5. **Webhook confirmation** → `/api/webhooks/razorpay` (server-side backup)

### COD Flow

1. **Customer selects COD** → Order created with `paymentMethod: COD`, `status: PENDING`
2. **Order status set to PLACED** → Immediate confirmation
3. **Payment status remains PENDING** → Until collected on delivery

## Security Features

### ✅ Server-Side Security
- Razorpay keys stored only on server (never exposed to client)
- Payment signature verification (HMAC SHA256)
- Webhook signature verification
- Amount validation (prevents tampering)
- Merchant association validation

### ✅ Replay Attack Prevention
- Payment status checked before processing
- Idempotent webhook handling
- Duplicate Razorpay order prevention

### ✅ Data Validation
- Order-merchant association verified
- Payment method validation
- Amount matching validation
- Status transition validation

## Setup Instructions

### 1. Get Razorpay Test Keys

1. Sign up at https://razorpay.com
2. Go to Dashboard > Settings > API Keys
3. Generate test keys
4. Copy:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (starts with `...`)

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Razorpay Test Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET

# Webhook Secret (get from Razorpay Dashboard > Settings > Webhooks)
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Webhooks (Optional but Recommended)

#### Option A: Using ngrok (Local Testing)

1. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com
   ```

2. **Start your Next.js app:**
   ```bash
   npm run dev
   ```

3. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Configure in Razorpay:**
   - Go to Dashboard > Settings > Webhooks
   - Add webhook URL: `https://your-ngrok-url.ngrok.io/api/webhooks/razorpay`
   - Select events: `payment.captured`, `payment.failed`
   - Copy the webhook secret to `.env`

#### Option B: Skip Webhooks (MVP)

- Webhooks are optional for MVP
- Payment verification happens via client callback
- Webhooks provide backup verification

## Testing Payments Locally

### Test Cards (Razorpay Test Mode)

Use these test cards for testing:

| Card Number | CVV | Expiry | Result |
|------------|-----|--------|--------|
| 4111 1111 1111 1111 | Any | Future date | Success |
| 5555 5555 5555 4444 | Any | Future date | Success |
| 4000 0000 0000 0002 | Any | Future date | Failure |

### Test UPI IDs

- `success@razorpay` - Successful payment
- `failure@razorpay` - Failed payment

### Testing Steps

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Access storefront:**
   - Navigate to `/s/demo-store` (or your merchant slug)
   - Add products to cart
   - Go to checkout

3. **Test COD:**
   - Select "Cash on Delivery"
   - Fill in details
   - Click "Place Order"
   - Should redirect to confirmation page

4. **Test UPI/Online Payment:**
   - Select "UPI / Card / Netbanking"
   - Fill in details
   - Click "Pay ₹X.XX"
   - Razorpay checkout opens
   - Use test card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date
   - Name: Any name
   - Click "Pay"
   - Should redirect to confirmation page

5. **Verify in Database:**
   ```bash
   npm run db:studio
   ```
   - Check `Order` table: status should be `CONFIRMED`
   - Check `Payment` table: status should be `PAID`
   - Check `razorpayPaymentId` is populated

### Testing Webhooks (Optional)

1. **Set up ngrok** (see above)

2. **Configure webhook in Razorpay dashboard**

3. **Make a test payment**

4. **Check webhook logs:**
   - Razorpay Dashboard > Webhooks > View logs
   - Should show successful delivery

5. **Check server logs:**
   - Should see webhook received and processed

## Payment Status Flow

### Online Payment (RAZORPAY)
```
CREATED → (Razorpay checkout) → PAID → (Order: CONFIRMED)
         ↓ (if failed)
         FAILED
```

### COD Payment
```
PENDING → (Order: PLACED) → (Manual collection) → PAID
```

## API Endpoints

### 1. Create Razorpay Order
**POST** `/api/payments/create-razorpay-order`

Request:
```json
{
  "orderId": "order_id"
}
```

Response:
```json
{
  "razorpayOrderId": "order_xxx",
  "amount": 59900,
  "currency": "INR"
}
```

### 2. Verify Payment
**POST** `/api/payments/verify`

Request:
```json
{
  "orderId": "order_id",
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "signature"
}
```

Response:
```json
{
  "success": true
}
```

### 3. Webhook
**POST** `/api/webhooks/razorpay`

Headers:
- `x-razorpay-signature`: Webhook signature

Body: Razorpay webhook payload

## Troubleshooting

### Payment Not Processing

1. **Check environment variables:**
   ```bash
   echo $NEXT_PUBLIC_RAZORPAY_KEY_ID
   echo $RAZORPAY_KEY_SECRET
   ```

2. **Check browser console** for errors

3. **Check server logs** for API errors

4. **Verify Razorpay keys** are correct (test mode)

### Webhook Not Working

1. **Verify webhook URL** is accessible (use ngrok for local)

2. **Check webhook secret** matches Razorpay dashboard

3. **Verify webhook events** are enabled in Razorpay

4. **Check server logs** for webhook errors

### Signature Verification Failed

1. **Verify `RAZORPAY_KEY_SECRET`** is correct
2. **Verify `RAZORPAY_WEBHOOK_SECRET`** is correct (for webhooks)
3. **Check signature format** matches Razorpay documentation

## Production Checklist

- [ ] Switch to Razorpay live keys
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Configure production webhook URL
- [ ] Test with real payment (small amount)
- [ ] Verify webhook delivery
- [ ] Set up monitoring/alerts
- [ ] Review security settings

## Security Best Practices

1. ✅ Never expose `RAZORPAY_KEY_SECRET` to client
2. ✅ Always verify payment signatures
3. ✅ Validate amounts match
4. ✅ Check merchant association
5. ✅ Use HTTPS in production
6. ✅ Implement rate limiting on webhook endpoint
7. ✅ Log all payment events for audit

## Support

- Razorpay Docs: https://razorpay.com/docs/
- Razorpay Dashboard: https://dashboard.razorpay.com
- Test Cards: https://razorpay.com/docs/payments/test-cards/
