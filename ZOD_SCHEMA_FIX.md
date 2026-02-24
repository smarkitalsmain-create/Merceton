# Zod Schema Fix - Union/Transform/Regex Chaining

## Problem
Runtime error: `TypeError: zod.union(...).transform(...).regex is not a function`

**Root Cause:** `.regex()` is only available on `ZodString`, not on `ZodUnion` or `ZodEffects` (returned by `.transform()`).

## Fixed Patterns

### 1. Invoice Pincode (lib/validations/onboarding.ts)

**Before (BROKEN):**
```typescript
invoicePincode: z.union([z.string(), z.number()])
  .transform((val) => String(val))
  .regex(/^[0-9]{6}$/, "Pincode must be 6 digits")
```

**After (FIXED):**
```typescript
invoicePincode: z.coerce.string()
  .trim()
  .regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits")
```

**Why:** `z.coerce.string()` handles both string and number inputs, then we can safely use `.regex()`.

### 2. Invoice Pincode (lib/validation/merchantOnboarding.ts)

**Before (BROKEN):**
```typescript
invoicePincode: z
  .union([z.string(), z.number()])
  .transform((val) => {
    const digits = String(val).replace(/\D/g, "")
    return digits.length === 6 ? digits : null
  })
  .refine((val) => val !== null, "Pincode must be 6 digits")
```

**After (FIXED):**
```typescript
invoicePincode: z
  .coerce.string()
  .trim()
  .transform((val) => {
    // Extract digits only
    const digits = val.replace(/\D/g, "")
    return digits
  })
  .refine((val) => val.length === 6, "Pincode must be exactly 6 digits")
```

**Why:** `z.coerce.string()` handles type coercion, then transform extracts digits, then refine validates length.

### 3. Invoice Phone (lib/validation/merchantOnboarding.ts)

**Before (BROKEN):**
```typescript
invoicePhone: z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((val) => {
    if (!val || val === "") return null
    const digits = String(val).replace(/\D/g, "")
    if (digits.length < 10 || digits.length > 13) {
      return null
    }
    return digits
  })
  .or(z.null())
```

**After (FIXED):**
```typescript
invoicePhone: z.preprocess(
  (v) => {
    if (typeof v !== "string" || v.trim() === "") return null
    return v
  },
  z
    .string()
    .trim()
    .transform((val) => {
      // Remove all non-digits
      const digits = val.replace(/\D/g, "")
      return digits
    })
    .refine((val) => val.length === 0 || (val.length >= 10 && val.length <= 13), {
      message: "Phone must be 10 to 13 digits",
    })
    .nullable()
    .optional()
)
```

**Why:** `z.preprocess()` handles empty string → null conversion safely, then we can use `.refine()` for validation.

### 4. Invoice Email (lib/validation/merchantOnboarding.ts)

**Before (BROKEN):**
```typescript
invoiceEmail: z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((val) => {
    if (!val || val === "") return null
    return String(val).trim().toLowerCase()
  })
  .refine(
    (val) => {
      if (val === null) return true
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(val)
    },
    { message: "Invalid email format" }
  )
  .or(z.null())
```

**After (FIXED):**
```typescript
invoiceEmail: z.preprocess(
  (v) => {
    if (typeof v === "string" && v.trim() === "") return null
    if (typeof v === "string") return v.trim().toLowerCase()
    return v
  },
  z.string().email("Invalid email format").nullable().optional()
)
```

**Why:** `z.preprocess()` handles normalization (trim, lowercase) and empty string → null, then Zod's built-in `.email()` validates.

### 5. Invoice Prefix (lib/validation/merchantOnboarding.ts)

**Before (BROKEN):**
```typescript
invoicePrefix: z
  .string()
  .optional()
  .default("MRC")
  .transform((val) => {
    if (!val || val === "") return "MRC"
    const sanitized = String(val).trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
    return sanitized.slice(0, 8) || "MRC"
  })
```

**After (FIXED):**
```typescript
invoicePrefix: z.preprocess(
  (v) => {
    if (typeof v !== "string") return v
    const t = v.trim()
    if (t === "") return "MRC"
    return t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "MRC"
  },
  z.string()
    .max(8, "Prefix must be 8 characters or less")
    .regex(/^[A-Z0-9]+$/, "Only A-Z and 0-9 allowed")
    .default("MRC")
)
```

**Why:** `z.preprocess()` handles sanitization (uppercase, remove non-alphanumeric), then we can safely use `.regex()` on the string schema.

### 6. Contact Pincode (lib/validation/merchantOnboarding.ts)

**Before (OK but inconsistent):**
```typescript
contactPincode: z
  .string()
  .transform((val) => sanitizePincode(val))
  .refine((val) => val !== null, "Pincode must be 6 digits")
```

**After (FIXED for consistency):**
```typescript
contactPincode: z
  .coerce.string()
  .trim()
  .transform((val) => {
    // Extract digits only
    const digits = val.replace(/\D/g, "")
    return digits
  })
  .refine((val) => val.length === 6, "Pincode must be exactly 6 digits")
```

**Why:** Consistent with invoicePincode pattern, and `z.coerce.string()` handles type coercion.

## Pattern Summary

### For Type Coercion (string/number → string):
```typescript
z.coerce.string()
  .trim()
  .regex(/pattern/, "message")
```

### For Optional Fields with Empty String → Null:
```typescript
z.preprocess(
  (v) => {
    if (typeof v === "string" && v.trim() === "") return null
    // ... other normalization
    return v
  },
  z.string()
    .email() // or .regex(), .max(), etc.
    .nullable()
    .optional()
)
```

### For Sanitization (uppercase, remove chars):
```typescript
z.preprocess(
  (v) => {
    if (typeof v !== "string") return v
    return v.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
  },
  z.string()
    .regex(/^[A-Z0-9]+$/, "Only A-Z and 0-9")
    .max(8)
)
```

## Files Changed

1. **lib/validations/onboarding.ts**
   - Fixed `invoicePincode`: Changed from `union().transform().regex()` to `coerce.string().trim().regex()`

2. **lib/validation/merchantOnboarding.ts**
   - Fixed `invoicePincode`: Changed from `union().transform().refine()` to `coerce.string().trim().transform().refine()`
   - Fixed `invoicePhone`: Changed from `string().transform().or()` to `preprocess()` pattern
   - Fixed `invoiceEmail`: Changed from `string().transform().refine()` to `preprocess()` pattern
   - Fixed `invoicePrefix`: Changed from `string().transform()` to `preprocess()` pattern
   - Fixed `contactPincode`: Changed to consistent `coerce.string()` pattern

## Validation Still Works

✅ **Pincode**: Accepts both string and number, extracts digits, validates 6 digits
✅ **Phone**: Accepts string, removes non-digits, validates 10-13 digits, handles empty string
✅ **Email**: Normalizes to lowercase, trims, validates format, handles empty string
✅ **Prefix**: Uppercases, removes non-alphanumeric, limits to 8 chars, defaults to "MRC"

## Testing

All schemas now:
- ✅ Compile without TypeScript errors
- ✅ Run without runtime errors
- ✅ Validate correctly (pincode, phone, email, prefix)
- ✅ Handle edge cases (empty strings, null, numbers for pincode)
