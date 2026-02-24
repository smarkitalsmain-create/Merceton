# Onboarding Invoice/Billing Address Fix

## Problem
Toast shows "Invalid data format" even with seemingly valid invoice fields. No field-level errors shown.

## Root Causes Identified

1. **Validation schema too strict**: Using `.transform()` with `.refine()` can cause issues
2. **Phone validation complexity**: Multiple transforms causing validation failures
3. **Empty string handling**: Not properly converting empty strings to undefined
4. **Error extraction**: Not extracting all field errors from Zod's flattened output
5. **Generic error message**: Showing "Invalid data format" instead of field-specific errors

## Changes Made

### 1. Enhanced Server-Side Diagnostics (`app/actions/onboarding.ts`)

**Added comprehensive logging:**
```typescript
// Log incoming payload for debugging (server-side only)
console.log("[saveGstStep] Received payload keys:", Object.keys(data as object || {}))
console.log("[saveGstStep] Payload sample:", {
  invoiceAddressLine1: (data as any)?.invoiceAddressLine1,
  invoiceCity: (data as any)?.invoiceCity,
  invoicePincode: (data as any)?.invoicePincode,
  // ... other fields
})

// On validation failure:
console.error("[saveGstStep] Validation failed:", {
  fieldErrors: flattened.fieldErrors,
  formErrors: flattened.formErrors,
  inputKeys: Object.keys(data as object || {}),
  inputSample: { ... }
})
```

**Improved error extraction:**
- Now extracts from `flattened.fieldErrors` (Zod's built-in flatten)
- Also checks individual error paths
- Falls back to safeError issues

### 2. Simplified Validation Schema (`lib/validation/merchantOnboarding.ts`)

**invoiceAddressLine1:**
```typescript
// Before: z.string().transform((val) => sanitizeString(val)).refine((val) => val !== null, ...)
// After:
invoiceAddressLine1: z
  .string()
  .trim()
  .min(1, "Address line 1 is required")
```

**invoiceAddressLine2:**
```typescript
// Before: z.string().optional().transform((val) => sanitizeString(val))
// After:
invoiceAddressLine2: z.preprocess(
  (v) => {
    if (typeof v !== "string") return v
    const t = v.trim()
    return t === "" ? undefined : t
  },
  z.string().optional()
)
```

**invoiceCity:**
```typescript
// Before: z.string().transform((val) => sanitizeString(val)).refine((val) => val !== null, ...)
// After:
invoiceCity: z
  .string()
  .trim()
  .min(1, "City is required")
```

**invoicePhone:**
```typescript
// Before: Complex preprocess + transform + refine chain
// After:
invoicePhone: z.preprocess(
  (v) => {
    if (typeof v !== "string") return v
    const t = v.trim()
    if (t === "") return undefined
    // Remove all non-digits
    const digits = t.replace(/\D/g, "")
    return digits === "" ? undefined : digits
  },
  z
    .string()
    .refine(
      (val) => {
        if (!val) return true // Optional
        return val.length >= 10 && val.length <= 13
      },
      { message: "Phone must be 10 to 13 digits" }
    )
    .optional()
)
```

### 3. Improved Frontend Error Handling (`components/OnboardingForm.tsx`)

**Updated toast message:**
```typescript
// Before: Only showed toast if no field errors
// After:
if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
  toast({
    title: "Please fix highlighted fields",
    description: "Check the fields marked in red below",
    variant: "destructive",
  })
} else {
  toast({
    title: "Error",
    description: result.error || "Failed to save GST details",
    variant: "destructive",
  })
}
```

## Field Validation Rules

### Required Fields
- **invoiceAddressLine1**: Non-empty string after trim
- **invoiceCity**: Non-empty string after trim
- **invoicePincode**: Exactly 6 digits (accepts string or number)

### Optional Fields
- **invoiceAddressLine2**: String or empty (converted to undefined)
- **invoicePhone**: 10-13 digits, empty string → undefined
- **invoiceEmail**: Valid email format, empty string → undefined, lowercase
- **invoicePrefix**: A-Z0-9 only, max 8 chars, empty string → undefined, uppercase

## API Response Format

### Validation Error (400)
```json
{
  "success": false,
  "error": "Please fix highlighted fields",
  "fieldErrors": {
    "invoiceAddressLine1": "Address line 1 is required",
    "invoicePincode": "Pincode must be exactly 6 digits",
    "invoiceEmail": "Invalid email format"
  }
}
```

### Success (200)
```json
{
  "success": true,
  "onboarding": {
    "id": "...",
    "onboardingStatus": "IN_PROGRESS",
    "profileCompletionPercent": 50
  }
}
```

## Server-Side Logging

When validation fails, server logs will show:
```
[saveGstStep] Received payload keys: ["gstStatus", "invoiceAddressLine1", ...]
[saveGstStep] Payload sample: { invoiceAddressLine1: "...", ... }
[saveGstStep] Validation failed: {
  fieldErrors: { "invoicePincode": ["Pincode must be exactly 6 digits"] },
  formErrors: [],
  inputKeys: [...],
  inputSample: { ... }
}
```

## Files Changed

1. **app/actions/onboarding.ts**
   - Added payload logging
   - Enhanced error extraction from flattened Zod errors
   - Improved fieldErrors building

2. **lib/validation/merchantOnboarding.ts**
   - Simplified invoiceAddressLine1, invoiceAddressLine2, invoiceCity
   - Fixed invoicePhone validation
   - All fields now use proper preprocess patterns

3. **components/OnboardingForm.tsx**
   - Improved toast message handling
   - Always shows appropriate message based on error type

## Testing

### Test with Screenshot Values:
- addressLine1: "123 Main St"
- city: "Noida"
- pincode: 201005 (or "201005")
- phone: 9773946072 (or "9773946072")
- email: Info@smarkitalstech.com
- prefix: MRC

**Expected:**
- ✅ All fields validate successfully
- ✅ If any field fails, it shows red border and error message below
- ✅ Toast shows "Please fix highlighted fields" when fieldErrors exist
- ✅ Server logs show exact field that failed and why

## Next Steps

1. Test with the provided values
2. Check server logs to see which field (if any) fails
3. If still failing, the logs will clearly show the issue
4. Fix any remaining validation mismatches based on logs
