# Step-Scoped Validation Fix

## Problem
Repeatedly getting toast "Validation failed. Please check all fields and try again." on onboarding invoice step. Values look valid, but validation is failing because:
- Backend is validating GST fields when saving invoice step
- Payload key mismatch between frontend and backend
- Optional/trim/coerce mismatch

## Solution Implemented

### 1. Created Invoice-Only Validation Schema

**File:** `lib/validation/invoiceStep.ts`

**Created separate schema that validates ONLY invoice fields:**
- `invoiceAddressLine1` (required)
- `invoiceCity` (required)
- `invoicePincode` (required, 6 digits)
- `invoiceAddressLine2` (optional)
- `invoicePhone` (optional, 10-13 digits)
- `invoiceEmail` (optional, email format)
- `invoicePrefix` (optional, A-Z0-9, max 8)
- `invoiceState` (optional)

**Does NOT require GST fields** (gstStatus, gstin, etc.)

### 2. Implemented Payload Normalization

**Function:** `normalizeInvoicePayload(body)`

**Maps various frontend key names to backend expected keys:**
```typescript
{
  invoiceAddressLine1: body.invoiceAddressLine1 ?? body.addressLine1 ?? body.address ?? "",
  invoiceAddressLine2: body.invoiceAddressLine2 ?? body.addressLine2 ?? undefined,
  invoiceCity: body.invoiceCity ?? body.city ?? "",
  invoicePincode: body.invoicePincode ?? body.pincode ?? body.postalCode ?? "",
  invoicePhone: body.invoicePhone ?? body.phone ?? body.phoneNumber ?? undefined,
  invoiceEmail: body.invoiceEmail ?? body.email ?? undefined,
  invoicePrefix: body.invoicePrefix ?? body.invoiceNumberPrefix ?? body.prefix ?? undefined,
  invoiceState: body.invoiceState ?? body.state ?? body.gstState ?? undefined,
}
```

### 3. Added Step Parameter to Server Action

**File:** `app/actions/onboarding.ts`

**Updated `saveGstStep` to accept `step` parameter:**
```typescript
export async function saveGstStep(data: unknown) {
  const payload = data as any
  const step = payload?.step || "gst" // Default to "gst" for backward compatibility
  
  if (step === "invoice") {
    // Validate ONLY invoice fields
    const normalized = normalizeInvoicePayload(payload)
    const parsed = invoiceStepSchema.safeParse(normalized)
    
    if (!parsed.success) {
      // Return field-level errors
      const fieldErrors: Record<string, string> = {}
      for (const err of parsed.error.errors) {
        const fieldPath = err.path.join(".")
        if (fieldPath) {
          fieldErrors[fieldPath] = err.message
        }
      }
      
      return {
        success: false,
        error: "Please fix highlighted fields",
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      }
    }
    
    sanitized = { ok: true, data: parsed.data }
  } else {
    // Validate full GST step (includes GST + invoice fields)
    sanitized = sanitizeGstStep(data)
  }
}
```

### 4. Step-Scoped Database Updates

**For invoice step, only update invoice fields:**
```typescript
if (step === "invoice") {
  updateData.invoiceAddressLine1 = sanitized.data.invoiceAddressLine1
  updateData.invoiceCity = sanitized.data.invoiceCity
  updateData.invoicePincode = sanitized.data.invoicePincode
  // ... other invoice fields
} else {
  // Update all GST step fields
  Object.assign(updateData, sanitized.data)
}
```

### 5. Frontend Step Parameter

**File:** `components/OnboardingForm.tsx`

**Added step parameter when calling server action:**
```typescript
const result = await saveGstStep({ ...data, step: "invoice" })
```

## API Contract

### Invoice Step Request
```typescript
{
  step: "invoice",
  invoiceAddressLine1: string,
  invoiceCity: string,
  invoicePincode: string | number,
  invoiceAddressLine2?: string,
  invoicePhone?: string,
  invoiceEmail?: string,
  invoicePrefix?: string,
  invoiceState?: string,
  // GST fields are NOT required
}
```

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
    "invoicePincode": "Pincode must be exactly 6 digits"
  }
}
```

## Expected Behavior

### When Invoice Step is Saved:
1. Frontend sends `{ ...data, step: "invoice" }`
2. Backend normalizes payload keys
3. Backend validates ONLY invoice fields (not GST fields)
4. If validation fails, returns field-level errors
5. Frontend highlights fields in red with error messages
6. Toast shows: "Please fix highlighted fields"

### When GST Step is Saved:
1. Frontend sends `{ ...data }` (no step parameter, defaults to "gst")
2. Backend validates full GST step (GST + invoice fields)
3. If validation fails, returns field-level errors
4. Frontend highlights fields in red with error messages

## Files Changed

1. **lib/validation/invoiceStep.ts** (NEW)
   - Invoice-only validation schema
   - Payload normalization function

2. **app/actions/onboarding.ts**
   - Added step parameter support
   - Step-scoped validation logic
   - Step-scoped database updates

3. **components/OnboardingForm.tsx**
   - Added step parameter when calling saveGstStep

## Testing Checklist

✅ **Invoice Step with Valid Data:**
- Fill invoice fields only (no GST fields)
- Click "Save & Continue"
- Should see console: `[saveGstStep] Step: invoice`
- Should see console: `[saveGstStep] Normalized invoice payload`
- Should succeed and advance to next step

✅ **Invoice Step with Invalid Data:**
- Fill invoice fields with invalid data (e.g., empty address, invalid pincode)
- Click "Save & Continue"
- Should see console: `[saveGstStep] Invoice validation failed`
- Should see fields highlighted in red with error messages
- Should see toast: "Please fix highlighted fields"
- Should NOT show "Validation failed. Please check all fields and try again."

✅ **GST Step (Full Validation):**
- Fill both GST and invoice fields
- Click "Save & Continue"
- Should validate all fields
- Should work as before

## Debugging

If you still see "Validation failed":
1. Check Console logs: `[saveGstStep] Step:` and `[saveGstStep] Normalized invoice payload:`
2. Check Console logs: `[saveGstStep] Invoice validation failed:` to see exact field errors
3. Verify payload keys match normalized keys
4. Check if step parameter is being sent correctly
