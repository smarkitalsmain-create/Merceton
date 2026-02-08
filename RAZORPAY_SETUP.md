# Razorpay Integration - Quick Setup Guide

## Environment Variables

Add these to your `.env` file:

```bash
# Razorpay Test Keys (get from https://dashboard.razorpay.com/app/keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Webhook Secret (get from Razorpay Dashboard > Settings > Webhooks)
RAZORPAY_WEBHOOK_SECRET=...

# App URL (for webhooks - use ngrok URL for local testing)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Quick Test Setup

### 1. Get Razorpay Test Keys

1. Go to https://razorpay.com and sign up
2. Navigate to Dashboard > Settings > API Keys
3. Generate test keys
4. Copy Key ID and Key Secret to `.env`

### 2. Test Locally (Without Webhooks)

1. Start app: `npm run dev`
2. Go to storefront: `/s/demo-store`
3. Add product to cart
4. Go to checkout
5. Select "UPI / Card / Netbanking"
6. Use test card: `4111 1111 1111 1111`
7. Any CVV, future expiry date
8. Complete payment

### 3. Test with Webhooks (Optional)

1. Install ngrok: `brew install ngrok` (or download from ngrok.com)
2. Start app: `npm run dev`
3. Start ngrok: `ngrok http 3000`
4. Copy HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. In Razorpay Dashboard > Settings > Webhooks:
   - Add URL: `https://your-ngrok-url.ngrok.io/api/webhooks/razorpay`
   - Select events: `payment.captured`, `payment.failed`
   - Copy webhook secret to `.env`
6. Test payment - webhook will be called automatically

## Test Cards

- **Success**: `4111 1111 1111 1111` (any CVV, future expiry)
- **Failure**: `4000 0000 0000 0002` (any CVV, future expiry)

## Test UPI IDs

- **Success**: `success@razorpay`
- **Failure**: `failure@razorpay`

See `RAZORPAY_INTEGRATION.md` for detailed documentation.
