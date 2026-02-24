# Merchant Status Transitions with Event-Based Email Notifications

## Status: ✅ COMPLETE

This document describes the implementation of merchant status transitions with event-based email notifications.

## Features Implemented

### 1. Database Schema ✅

**Updated `prisma/schema.prisma`:**

- **MerchantStatusHistory Model**: Tracks all status changes with:
  - `fromAccountStatus` / `toAccountStatus` (MerchantAccountStatus enum)
  - `fromKycStatus` / `toKycStatus` (MerchantKycStatus enum)
  - `reason` (hold reason code or general reason)
  - `reasonText` (additional notes)
  - `changedByAdminUserId` (audit trail)
  - `createdAt` (timestamp)

- **Existing Fields Used:**
  - `Merchant.accountStatus` (ACTIVE | ON_HOLD)
  - `Merchant.kycStatus` (PENDING | SUBMITTED | APPROVED | REJECTED)
  - `Merchant.holdReasonCode` / `holdReasonText`
  - `Merchant.holdAppliedAt` / `holdAppliedByUserId`
  - `Merchant.holdReleasedAt` / `holdReleasedByUserId`
  - `Merchant.kycApprovedAt` / `kycApprovedByUserId`

### 2. Unified Status Update Action ✅

**File:** `app/actions/merchant-status.ts`

- **`updateMerchantStatus()`**: Unified action that handles:
  - Account status transitions (ACTIVE ↔ ON_HOLD)
  - KYC status transitions (PENDING → SUBMITTED → APPROVED/REJECTED)
  - Hold reason management (required when setting ON_HOLD)
  - Atomic transaction: Updates merchant + creates history entry
  - Email notifications sent after DB commit (async, non-blocking)
  - Audit logging via `logAdminAction()`

**Features:**
- Validates hold reason is provided when setting ON_HOLD
- Clears hold fields when releasing hold
- Sets approval timestamps for KYC approval
- Returns email send status for debugging

### 3. Email Notifications ✅

**File:** `lib/email/notifications.ts`

- **`sendMerchantOnHoldEmail()`**: Sent when account status → ON_HOLD
- **`sendMerchantKycApprovedEmail()`**: Sent when KYC status → APPROVED
- **`sendMerchantHoldReleasedEmail()`**: Sent when account status → ACTIVE (from ON_HOLD)

**Email Templates:** `emails/merchantStatus.ts`
- `accountOnHoldEmail()` - Shows hold reason and support contact
- `kycApprovedEmail()` - Success message with next steps
- `holdReleasedEmail()` - Confirmation that account is active again

**Features:**
- Emails sent asynchronously after DB commit (non-blocking)
- Error handling: Logs failures but doesn't block status update
- Uses merchant's admin user email address
- Includes support contact information

### 4. Admin UI ✅

**File:** `components/admin/MerchantStatusEditor.tsx`

- **Status Dropdowns:**
  - Account Status: ACTIVE | ON_HOLD
  - KYC Status: PENDING | SUBMITTED | APPROVED | REJECTED

- **Hold Reason Selection:**
  - Dropdown with predefined reason codes
  - Additional notes field (required for "OTHER" reason)
  - Validation: Hold reason required when setting ON_HOLD

- **Audit Reason Field:**
  - Required textarea for all status changes
  - Logged in audit trail and status history

- **Confirmation Dialog:**
  - Shows what will change before applying
  - Lists email notifications that will be sent
  - Prevents accidental status changes

**Integration:** Added to merchant detail page (`app/admin/(protected)/merchants/[merchantId]/page.tsx`)
- New "Status" tab in merchant detail view
- Shows current status and allows updates

### 5. Merchant Dashboard Banner ✅

**File:** `components/dashboard/MerchantStatusBanner.tsx`

**Status Display:**
- **ON_HOLD**: Red alert with:
  - Hold reason code and text
  - What actions are restricted
  - Support contact information

- **KYC_APPROVED**: Green success alert with:
  - "KYC Approved" message
  - Confirmation that account is fully active
  - Next steps information

- **Other States**: Status badges showing current account and KYC status

**Features:**
- Automatically displays based on merchant status
- Clear visual indicators (colors, icons)
- Actionable information (support contact)

### 6. Tests ✅

**Integration Tests:** `tests/integration/merchantStatus.test.ts`

- ✅ Status update writes history entry
- ✅ Email notifications triggered (mocked)
- ✅ Merchant account status updated in DB
- ✅ Hold fields cleared when releasing hold
- ✅ KYC approval sets timestamp
- ✅ On-hold email sent when status → ON_HOLD
- ✅ KYC approved email sent when KYC → APPROVED
- ✅ Hold released email sent when ON_HOLD → ACTIVE

