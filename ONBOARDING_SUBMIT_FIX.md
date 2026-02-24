# Onboarding Submit Flow Fix

## Problem
Clicking "Save & Continue" shows "Invalid data format" toast but NO API request appears in DevTools Network tab. This indicates client-side validation is failing silently.

## Root Cause
React Hook Form's `handleSubmit` prevents the submit handler from being called when client-side validation fails. Without an `onError` handler, validation errors are not displayed to the user, and no API call is made.

## Solution Implemented

### 1. Added Client-Side Validation Error Handlers

**File:** `components/OnboardingForm.tsx`

**Added `onError` handlers for all three forms:**

```typescript
// PAN Step
const handlePanSubmitError = (errors: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[onboarding] Client-side validation failed:", errors)
  }
  const errorFields = Object.keys(errors)
  if (errorFields.length > 0) {
    toast({
      title: "Please fix highlighted fields",
      description: "Check the fields marked in red below",
      variant: "destructive",
    })
  }
}

// GST Step
const handleGstSubmitError = (errors: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[onboarding] Client-side validation failed:", errors)
    console.log("[onboarding] Form state errors:", gstForm.formState.errors)
  }
  const errorFields = Object.keys(errors)
  if (errorFields.length > 0) {
    toast({
      title: "Please fix highlighted fields",
      description: "Check the fields marked in red below",
      variant: "destructive",
    })
  }
}

// Business Basics Step
const handleBusinessSubmitError = (errors: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[onboarding] Client-side validation failed:", errors)
  }
  const errorFields = Object.keys(errors)
  if (errorFields.length > 0) {
    toast({
      title: "Please fix highlighted fields",
      description: "Check the fields marked in red below",
      variant: "destructive",
    })
  }
}
```

**Updated form tags:**
```typescript
// Before:
<form onSubmit={gstForm.handleSubmit(handleGstSubmit)}>

// After:
<form onSubmit={gstForm.handleSubmit(handleGstSubmit, handleGstSubmitError)}>
```

### 2. Added DEV-Only Logging

**File:** `components/OnboardingForm.tsx`

**Added logs in submit handlers:**
```typescript
const handleGstSubmit = (data: GstStepData) => {
  // DEV-only log
  if (process.env.NODE_ENV === "development") {
    console.log("[onboarding] GST submit clicked", data)
    console.log("[onboarding] Form values:", gstForm.getValues())
    console.log("[onboarding] Form errors:", gstForm.formState.errors)
  }

  startTransition(async () => {
    // DEV-only log
    if (process.env.NODE_ENV === "development") {
      console.log("[onboarding] Calling saveGstStep API with payload:", data)
      console.log("[onboarding] Payload keys:", Object.keys(data))
    }

    const result = await saveGstStep(data)

    // DEV-only log
    if (process.env.NODE_ENV === "development") {
      console.log("[onboarding] API response:", result)
    }
    // ... rest of handler
  })
}
```

**File:** `app/actions/onboarding.ts`

**Added logs in server actions:**
```typescript
export async function saveGstStep(data: unknown) {
  // DEV-only log
  if (process.env.NODE_ENV === "development") {
    console.log("[saveGstStep] Received payload keys:", Object.keys(data as object || {}))
    console.log("[saveGstStep] Payload sample:", {
      invoiceAddressLine1: (data as any)?.invoiceAddressLine1,
      invoiceCity: (data as any)?.invoiceCity,
      invoicePincode: (data as any)?.invoicePincode,
      // ... other fields
    })
  }

  try {
    // ... validation and processing
  }
}
```

### 3. Improved Error Toast Messages

**Updated all submit handlers to show consistent messages:**
- When client-side validation fails: "Please fix highlighted fields"
- When server returns fieldErrors: "Please fix highlighted fields"
- When server returns generic error: Show specific error message

### 4. Verified Form Submission

**All forms use proper React Hook Form pattern:**
- `<form onSubmit={form.handleSubmit(onSubmit, onError)}>`
- `<Button type="submit">` (ensures form submission)
- No `preventDefault` blocking submission

## Debugging Flow

### When Client-Side Validation Fails:
1. User clicks "Save & Continue"
2. React Hook Form validates
3. If invalid, `onError` handler is called
4. Console shows: `[onboarding] Client-side validation failed: { field: "error message" }`
5. Toast shows: "Please fix highlighted fields"
6. Fields are highlighted in red (React Hook Form handles this)
7. **NO API call is made** (expected behavior)

### When Client-Side Validation Passes:
1. User clicks "Save & Continue"
2. React Hook Form validates
3. If valid, `onSubmit` handler is called
4. Console shows: `[onboarding] GST submit clicked` + payload
5. Console shows: `[onboarding] Calling saveGstStep API with payload`
6. **API call is made** (visible in Network tab)
7. Server logs: `[saveGstStep] Received payload keys`
8. Server processes and returns response
9. Console shows: `[onboarding] API response`
10. UI updates based on response

## API Endpoints

All onboarding steps use **Server Actions** (not API routes):

- **PAN Step:** `savePanStep(data)` - Server Action
- **GST Step:** `saveGstStep(data)` - Server Action
- **Business Basics Step:** `saveBusinessBasicsStep(data)` - Server Action

**Note:** Server Actions don't appear in Network tab as traditional XHR/Fetch requests. They use Next.js's RPC mechanism. To see them:
1. Check Console logs (DEV mode)
2. Check Network tab for `_next/data` requests
3. Or use React DevTools to see the action calls

## Expected Payload Keys (GST Step)

```typescript
{
  gstStatus: "REGISTERED" | "APPLIED" | "NOT_REGISTERED",
  gstin?: string,
  gstLegalName?: string,
  gstTradeName?: string,
  gstState?: string,
  gstComposition: boolean,
  gstNotRegisteredReason?: string,
  // Invoice/Billing Address
  invoiceAddressLine1: string,
  invoiceAddressLine2?: string,
  invoiceCity: string,
  invoicePincode: string | number, // Accepts both
  invoicePhone?: string,
  invoiceEmail?: string,
  invoicePrefix?: string,
}
```

## Files Changed

1. **components/OnboardingForm.tsx**
   - Added `handlePanSubmitError`, `handleGstSubmitError`, `handleBusinessSubmitError`
   - Added DEV logs in all submit handlers
   - Updated form tags to include `onError` handlers
   - Improved error toast messages

2. **app/actions/onboarding.ts**
   - Added DEV logs in `savePanStep`, `saveGstStep`, `saveBusinessBasicsStep`
   - Wrapped existing logs in DEV-only checks

## Testing Checklist

✅ **Client-Side Validation:**
- Fill form with invalid data (e.g., empty required fields)
- Click "Save & Continue"
- Should see toast: "Please fix highlighted fields"
- Should see fields highlighted in red
- Should see console log: `[onboarding] Client-side validation failed`
- **Should NOT see API call** (expected)

✅ **Server-Side Validation:**
- Fill form with valid data
- Click "Save & Continue"
- Should see console log: `[onboarding] GST submit clicked`
- Should see console log: `[onboarding] Calling saveGstStep API`
- Should see server log: `[saveGstStep] Received payload keys`
- Should see API response in console
- Should see success toast or field errors

✅ **Success Flow:**
- Fill all required fields correctly
- Click "Save & Continue"
- Should see success toast
- Should advance to next step

## Next Steps

1. Test with invalid data → Should show field errors, no API call
2. Test with valid data → Should make API call, show success/errors
3. Check Console logs to trace exact flow
4. If still seeing "Invalid data format", check `lib/api/error.ts` - it may be coming from server-side Prisma validation errors
