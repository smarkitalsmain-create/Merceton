# Onboarding Compliance Validation Implementation

## Status: ✅ COMPLETE

This document describes the implementation of PAN and GST compliance validations for the onboarding flow.

## Features Implemented

### 1. PAN Type → 4th Character Mapping ✅

**File:** `lib/validation/panRules.ts`

- **Individual** → 4th char = `P`
- **Company** → 4th char = `C`
- **Partnership/Firm** → 4th char = `F`
- **LLP** → 4th char = `F` (treated as Firm)
- **HUF** → 4th char = `H`
- **Trust** → 4th char = `T`
- **AOP** → 4th char = `A`
- **BOI** → 4th char = `A` (treated as AOP)

### 2. PAN Validation ✅

**Client-side:** `lib/validation/onboarding-steps.ts`
- PAN format regex: `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`
- 4th character validation based on PAN type
- Error message: "PAN type mismatch: 4th character should be 'X' for [Type], but found 'Y'"

**Server-side:** `app/actions/onboarding.ts`
- Re-validates PAN 4th character before persisting
- Returns field-level errors
- Logs validation attempts (success/failure)

### 3. GST Validation ✅

**Client-side:** `lib/validation/onboarding-steps.ts`
- GST format regex: `/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/`
- Note: GST/PAN match validation is done server-side (requires PAN from onboarding record)

**Server-side:** `app/actions/onboarding.ts`
- Validates GST contains PAN (GST characters 3-12 must equal PAN)
- Error message: "GST does not match PAN (GST must contain PAN as characters 3–12)"
- Logs validation attempts

### 4. Audit Logging ✅

**Schema:** `prisma/schema.prisma`
- Added `OnboardingValidationLog` model
- Fields: merchantId, step, field, validationType, passed, errorMessage, inputValue, createdAt
- Indexed for efficient queries

**Implementation:** `app/actions/onboarding.ts`
- Logs all validation attempts (both success and failure)
- Sanitized input values (only first 3 chars of PAN, state code of GST)
- Best-effort logging (doesn't block onboarding if logging fails)

### 5. UI Error Messages ✅

Error messages are automatically displayed via:
- Client-side validation (react-hook-form + Zod)
- Server-side validation (returns fieldErrors in response)

**Messages:**
- PAN: "PAN type mismatch: 4th character should be 'C' for Company, but found 'P'"
- GST: "GST does not match PAN (GST must contain PAN as characters 3–12)"

### 6. Tests ✅

**File:** `tests/unit/panRules.test.ts`
- Unit tests for PAN type mapping
- Unit tests for 4th character validation
- Unit tests for GST/PAN match validation
- Error message generation tests

## Database Changes

### New Model: `OnboardingValidationLog`

```prisma
model OnboardingValidationLog {
  id          String   @id @default(cuid())
  merchantId String
  step        String   // "pan" | "gst"
  field       String   // "panNumber" | "gstin"
  validationType String // "PAN_4TH_CHAR" | "GST_PAN_MATCH"
  passed      Boolean
  errorMessage String?
  inputValue  String? // Sanitized
  createdAt   DateTime @default(now())
  
  merchant Merchant @relation(...)
  
  @@index([merchantId])
  @@index([merchantId, step, createdAt])
  @@index([validationType, passed])
  @@map("onboarding_validation_logs")
}
```

## Files Modified/Created

### New Files
- `lib/validation/panRules.ts` - PAN validation rules and utilities
- `tests/unit/panRules.test.ts` - Unit tests
- `ONBOARDING_COMPLIANCE_VALIDATION.md` - This document

### Modified Files
- `prisma/schema.prisma` - Added OnboardingValidationLog model
- `lib/validation/onboarding-steps.ts` - Added PAN 4th char validation
- `app/actions/onboarding.ts` - Added server-side validation and logging

## Usage

### Client-Side Validation

The validation happens automatically when using `panStepSchema`:

```typescript
import { panStepSchema } from "@/lib/validation/onboarding-steps"

// In form component
const form = useForm({
  resolver: zodResolver(panStepSchema),
  // ...
})
```

### Server-Side Validation

Server-side validation is automatic in `saveOnboardingStep`:

```typescript
// Already implemented in app/actions/onboarding.ts
// Returns fieldErrors if validation fails
const result = await saveOnboardingStep({
  step: "pan",
  panType: "COMPANY",
  panNumber: "ABCDP1234E", // Wrong 4th char
  // ...
})

if (!result.success && result.fieldErrors) {
  // result.fieldErrors.panNumber contains error message
}
```

## Migration Steps

1. **Run Prisma migration:**
   ```bash
   npx prisma migrate dev --name add_onboarding_validation_log
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

3. **Run tests:**
   ```bash
   npm run test:unit
   ```

## Validation Flow

### PAN Step
1. User selects PAN type and enters PAN number
2. Client-side: Zod validates format and 4th character
3. On submit: Server re-validates 4th character
4. If invalid: Returns field error, logs failure
5. If valid: Saves to DB, logs success

### GST Step
1. User enters GSTIN (if REGISTERED)
2. Client-side: Zod validates GST format
3. On submit: Server validates GST contains PAN (from onboarding record)
4. If invalid: Returns field error, logs failure
5. If valid: Saves to DB, logs success

## Error Messages

### PAN Type Mismatch
```
PAN type mismatch: 4th character should be 'C' for Company, but found 'P'
```

### GST/PAN Mismatch
```
GST does not match PAN (GST must contain PAN as characters 3–12)
```

## Security Notes

- **Input Sanitization:** Only first 3 chars of PAN and state code of GST are logged
- **Server-Side Enforcement:** All validations are re-checked server-side
- **Audit Trail:** All validation attempts are logged for compliance

## Future Enhancements

- [ ] Add validation for Trust PAN type (if needed)
- [ ] Add rate limiting for validation attempts
- [ ] Add admin dashboard to view validation logs
- [ ] Add email notifications for repeated validation failures
