# Merchant Account Hold & KYC Approval System - Implementation Summary

## Overview
Complete implementation of merchant account hold and KYC approval system with UI, API routes, database schema, email notifications, and merchant dashboard integration.

## Files Changed/Created

### Database Schema
1. **`prisma/schema.prisma`**
   - Added `MerchantAccountStatus` enum (ACTIVE, ON_HOLD)
   - Added `MerchantKycStatus` enum (PENDING, SUBMITTED, APPROVED, REJECTED)
   - Added `MerchantStatusEventType` enum (HOLD_APPLIED, HOLD_RELEASED, KYC_APPROVED)
   - Updated `Merchant` model with:
     - `accountStatus`, `holdReasonCode`, `holdReasonText`, `holdAppliedAt`, `holdReleasedAt`, `holdAppliedByUserId`, `holdReleasedByUserId`
     - `kycStatus`, `kycApprovedAt`, `kycApprovedByUserId`
   - Added `MerchantStatusEvent` model for audit logging

### Constants & Utilities
2. **`lib/merchant/holdReasons.ts`** (NEW)
   - Hold reason codes and labels
   - Helper functions for reason validation

3. **`lib/guards/merchantHold.ts`** (NEW)
   - `requireMerchantNotOnHold()` - Throws error if merchant on hold
   - `isMerchantOnHold()` - Non-throwing check

### Email Templates
4. **`emails/merchantStatus.ts`** (NEW)
   - `accountOnHoldEmail()` - Account hold notification
   - `kycApprovedEmail()` - KYC approval notification
   - `holdReleasedEmail()` - Hold release notification

5. **`emails/index.ts`**
   - Added exports for merchant status email templates

### API Routes
6. **`app/api/admin/merchants/[merchantId]/hold/route.ts`** (NEW)
   - POST endpoint to put merchant on hold
   - Validates reason code and notes
   - Creates status event
   - Sends email (idempotent)

7. **`app/api/admin/merchants/[merchantId]/release-hold/route.ts`** (NEW)
   - POST endpoint to release hold
   - Creates status event
   - Sends email (idempotent)

8. **`app/api/admin/merchants/[merchantId]/kyc/approve/route.ts`** (NEW)
   - POST endpoint to approve KYC
   - Creates status event
   - Sends email (idempotent)

### Admin UI
9. **`components/admin/MerchantSummaryTab.tsx`**
   - Complete rewrite with new account status section
   - Added modals for:
     - Put on Hold (with reason dropdown and notes)
     - Release Hold (with optional notes)
     - Approve KYC (with optional note)
   - Integrated with new API routes
   - Shows account status and KYC status badges

10. **`app/admin/(protected)/merchants/[merchantId]/page.tsx`**
    - Updated to fetch and pass new merchant fields (accountStatus, kycStatus, hold fields)

### Merchant Dashboard UI
11. **`components/dashboard/MerchantStatusBanner.tsx`** (NEW)
    - Prominent banner when account is on hold
    - Shows reason, next steps, and support contact
    - Status badges for account and KYC status

12. **`app/dashboard/layout.tsx`**
    - Added `MerchantStatusBanner` component
    - Fetches merchant status fields
    - Displays banner at top of dashboard pages

## Database Migration Required

Run the following commands to apply schema changes:

```bash
npx prisma migrate dev --name add_merchant_account_hold_kyc
npx prisma generate
```

## Key Features Implemented

### 1. Super Admin Actions
- ✅ Put merchant on hold with required reason dropdown
- ✅ Notes required when reason = "OTHER"
- ✅ Release hold with optional notes
- ✅ Approve KYC with optional note
- ✅ All actions logged in `MerchantStatusEvent` table

### 2. Merchant Dashboard
- ✅ Prominent banner when account is on hold
- ✅ Shows reason, next steps, and support contact
- ✅ Status badges for account and KYC status
- ✅ Action blocking (via guard utility - ready for use)

### 3. Email Notifications
- ✅ Account on hold email (with reason and support details)
- ✅ KYC approved email
- ✅ Hold released email
- ✅ All emails sent from backend only
- ✅ Idempotent (no duplicate emails within 1 minute)

### 4. Security & Validation
- ✅ All API routes protected (super admin only)
- ✅ Server-side validation (Zod schemas)
- ✅ Idempotency checks prevent duplicate emails
- ✅ Proper error handling

## Support Contact Details
- Email: info@smarkitalstech.com
- Phone: 9289109004
- Hours: Monday to Friday, 10 AM to 7 PM

