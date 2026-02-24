# Validation Loop Fix - Permanent Solution

## Problem
- Network shows request "onboarding" status 200
- UI shows toast "Validation failed. Please check all fields and try again."
- This repeats even with valid-looking inputs
- Backend/server-action returns failure payload with HTTP 200 and without field-level errors

## Root Cause
1. Server actions in Next.js always return HTTP 200 (they use RPC mechanism)
2. Validation failures return `{ success: false, error: "...", fieldErrors: {...} }` with HTTP 200
3. Frontend checks `result.success === false` but if `fieldErrors` is empty/undefined, shows generic error
4. Payload key mismatch between frontend and backend causing validation to fail silently

## Solution Implemented

### 1. Enhanced Field Error Extraction

**File:** `app/actions/onboarding.ts`

**Improved fieldErrors extraction to use both individual errors and flattened errors:**
```typescript
const parsed = invoiceStepSchema.safeParse(normalized)
if (!parsed.success) {
  const flattened = parsed.error.flatten()
  
  // DEV-only log
  if (process.env.NODE_ENV === "development") {
    console.error("[saveGstStep] Invoice validation failed:", {
      errors: flattened,
      body: payload,
      normalized,
      fieldErrors: flattened.fieldErrors,
      formErrors: flattened.formErrors,
    })
  }
  
  // Build fieldErrors object from flattened errors
  const fieldErrors: Record<string, string> = {}
  
  // First, extract from individual errors
  for (const err of parsed.error.errors) {
    const fieldPath = err.path.join(".")
    if (fieldPath) {
      fieldErrors[fieldPath] = err.message
    }
  }
  
  // Also check flattened.fieldErrors (Zod's built-in flatten)
  if (flattened.fieldErrors) {
    for (const [field, errors] of Object.entries(flattened.fieldErrors)) {
      if (errors && Array.isArray(errors) && errors.length > 0) {
        fieldErrors[field] = errors[0] as string
      }
    }
  }
  
  return {
    success: false,
    error: "Please fix highlighted fields",
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  }
}
```

### 2. Enhanced Payload Normalization

**File:** `lib/validation/invoiceStep.ts`

**Added comprehensive normalization with DEV logging:**
```typescript
export function normalizeInvoicePayload(body: any): any {
  const normalized: any = {
    invoiceAddressLine1: body.invoiceAddressLine1 ?? body.addressLine1 ?? body.address ?? "",
    invoiceAddressLine2: body.invoiceAddressLine2 ?? body.addressLine2 ?? undefined,
    invoiceCity: body.invoiceCity ?? body.city ?? "",
    invoicePincode: body.invoicePincode ?? body.pincode ?? body.postalCode ?? "",
    invoicePhone: body.invoicePhone ?? body.phone ?? body.phoneNumber ?? undefined,
    invoiceEmail: body.invoiceEmail ?? body.email ?? undefined,
    invoicePrefix: body.invoicePrefix ?? body.invoiceNumberPrefix ?? body.prefix ?? undefined,
    invoiceState: body.invoiceState ?? body.state ?? body.gstState ?? undefined,
    compositionScheme: body.compositionScheme ?? body.underCompositionScheme ?? body.gstComposition ?? false,
  }
  
  // DEV-only log
  if (process.env.NODE_ENV === "development") {
    console.log("[normalizeInvoicePayload] Input keys:", Object.keys(body || {}))
    console.log("[normalizeInvoicePayload] Normalized keys:", Object.keys(normalized))
    console.log("[normalizeInvoicePayload] Normalized values:", normalized)
  }
  
  return normalized
}
```

### 3. Improved Frontend Error Handling

**File:** `components/OnboardingForm.tsx`

**Simplified error handling to always check fieldErrors first:**
```typescript
if (result.success) {
  // Success path - proceed to next step
  toast({
    title: "GST details saved",
    description: "Step 2 completed successfully.",
  })
  setCurrentStep(3)
} else {
  // Error path - handle field errors and show appropriate message
  // Always check for fieldErrors first
  if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
    // Map field errors to form fields
    for (const [field, message] of Object.entries(result.fieldErrors)) {
      gstForm.setError(field as keyof GstStepData, {
        type: "server",
        message: String(message),
      })
    }
    // Show toast with generic message when field errors exist
    toast({
      title: "Please fix highlighted fields",
      description: "Check the fields marked in red below",
      variant: "destructive",
    })
  } else {
    // No field errors - show generic error message
    // This should rarely happen if validation is working correctly
    const errorMessage = result.error || "Failed to save GST details"
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    })
  }
}
```