**E2E Tests:** `tests/e2e/merchant-core.spec.ts`

- ✅ Status banner visible on dashboard
- ✅ Banner shows appropriate state (ON_HOLD, KYC_APPROVED, or badges)

## Status Transition Flow

### Setting Account to ON_HOLD

1. **Admin selects:** Account Status = ON_HOLD
2. **System validates:** Hold reason code required
3. **Admin provides:** Hold reason code + optional notes + audit reason
4. **System updates:**
   - `accountStatus` = ON_HOLD
   - `holdReasonCode` = selected reason
   - `holdReasonText` = notes
   - `holdAppliedAt` = now
   - `holdAppliedByUserId` = admin user ID
5. **System creates:** Status history entry
6. **System sends:** On-hold email to merchant
7. **System logs:** Admin action in audit trail

### Releasing Hold (ON_HOLD → ACTIVE)

1. **Admin selects:** Account Status = ACTIVE
2. **Admin provides:** Audit reason
3. **System updates:**
   - `accountStatus` = ACTIVE
   - `holdReasonCode` = null
   - `holdReasonText` = null
   - `holdReleasedAt` = now
   - `holdReleasedByUserId` = admin user ID
4. **System creates:** Status history entry
5. **System sends:** Hold released email to merchant
6. **System logs:** Admin action in audit trail

### Approving KYC

1. **Admin selects:** KYC Status = APPROVED
2. **Admin provides:** Audit reason
3. **System updates:**
   - `kycStatus` = APPROVED
   - `kycApprovedAt` = now
   - `kycApprovedByUserId` = admin user ID
4. **System creates:** Status history entry
5. **System sends:** KYC approved email to merchant
6. **System logs:** Admin action in audit trail

## API Response Examples

### Successful Status Update

```json
{
  "success": true,
  "merchant": {
    "id": "...",
    "accountStatus": "ON_HOLD",
    "kycStatus": "APPROVED",
    "holdReasonCode": "MANUAL_REVIEW",
    "holdReasonText": "Additional verification required",
    ...
  },
  "statusHistory": {
    "id": "...",
    "fromAccountStatus": "ACTIVE",
    "toAccountStatus": "ON_HOLD",
    "reason": "MANUAL_REVIEW",
    ...
  },
  "emailsSent": {
    "onHold": true,
    "holdReleased": false,
    "kycApproved": false
  }
}
```

## Files Created/Modified

### New Files
- `app/actions/merchant-status.ts` - Unified status update action
- `components/admin/MerchantStatusEditor.tsx` - Admin UI component
- `tests/integration/merchantStatus.test.ts` - Integration tests
- `MERCHANT_STATUS_TRANSITIONS.md` - This document

### Modified Files
- `prisma/schema.prisma` - Added MerchantStatusHistory model
- `lib/email/notifications.ts` - Added merchant status email functions
- `app/admin/(protected)/merchants/[merchantId]/page.tsx` - Added Status tab
- `components/dashboard/MerchantStatusBanner.tsx` - Added KYC_APPROVED success message
- `tests/e2e/merchant-core.spec.ts` - Added status banner visibility test

## Migration Steps

1. **Run Prisma migration:**
   ```bash
   npx prisma migrate dev --name add_merchant_status_history
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

3. **Run tests:**
   ```bash
   npm run test:unit
   npm run test:e2e
   ```

## Security & Audit

- **RBAC Protection:** Only admins can update merchant status
- **Audit Trail:** All status changes logged with:
  - Admin user ID
  - Timestamp
  - Reason
  - Before/after state
- **Status History:** Complete history of all transitions
- **Email Notifications:** Sent to merchant for transparency

## Business Rules

- **Hold Reason Required:** Cannot set ON_HOLD without reason code
- **Additional Notes:** Required for "OTHER" hold reason
- **Audit Reason Required:** All status changes require audit reason
- **Email Notifications:** Sent automatically on status transitions
- **Atomic Updates:** Status + history created in single transaction
- **Non-Blocking Emails:** Email failures don't block status updates

## Error Handling

- **Validation Errors:** Returned with field-level messages
- **Email Failures:** Logged but don't block status update
- **Transaction Safety:** Status and history updated atomically
- **Admin Auth:** Throws error if non-admin tries to update

## Future Enhancements

- [ ] Internal ops notification email when merchant put on hold
- [ ] Status change webhooks for external integrations
- [ ] Bulk status updates for multiple merchants
- [ ] Status change approval workflow (for sensitive changes)
- [ ] Scheduled status changes (e.g., auto-release hold after X days)