## Hold Reason Codes
- KYC_MISMATCH
- KYC_PENDING_TOO_LONG
- SUSPICIOUS_ORDERS
- HIGH_RTO
- POLICY_VIOLATION
- PAYMENT_RISK
- DOCUMENTS_REQUIRED
- MANUAL_REVIEW
- OTHER (requires notes)

## Test Checklist

### Prerequisites
1. Run database migration: `npx prisma migrate dev --name add_merchant_account_hold_kyc`
2. Ensure you have a super admin account (email in `SUPER_ADMIN_EMAILS`)
3. Have at least one merchant account to test with
4. Ensure email service (Resend) is configured

### Test 1: Put Merchant on Hold
- [ ] Navigate to `/admin/merchants/[merchantId]`
- [ ] Click "Put on Hold" button
- [ ] Select a reason from dropdown (not "OTHER")
- [ ] Submit without notes (should work)
- [ ] Verify merchant account status changes to "ON_HOLD"
- [ ] Verify hold reason is displayed
- [ ] Check merchant dashboard - should show red banner with reason
- [ ] Verify email was sent to merchant (check Resend dashboard or logs)

### Test 2: Put on Hold with "OTHER" Reason
- [ ] Click "Put on Hold" again
- [ ] Select "OTHER" reason
- [ ] Try to submit without notes (should show error)
- [ ] Add notes and submit
- [ ] Verify notes are saved and displayed

### Test 3: Release Hold
- [ ] Click "Release Hold" button
- [ ] Add optional notes
- [ ] Submit
- [ ] Verify merchant account status changes to "ACTIVE"
- [ ] Verify hold reason fields are cleared
- [ ] Check merchant dashboard - banner should disappear
- [ ] Verify email was sent to merchant

### Test 4: Approve KYC
- [ ] Click "Approve KYC" button
- [ ] Add optional note
- [ ] Submit
- [ ] Verify KYC status changes to "APPROVED"
- [ ] Verify approval date is set
- [ ] Check merchant dashboard - KYC badge should show "Approved"
- [ ] Verify email was sent to merchant

### Test 5: Idempotency (No Duplicate Emails)
- [ ] Put merchant on hold
- [ ] Immediately click "Put on Hold" again with same reason
- [ ] Verify no duplicate email is sent (check within 1 minute)
- [ ] Verify API returns success but skips email

### Test 6: Merchant Dashboard Banner
- [ ] As merchant, log into dashboard
- [ ] When account is on hold, verify:
  - [ ] Red banner is displayed at top
  - [ ] Reason is shown
  - [ ] Support contact details are visible
  - [ ] "What this means" section is displayed
- [ ] When account is active and KYC approved:
  - [ ] Small status badges are shown
  - [ ] No banner is displayed

### Test 7: Action Blocking (Future)
- [ ] When account is on hold, verify these actions are blocked:
  - [ ] Create product (use guard in API route)
  - [ ] Publish product (use guard in API route)
  - [ ] Request payout (use guard in API route)
- [ ] Note: Guard utility is created but not yet integrated into all action routes

### Test 8: API Route Security
- [ ] Try to call hold API without admin auth (should return 403)
- [ ] Try to call release API without admin auth (should return 403)
- [ ] Try to call KYC approve API without admin auth (should return 403)

### Test 9: Validation
- [ ] Try to put on hold without selecting reason (should show error)
- [ ] Try to put on hold with "OTHER" but no notes (should show error)
- [ ] Try to release hold when not on hold (should show error)

### Test 10: Database Audit
- [ ] Check `MerchantStatusEvent` table after each action
- [ ] Verify events are created with correct:
  - [ ] eventType
  - [ ] reasonCode/reasonText
  - [ ] createdByUserId
  - [ ] emailSentAt (after email is sent)

## Next Steps (Optional Enhancements)

1. **Action Blocking Integration**: Use `requireMerchantNotOnHold()` in:
   - Product creation API routes
   - Product publish API routes
   - Payout request API routes
   - Payment settings update routes

2. **KYC Rejection**: Add ability to reject KYC with reason

3. **Hold History**: Show history of hold events in admin UI

4. **Email Logging**: Persist email send status to database

5. **Merchant Self-Service**: Allow merchants to submit KYC documents

## Notes

- All email sending is non-blocking (errors don't fail the API request)
- Idempotency window is 1 minute (prevents duplicate emails on rapid clicks)
- Support contact details are hardcoded in email templates and banner component
- Merchant dashboard banner is always visible when account is on hold (no redirect to separate page)
