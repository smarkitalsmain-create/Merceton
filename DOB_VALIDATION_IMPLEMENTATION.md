# DOB Validation (18+ Age Requirement) - Implementation

## Status: ✅ COMPLETE

This document describes the implementation of date of birth validation to ensure merchants are 18+ years old.

## Features Implemented

### 1. Database Schema ✅

**Updated `prisma/schema.prisma`:**
- Added `dobVerifiedAt` field to `MerchantOnboarding` model
- Timestamp set when DOB is validated and age 18+ check passes

### 2. Age Validation Utilities ✅

**File:** `lib/validation/ageValidation.ts`

- `calculateAge(dob, referenceDate?)` - Calculates exact age using date difference
- `isAge18Plus(dob, referenceDate?)` - Checks if age >= 18
- `getAgeValidationErrorMessage()` - Returns "You must be 18+ to onboard."
- `getMinimumDob()` - Returns date 18 years ago from today

**Key Features:**
- Uses exact date difference (not just year difference)
- Handles edge cases:
  - Exact 18th birthday today → valid
  - One day short of 18 → invalid
  - Birthday not yet occurred this year → accounts for it
  - Leap year edge cases

### 3. Zod Schema Validation ✅

**File:** `lib/validation/onboarding-steps.ts`

- Updated `panStepSchema` to validate age 18+ for individuals
- Validation only applies when `panType === "INDIVIDUAL"`
- Error message: "You must be 18+ to onboard."
- Client-side validation provides immediate feedback

### 4. Server-Side Enforcement ✅

**File:** `app/actions/onboarding.ts`

- Re-validates age 18+ server-side before persisting
- Only validates for `panType === "INDIVIDUAL"`
- Sets `dobVerifiedAt` timestamp when validation passes
- Returns field-level errors if validation fails
- Logs validation attempts (success/failure) for audit

### 5. UI Error Display ✅

**File:** `components/OnboardingForm.tsx`

- Error message automatically displayed via react-hook-form
- Shows "You must be 18+ to onboard." when validation fails
- Field-level error display (red border + error text)
- Toast notification for validation failures

### 6. Tests ✅

**File:** `tests/unit/ageValidation.test.ts`

- Unit tests for `calculateAge`:
  - Exact 18th birthday today
  - One day short of 18
  - Birthday not yet occurred this year
  - Birthday already occurred this year
  - Leap year edge cases
- Unit tests for `isAge18Plus`:
  - Exactly 18 today → true
  - One day short → false
  - 19 years old → true
  - 17 years old → false

## Validation Flow

1. **User selects PAN type = INDIVIDUAL**
2. **User enters date of birth**
3. **Client-side validation:**
   - Zod schema checks if age >= 18
   - If invalid, shows error: "You must be 18+ to onboard."
   - Prevents form submission
4. **On submit (if client-side passes):**
   - Server re-validates age 18+
   - If valid → sets `dobVerifiedAt` timestamp and saves
   - If invalid → returns field error, prevents save
5. **User cannot proceed** until valid DOB is entered

## Edge Cases Handled

### Exact 18th Birthday Today
- ✅ Valid (age = 18)
- Example: DOB = 2006-01-15, Today = 2024-01-15 → Valid

### One Day Short
- ❌ Invalid (age = 17)
- Example: DOB = 2006-01-16, Today = 2024-01-15 → Invalid

### Birthday Not Yet Occurred This Year
- ✅ Correctly calculates age
- Example: DOB = 2006-06-15, Today = 2024-01-15 → Age = 17

### Birthday Already Occurred This Year
- ✅ Correctly calculates age
- Example: DOB = 2006-01-15, Today = 2024-06-15 → Age = 18

## API Response Examples

### Age Validation Failure
```json
{
  "success": false,
  "error": "Please fix highlighted fields",
  "fieldErrors": {
    "panDobOrIncorp": "You must be 18+ to onboard."
  }
}
```

### Age Validation Success
```json
{
  "success": true,
  "onboarding": {
    "id": "...",
    "panDobOrIncorp": "2006-01-15T00:00:00Z",
    "dobVerifiedAt": "2024-01-15T12:00:00Z",
    ...
  }
}
```

## Files Created/Modified

### New Files
- `lib/validation/ageValidation.ts` - Age validation utilities
- `tests/unit/ageValidation.test.ts` - Unit tests
- `DOB_VALIDATION_IMPLEMENTATION.md` - This document

### Modified Files
- `prisma/schema.prisma` - Added `dobVerifiedAt` field
- `lib/validation/onboarding-steps.ts` - Added age 18+ validation to PAN schema
- `app/actions/onboarding.ts` - Added server-side age validation and `dobVerifiedAt` setting

## Migration Steps

1. **Run Prisma migration:**
   ```bash
   npx prisma migrate dev --name add_dob_verification
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

3. **Run tests:**
   ```bash
   npm run test:unit
   ```

## Security Notes

- **Privacy:** DOB is not logged in validation logs (null value passed)
- **Server-Side Enforcement:** All validations are re-checked server-side
- **Exact Date Calculation:** Uses precise date difference, not just year difference
- **Audit Trail:** Validation attempts are logged (success/failure)

## Business Rules

- **Only for Individuals:** Age validation only applies when `panType === "INDIVIDUAL"`
- **Companies/Partnerships:** No age validation (uses incorporation date)
- **Cannot Bypass:** Both client and server-side validation must pass
- **Blocking:** Underage users cannot complete onboarding

## Error Messages

- **Client-side:** "You must be 18+ to onboard." (displayed in form field)
- **Server-side:** Same message returned in `fieldErrors.panDobOrIncorp`
- **UI Toast:** "Please fix highlighted fields" (when server validation fails)
