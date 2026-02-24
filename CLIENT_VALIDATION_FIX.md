# Client-Side Validation Fix - "Invalid data format" Toast

## Problem
Clicking "Save & Continue" shows "Invalid data format" toast but NO API request appears in DevTools Network. This indicates client-side validation is failing silently and the error is being caught somewhere.

## Root Cause
The "Invalid data format" message comes from `lib/api/error.ts` line 72, which is used for Prisma validation errors. However, since there's no network request, the error must be happening client-side and being caught in a try/catch that shows this generic message.

## Solution Implemented

### 1. Enhanced Client-Side Error Handling

**File:** `components/OnboardingForm.tsx`

**Added try/catch blocks around all server action calls:**
- Wrapped `savePanStep`, `saveGstStep`, and `saveBusinessBasicsStep` calls in try/catch
- If error message contains "Invalid data format", replace with user-friendly message
- Never show raw "Invalid data format" to users

**Example:**
```typescript
try {
  const result = await saveGstStep(data)
  // ... handle result
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Failed to save GST details"
  toast({
    title: "Error",
    description: errorMessage.includes("Invalid data format") 
      ? "Validation failed. Please check the fields below."
      : errorMessage,
    variant: "destructive",
  })
}
```

### 2. Improved Client-Side Validation Error Handling

**Enhanced `onError` handlers for all forms:**
- Added explicit error mapping to form fields
- Better logging to identify which fields failed
- Clear toast message: "Please fix highlighted fields"

**Example:**
```typescript
const handleGstSubmitError = (errors: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[onboarding] Client-side validation failed - preventing API call")
    console.log("[onboarding] Validation errors:", errors)
  }

  // Map errors to form fields
  for (const [field, error] of Object.entries(errors)) {
    if (error && typeof error === "object" && "message" in error) {
      gstForm.setError(field as keyof GstStepData, {
        type: "validation",
        message: (error as any).message || "Invalid value",
      })
    }
  }
  
  toast({
    title: "Please fix highlighted fields",
    description: "Check the fields marked in red below",
    variant: "destructive",
  })
}
```

### 3. Enhanced DEV-Only Logging

**Added comprehensive logging at every step:**

**On Submit Click:**
```typescript
console.log("[onboarding] Save & Continue clicked - GST step")
console.log("[onboarding] Validated data:", data)
```

**Before API Call:**
```typescript
console.log("[onboarding] Sending payload to saveGstStep:", data)
console.log("[onboarding] Payload keys:", Object.keys(data))
```

**On Client-Side Validation Failure:**
```typescript
console.log("[onboarding] Client-side validation failed - preventing API call")
console.log("[onboarding] Validation errors:", errors)
```

**On API Error:**
```typescript
console.error("[onboarding] Error calling saveGstStep:", error)
```

## Expected Behavior

### When Client-Side Validation Fails:
1. User clicks "Save & Continue"
2. React Hook Form validates using `zodResolver`
3. If invalid, `onError` handler is called
4. Console shows: `[onboarding] Client-side validation failed - preventing API call`
5. Fields are highlighted in red with error messages
6. Toast shows: "Please fix highlighted fields"
7. **NO API call is made** (expected - validation prevents submission)

### When Client-Side Validation Passes:
1. User clicks "Save & Continue"
2. React Hook Form validates
3. If valid, `onSubmit` handler is called
4. Console shows: `[onboarding] Save & Continue clicked`
5. Console shows: `[onboarding] Sending payload to saveGstStep`
6. **API call is made** (Server Action - may not show as XHR in Network tab)
7. Server processes and returns response
8. Console shows: `[onboarding] API response`
9. UI updates based on response

### When API Call Fails:
1. Try/catch catches the error
2. Console shows: `[onboarding] Error calling saveGstStep`
3. If error message contains "Invalid data format", replace with: "Validation failed. Please check the fields below."
4. Otherwise show actual error message
5. Toast displays user-friendly error

## Files Changed

1. **components/OnboardingForm.tsx**
   - Added try/catch blocks around all server action calls
   - Enhanced `onError` handlers to map errors to form fields
   - Improved DEV-only logging throughout
   - Replaced "Invalid data format" with user-friendly messages

## Testing Checklist

✅ **Client-Side Validation Failure:**
- Fill form with invalid data (e.g., empty required fields)
- Click "Save & Continue"
- Should see console: `[onboarding] Client-side validation failed - preventing API call`
- Should see fields highlighted in red with error messages
- Should see toast: "Please fix highlighted fields"
- **Should NOT see API call** (expected)

✅ **Valid Data Submission:**
- Fill form with valid data
- Click "Save & Continue"
- Should see console: `[onboarding] Save & Continue clicked`
- Should see console: `[onboarding] Sending payload to saveGstStep`
- Should see console: `[onboarding] API response`
- Should see success toast or field errors from server

✅ **API Error Handling:**
- If API throws error, should see console: `[onboarding] Error calling saveGstStep`
- Should see user-friendly error message (not "Invalid data format")
- Should see toast with actual error or generic message

## Debugging

If you still see "Invalid data format":
1. Check Console logs to see which path is being taken
2. If you see "Client-side validation failed", check the validation errors object
3. If you see "Error calling saveGstStep", check the error object
4. The logs will clearly show where the error is coming from

## Next Steps

1. Test with invalid data → Should show field errors, no API call
2. Test with valid data → Should make API call, show success/errors
3. Check Console logs to trace exact flow
4. If still seeing "Invalid data format", the logs will show the exact source