### 4. Enhanced DEV Logging

**Added comprehensive logging at every step:**

**Frontend:**
- `[onboarding] Save & Continue clicked - GST step`
- `[onboarding] Invoice fields in data: {...}`
- `[onboarding] Sending payload to saveGstStep: {...}`
- `[onboarding] API response status: success = ...`
- `[onboarding] API response data: {...}`

**Backend:**
- `[saveGstStep] Step: invoice`
- `[saveGstStep] Received payload keys: [...]`
- `[normalizeInvoicePayload] Input keys: [...]`
- `[normalizeInvoicePayload] Normalized keys: [...]`
- `[normalizeInvoicePayload] Normalized values: {...}`
- `[saveGstStep] Normalized invoice payload: {...}`
- `[saveGstStep] Invoice validation failed: { errors: {...}, body: {...}, normalized: {...} }`

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
  error: "Please fix highlighted fields",
  fieldErrors: {
    "invoiceAddressLine1": "Address line 1 is required",
    "invoicePincode": "Pincode must be exactly 6 digits",
    "invoiceCity": "City is required"
  }
}
```

**Note:** Server actions always return HTTP 200, but the response body contains `success: false` for errors.

## Expected Behavior

### When Validation Fails:
1. Backend normalizes payload keys
2. Backend validates normalized payload
3. If validation fails, extracts fieldErrors from both individual errors and flattened errors
4. Returns `{ success: false, error: "Please fix highlighted fields", fieldErrors: {...} }`
5. Frontend checks `result.fieldErrors` first
6. Maps fieldErrors to form fields using `gstForm.setError()`
7. Fields are highlighted in red with error messages
8. Toast shows: "Please fix highlighted fields"
9. **Never shows generic "Validation failed" message**

### When Validation Succeeds:
1. Backend normalizes and validates payload
2. Updates database with invoice fields only
3. Returns `{ success: true, onboarding: {...} }`
4. Frontend shows success toast
5. Advances to next step

## Files Changed

1. **app/actions/onboarding.ts**
   - Enhanced fieldErrors extraction (uses both individual and flattened errors)
   - Added comprehensive DEV logging

2. **lib/validation/invoiceStep.ts**
   - Enhanced payload normalization with DEV logging
   - Added compositionScheme normalization

3. **components/OnboardingForm.tsx**
   - Simplified error handling (always check fieldErrors first)
   - Enhanced DEV logging
   - Removed generic "Validation failed" message path

## Testing Checklist

✅ **Invalid Data:**
- Fill form with invalid data (e.g., empty address, invalid pincode)
- Click "Save & Continue"
- Should see console: `[saveGstStep] Invoice validation failed:`
- Should see fields highlighted in red with specific error messages
- Should see toast: "Please fix highlighted fields"
- **Should NOT show "Validation failed. Please check all fields and try again."**

✅ **Valid Data:**
- Fill form with valid data (from screenshot)
- Click "Save & Continue"
- Should see console: `[saveGstStep] Normalized invoice payload:`
- Should see console: `[onboarding] API response status: success = true`
- Should see success toast
- Should advance to next step

✅ **Payload Key Mismatch:**
- If frontend sends different key names, normalization should handle it
- Check console: `[normalizeInvoicePayload] Input keys:` vs `Normalized keys:`
- Validation should work with normalized keys

## Debugging

If you still see "Validation failed":
1. Check Console logs: `[saveGstStep] Invoice validation failed:` to see exact field errors
2. Check Console logs: `[normalizeInvoicePayload]` to see if keys are being normalized correctly
3. Check Console logs: `[onboarding] Invoice fields in data:` to see what frontend is sending
4. Verify `result.fieldErrors` is populated in the response
5. The logs will clearly show which field is failing and why
