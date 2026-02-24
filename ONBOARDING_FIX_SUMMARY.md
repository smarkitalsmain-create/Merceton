# Onboarding Invoice/Billing Address Fix - Summary

## Problem Fixed
Toast showing "Invalid data format" without field-level errors, even with seemingly valid invoice fields.

## Root Causes
1. Complex validation chains using `.transform()` + `.refine()` causing validation failures
2. Empty string handling not properly converting to `undefined`
3. Phone validation too complex with multiple transforms
4. Error extraction not using Zod's `flattened.fieldErrors`
5. Generic error message instead of field-specific feedback

## Solution Implemented

### 1. Enhanced Server-Side Diagnostics

**File:** `app/actions/onboarding.ts`

**Added logging:**
- Logs incoming payload keys and sample values
- Logs validation failures with `flattened.fieldErrors` and `flattened.formErrors`
- Shows input sample for debugging

**Improved error extraction:**
- Extracts from `sanitized.error.errors` (individual errors)
- Extracts from `flattened.fieldErrors` (Zod's built-in flatten)
- Falls back to `safeError.issues`

### 2. Simplified Validation Schema

**File:** `lib/validation/merchantOnboarding.ts`

**Changes:**

**invoiceAddressLine1:**
```typescript
// Before: z.string().transform((val) => sanitizeString(val)).refine((val) => val !== null, ...)
// After:
invoiceAddressLine1: z.string().trim().min(1, "Address line 1 is required")
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
invoiceCity: z.string().trim().min(1, "City is required")
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

**invoicePrefix:**
```typescript
// Fixed regex to allow empty string (* instead of +)
z.string()
  .trim()
  .max(8, "Prefix must be 8 characters or less")
  .regex(/^[A-Z0-9]*$/, "Only A-Z and 0-9 allowed") // * allows empty
  .optional()
```

### 3. Improved Frontend Error Handling

**File:** `components/OnboardingForm.tsx`

**Updated toast logic:**
```typescript
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

### Required
- **invoiceAddressLine1**: Non-empty after trim
- **invoiceCity**: Non-empty after trim
- **invoicePincode**: Exactly 6 digits (accepts string or number)

### Optional
- **invoiceAddressLine2**: String or empty → undefined
- **invoicePhone**: 10-13 digits, empty → undefined
- **invoiceEmail**: Valid email, empty → undefined, lowercase
- **invoicePrefix**: A-Z0-9, max 8, empty → undefined, uppercase

## Server Logs Output

When validation fails, you'll see:
```
[saveGstStep] Received payload keys: ["gstStatus", "invoiceAddressLine1", "invoiceCity", ...]
[saveGstStep] Payload sample: {
  invoiceAddressLine1: "123 Main St",
  invoiceCity: "Noida",
  invoicePincode: "201005",
  ...
}
[saveGstStep] Validation failed: {
  fieldErrors: {
    "invoicePincode": ["Pincode must be exactly 6 digits"]
  },
  formErrors: [],
  inputKeys: [...],
  inputSample: { ... }
}
```

## API Response Examples

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
    "id": "clx...",
    "onboardingStatus": "IN_PROGRESS",
    "profileCompletionPercent": 50
  }
}
```

## Files Changed

1. **app/actions/onboarding.ts**
   - Added payload logging
   - Enhanced error extraction from flattened Zod errors
   - Improved fieldErrors building

2. **lib/validation/merchantOnboarding.ts**
   - Simplified invoiceAddressLine1, invoiceAddressLine2, invoiceCity
   - Fixed invoicePhone validation (simplified preprocess)
   - Fixed invoicePrefix regex (allows empty string)

3. **components/OnboardingForm.tsx**
   - Improved toast message handling
   - Always shows appropriate message

## Testing Checklist

✅ **Test with screenshot values:**
- addressLine1: "123 Main St" → Should pass
- city: "Noida" → Should pass
- pincode: 201005 → Should pass (accepts number)
- phone: 9773946072 → Should pass (digits only)
- email: Info@smarkitalstech.com → Should pass (normalized to lowercase)
- prefix: MRC → Should pass (uppercased)

✅ **Check server logs:**
- If validation fails, logs will show exact field and reason
- Payload keys logged for debugging
- Input sample logged for verification

✅ **Check UI:**
- Fields with errors show red border
- Error messages appear below each field
- Toast shows "Please fix highlighted fields" when fieldErrors exist
- Errors clear as user types

## Next Steps

1. Test with the provided values
2. Check server console logs to see which field (if any) fails
3. If still failing, the logs will clearly show:
   - Which field failed
   - What value was received
   - What validation rule failed
4. Fix any remaining issues based on logs
