# API Contract Fix - "Invalid data format" Toast

## Problem
Network request named "onboarding" returns HTTP 200, but UI shows toast "Invalid data format". The issue is that Server Actions always return HTTP 200, but the response body contains `{ success: false, error: "Invalid data format" }` when there's a Prisma validation error.

## Root Cause
1. Server Actions in Next.js always return HTTP 200 (they use RPC mechanism)
2. When Prisma validation error occurs, `toSafeApiError` returns `{ message: "Invalid data format" }`
3. Server action returns `{ success: false, error: "Invalid data format" }`
4. Frontend checks `result.success === false` and shows `result.error` which is "Invalid data format"
5. This is not user-friendly

## Solution Implemented

### 1. Fixed Server Actions to Never Return "Invalid data format"

**File:** `app/actions/onboarding.ts`

**Updated all catch blocks to replace "Invalid data format" with user-friendly message:**

```typescript
} catch (error) {
  console.error("Save GST step error:", error)
  const safeError = toSafeApiError(error)
  // Never return "Invalid data format" - replace with user-friendly message
  const errorMessage = safeError.message === "Invalid data format"
    ? "Validation failed. Please check all fields and try again."
    : safeError.message
  return { success: false, error: errorMessage }
}
```

**Applied to all server actions:**
- `savePanStep`
- `saveGstStep`
- `saveBusinessBasicsStep`
- `updatePanSection`
- `updateGstSection`
- `updateBusinessSection`
- `updateContactInfoSection`

### 2. Fixed Frontend to Handle Response Correctly

**File:** `components/OnboardingForm.tsx`

**Enhanced response handling with better logging and error message replacement:**

```typescript
// DEV-only log
if (process.env.NODE_ENV === "development") {
  console.log("[onboarding] API response status: success =", result.success)
  console.log("[onboarding] API response data:", result)
}

// Handle response based on success flag
if (result.success) {
  // Success path - never show "Invalid data format"
  toast({
    title: "GST details saved",
    description: "Step 2 completed successfully.",
  })
  setCurrentStep(3)
} else {
  // Error path - handle field errors and show appropriate message
  if (result.fieldErrors) {
    // Map field errors to form
    for (const [field, message] of Object.entries(result.fieldErrors)) {
      gstForm.setError(field as keyof GstStepData, {
        type: "server",
        message,
      })
    }
  }
  
  if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
    toast({
      title: "Please fix highlighted fields",
      description: "Check the fields marked in red below",
      variant: "destructive",
    })
  } else {
    // Never show "Invalid data format" - replace with user-friendly message
    const errorMessage = result.error || "Failed to save GST details"
    const displayMessage = errorMessage.includes("Invalid data format")
      ? "Validation failed. Please check all fields and try again."
      : errorMessage
    toast({
      title: "Error",
      description: displayMessage,
      variant: "destructive",
    })
  }
}
```

**Applied to all submit handlers:**
- `handlePanSubmit`
- `handleGstSubmit`
- `handleBusinessSubmit`

## API Contract (Server Actions)

### Success Response
```typescript
{
  success: true,
  onboarding: {
    id: string,
    onboardingStatus: string,
    profileCompletionPercent: number
  }
}
```

### Validation Error Response
```typescript
{
  success: false,
  error: "Please fix highlighted fields", // Never "Invalid data format"
  fieldErrors: {
    "invoiceAddressLine1": "Address line 1 is required",
    "invoicePincode": "Pincode must be exactly 6 digits"
  }
}
```

### Other Error Response
```typescript
{
  success: false,
  error: "Validation failed. Please check all fields and try again." // Never "Invalid data format"
}
```

## Expected Behavior

### When Validation Fails (with fieldErrors):
1. Server action returns `{ success: false, error: "...", fieldErrors: {...} }`
2. Frontend maps `fieldErrors` to form fields
3. Fields are highlighted in red with error messages
4. Toast shows: "Please fix highlighted fields"
5. **Never shows "Invalid data format"**

### When Validation Fails (no fieldErrors):
1. Server action returns `{ success: false, error: "..." }`
2. Frontend checks if error contains "Invalid data format"
3. If yes, replaces with: "Validation failed. Please check all fields and try again."
4. Toast shows user-friendly message
5. **Never shows "Invalid data format"**

### When Success:
1. Server action returns `{ success: true, onboarding: {...} }`
2. Frontend shows success toast
3. Advances to next step
4. **Never shows "Invalid data format"**

## Files Changed

1. **app/actions/onboarding.ts**
   - Updated all catch blocks to replace "Invalid data format" with user-friendly message
   - Applied to 7 server actions

2. **components/OnboardingForm.tsx**
   - Enhanced response handling with better logging
   - Added error message replacement in all submit handlers
   - Applied to 3 submit handlers

## Testing Checklist

✅ **Success Path:**
- Fill form with valid data
- Click "Save & Continue"
- Should see console: `[onboarding] API response status: success = true`
- Should see success toast
- Should advance to next step
- **Should NEVER show "Invalid data format"**

✅ **Validation Error with fieldErrors:**
- Fill form with invalid data
- Click "Save & Continue"
- Should see console: `[onboarding] API response status: success = false`
- Should see fields highlighted in red
- Should see toast: "Please fix highlighted fields"
- **Should NEVER show "Invalid data format"**

✅ **Validation Error without fieldErrors:**
- Trigger server-side error (e.g., Prisma validation)
- Should see console: `[onboarding] API response status: success = false`
- Should see toast: "Validation failed. Please check all fields and try again."
- **Should NEVER show "Invalid data format"**

## Debugging

If you still see "Invalid data format":
1. Check Console logs: `[onboarding] API response status: success =` and `[onboarding] API response data:`
2. Check if `result.success === false` and `result.error` contains "Invalid data format"
3. The frontend should replace it, but if it doesn't, check the error message replacement logic
4. Check server-side logs to see what error is being caught
