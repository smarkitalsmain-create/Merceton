# Zod Default() Method Fix

## Problem
Runtime error: `z.string(...).optional(...).default(...).max is not a function`

**Root Cause:** In this Zod build, calling `.default()` returns a schema type that doesn't expose string-specific methods like `.max()`, `.min()`, `.regex()`, `.email()`. Chaining string validators AFTER `.default()` breaks at runtime.

## Fixed Patterns

### Rule Applied
1. Apply all string validations FIRST: `trim()`, `min()`, `max()`, `regex()`, `email()`
2. THEN apply `.optional()` / `.nullable()` if needed
3. THEN apply `.default()` as the FINAL method (if truly needed at schema level)

### 1. Frontend Schema (`lib/validations/onboarding.ts`)

**Before (BROKEN):**
```typescript
invoicePrefix: z.string().optional().default("MRC").max(8, "Prefix must be 8 characters or less"),
```

**After (FIXED):**
```typescript
invoicePrefix: z.string()
  .trim()
  .max(8, "Prefix must be 8 characters or less")
  .regex(/^[A-Z0-9]*$/, "Only A-Z and 0-9 allowed")
  .optional()
```

**Why:** 
- Removed schema-level `.default()` since UI already sets `defaultValue: "MRC"` in the form
- Applied string validations first, then `.optional()`
- Changed regex to `/^[A-Z0-9]*$/` (with `*` instead of `+`) to allow empty string for optional field

### 2. Backend Schema (`lib/validation/merchantOnboarding.ts`)

**Before (BROKEN):**
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
    .default("MRC")  // ❌ .default() after string methods
)
```

**After (FIXED):**
```typescript
invoicePrefix: z.preprocess(
  (v) => {
    if (typeof v !== "string") return v
    const t = v.trim()
    // Treat empty string as undefined (UI handles default "MRC")
    if (t === "") return undefined
    const sanitized = t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)
    return sanitized || undefined
  },
  z.string()
    .trim()
    .max(8, "Prefix must be 8 characters or less")
    .regex(/^[A-Z0-9]+$/, "Only A-Z and 0-9 allowed")
    .optional()  // ✅ No .default() - handled in sanitizer function
)
```

**Why:**
- Removed `.default()` from schema (UI already handles default)
- Preprocess returns `undefined` for empty strings
- Applied string validations first, then `.optional()`
- Default value "MRC" is applied in the sanitizer function when building Prisma data

### 3. Sanitizer Function Update

**Updated `sanitizeGstStep()` to handle default:**
```typescript
const data: Prisma.MerchantOnboardingUpdateInput = {
  // ... other fields
  // Use "MRC" as default if undefined (UI handles default, but ensure DB has value)
  invoicePrefix: validated.invoicePrefix || "MRC",
}
```

**Why:** Ensures database always has a value even if form sends undefined/empty string.

## Pattern Summary

### ✅ Correct Pattern A: Required string with default
```typescript
z.string()
  .trim()
  .max(8, "Max 8")
  .default("MRC")  // ✅ Default AFTER all validations
```

### ✅ Correct Pattern B: Optional string with default (using preprocess)
```typescript
z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string()
    .trim()
    .max(8, "Max 8")
    .regex(/^[A-Z0-9]+$/, "Only A-Z0-9")
    .optional()  // ✅ Optional AFTER validations
).default("MRC")  // ✅ Default at end if needed
```

### ✅ Correct Pattern C: Optional without default (preferred for forms)
```typescript
z.string()
  .trim()
  .max(8)
  .regex(/^[A-Z0-9]+$/)
  .optional()  // ✅ No default - UI handles it
```

## Files Changed

1. **lib/validations/onboarding.ts**
   - Fixed `invoicePrefix`: Removed `.default()` before `.max()`
   - Changed to: `.trim().max().regex().optional()`

2. **lib/validation/merchantOnboarding.ts**
   - Fixed `invoicePrefix`: Removed `.default()` from inner schema
   - Updated preprocess to return `undefined` for empty strings
   - Applied default "MRC" in sanitizer function when building Prisma data

## Validation Still Works

✅ **invoicePrefix**:
- Accepts string input
- Trims whitespace
- Uppercases and removes non-alphanumeric (in preprocess)
- Limits to 8 characters
- Validates A-Z and 0-9 only
- Optional field (can be empty)
- Defaults to "MRC" in UI and database

## Testing

All schemas now:
- ✅ Compile without TypeScript errors
- ✅ Run without runtime errors
- ✅ Validate correctly (max length, regex pattern)
- ✅ Handle empty strings properly (returns undefined, defaults to "MRC" in DB)

## Notes

- UI already sets `defaultValue: "MRC"` in the form, so schema-level default was redundant
- Database default is handled in the sanitizer function to ensure consistency
- Empty string is converted to `undefined` in preprocess, then defaults to "MRC" when building Prisma data
