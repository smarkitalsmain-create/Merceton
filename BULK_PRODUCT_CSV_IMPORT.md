# Bulk Product CSV Import

## Status: ✅ COMPLETE

This document describes the implementation of bulk product CSV import functionality.

## Features Implemented

### 1. CSV Import API ✅

**File:** `app/api/products/import/route.ts`

- **POST `/api/products/import`**: Handles CSV file upload and import
- **Features:**
  - Accepts multipart form data with CSV file
  - Validates file type (must be .csv)
  - Row limit: Maximum 1000 rows
  - Required columns: `name`, `price`
  - Optional columns: `sku`, `description`, `stock`, `mrp`, `hsnOrSac`, `gstRate`, `isTaxable`
  - Row-by-row validation with detailed error reporting
  - Duplicate detection:
    - Within file (by SKU)
    - Against database (by SKU within merchant)
  - Transactional insert:
    - `all_or_nothing`: Fails if any row has errors
    - `partial_success`: Imports valid rows, skips errors (default)
  - Chunked inserts (200 rows per transaction)
  - Respects product limit feature gating
  - Tenant isolation: All products scoped to merchant

**CSV Parser:**
- Safe, custom parser that handles:
  - Quoted fields
  - Escaped quotes (`""`)
  - Comma-separated values
  - Empty fields

### 2. CSV Import Utilities ✅

**File:** `lib/products/csvImport.ts`

- **`validateCsvRow()`**: Validates a single CSV row using Zod schema
- **`detectDuplicatesWithinFile()`**: Finds duplicate SKUs within the file
- **`normalizeHeaders()`**: Normalizes CSV headers (lowercase, trim)
- **`parseCsvRow()`**: Parses CSV row into object with normalized headers

**Validation Rules:**
- `name`: Required, non-empty string
- `price`: Required, positive number (> 0)
- `sku`: Optional, string
- `description`: Optional, string
- `stock`: Optional, integer >= 0 (default: 0)
- `mrp`: Optional, positive number
- `hsnOrSac`: Optional, string
- `gstRate`: Optional, integer 0-100
- `isTaxable`: Optional, boolean (default: true)

### 3. CSV Template Download ✅

**File:** `app/api/products/import/template/route.ts`

- **GET `/api/products/import/template`**: Downloads CSV template
- Includes example rows with all optional fields
- Shows correct format and data types

### 4. Import UI ✅

**File:** `app/dashboard/products/import/page.tsx`

- **Upload Widget:**
  - File input with CSV validation
  - Template download button
  - Preview first 10 rows
  - Import mode selection (all_or_nothing | partial_success)

- **Error Reporting:**
  - Errors table with row numbers and error messages
  - Duplicate detection display (within file and in database)
  - Validation errors with field-level details

- **Success Summary:**
  - Total rows, valid rows, inserted, skipped counts
  - Visual indicators (colors, badges)
  - Auto-redirect to products page after successful import

**Integration:**
- Added "Import CSV" button to products page (`app/dashboard/products/page.tsx`)
- Feature-gated: Only visible if `BULK_PRODUCT_CSV_IMPORT` feature is enabled

### 5. Tests ✅

**Unit Tests:** `tests/unit/csvImport.test.ts`

- ✅ Header normalization
- ✅ CSV row parsing
- ✅ Row validation (valid, missing fields, invalid values)
- ✅ Duplicate detection within file
- ✅ Case-insensitive duplicate detection
- ✅ Numeric/boolean coercion

**Integration Tests:** `tests/integration/productImport.test.ts`

- ✅ Reject non-CSV files
- ✅ Reject empty CSV files
- ✅ Reject files exceeding row limit
- ✅ Reject files missing required columns
- ✅ Import valid products successfully
- ✅ Detect and skip duplicate SKUs within file
- ✅ Detect and skip duplicate SKUs in database
- ✅ Validate rows and report errors
- ✅ Respect product limit

## Import Flow

1. **User uploads CSV file**
   - File validated (type, size, row count)
   - Headers validated (required columns present)

2. **CSV Parsing**
   - Parse CSV content (handles quoted fields, escaped quotes)
   - Normalize headers (lowercase, trim)
   - Parse each row into object

3. **Validation**
   - Validate each row using Zod schema
   - Collect validation errors with row numbers
   - Detect duplicates within file (by SKU)

4. **Database Check**
   - Query existing products by SKU (within merchant)
   - Detect duplicates in database
   - Check product limit

5. **Insert**
   - Filter valid rows (exclude errors and duplicates)
   - Insert in chunks (200 rows per transaction)
   - Respect product limit (skip if would exceed)

6. **Result**
   - Return summary with:
     - Total rows, valid rows, invalid rows
     - Inserted count, skipped count
     - Errors with row numbers
     - Duplicates (within file and in database)

## CSV Format

### Required Columns
- `name`: Product name (string, required)
- `price`: Product price (number > 0, required)

### Optional Columns
- `sku`: Stock keeping unit (string, optional)
- `description`: Product description (string, optional)
- `stock`: Stock quantity (integer >= 0, default: 0)
- `mrp`: Maximum retail price (number > 0, optional)
- `hsnOrSac`: HSN/SAC code (string, optional)
- `gstRate`: GST rate percentage (integer 0-100, optional)
- `isTaxable`: Whether product is taxable (boolean, default: true)

### Example CSV

```csv
name,price,sku,description,stock,mrp,hsnOrSac,gstRate,isTaxable
Product 1,99.99,SKU-001,Description 1,100,149.99,12345678,18,true
Product 2,199.99,SKU-002,Description 2,50,,,,
```

## Security & Validation

- **Feature Gating:** Only merchants with `BULK_PRODUCT_CSV_IMPORT` feature can import
- **Tenant Isolation:** All products scoped to merchant (enforced at API level)
- **Row Limit:** Maximum 1000 rows per import
- **File Type Validation:** Only .csv files accepted
- **Input Validation:** All fields validated using Zod schemas
- **Duplicate Prevention:** SKU duplicates detected and skipped
- **Product Limit:** Respects merchant's product limit feature

## Error Handling

### Validation Errors
- Missing required fields (name, price)
- Invalid data types (non-numeric price, etc.)
- Invalid values (negative price, etc.)
- Reported with row number and field name

### Duplicate Errors
- Within file: Multiple rows with same SKU
- In database: SKU already exists for merchant
- Reported with row number and SKU

### System Errors
- File too large
- Row limit exceeded
- Product limit reached
- Database errors

## Files Created/Modified

### New Files
- `app/api/products/import/route.ts` - CSV import API endpoint
- `app/api/products/import/template/route.ts` - Template download endpoint
- `app/dashboard/products/import/page.tsx` - Import UI page
- `lib/products/csvImport.ts` - CSV parsing and validation utilities
- `tests/unit/csvImport.test.ts` - Unit tests
- `tests/integration/productImport.test.ts` - Integration tests
- `BULK_PRODUCT_CSV_IMPORT.md` - This document

### Modified Files
- `app/dashboard/products/page.tsx` - Added "Import CSV" button

## Usage

1. **Access Import Page:**
   - Navigate to `/dashboard/products/import`
   - Or click "Import CSV" button on products page

2. **Download Template:**
   - Click "Download Template" to get example CSV

3. **Prepare CSV:**
   - Include required columns: `name`, `price`
   - Add optional columns as needed
   - Maximum 1000 rows

4. **Upload and Import:**
   - Select CSV file
   - Choose import mode (partial_success recommended)
   - Click "Import Products"

5. **Review Results:**
   - Check summary for inserted/skipped counts
   - Review errors table for validation issues
   - Check duplicates list for SKU conflicts

## API Response Examples

### Successful Import

```json
{
  "success": true,
  "result": {
    "totalRows": 100,
    "validRows": 95,
    "invalidRows": 5,
    "inserted": 90,
    "skipped": 10,
    "errors": [
      {
        "rowNumber": 5,
        "data": { "name": "", "price": "99.99" },
        "errors": ["name: Name is required"],
        "isValid": false
      }
    ],
    "duplicates": {
      "withinFile": [
        { "rowNumber": 10, "sku": "SKU-001" }
      ],
      "inDatabase": [
        { "rowNumber": 15, "sku": "SKU-EXISTING" }
      ]
    }
  },
  "message": "Imported 90 products. 10 rows skipped."
}
```

### Validation Error

```json
{
  "error": "Missing required columns: name, price",
  "missingColumns": ["name", "price"]
}
```

### Feature Denied

```json
{
  "error": "Bulk CSV import is not available on your plan. Upgrade to Growth plan to enable this feature.",
  "upgradeRequired": true,
  "featureKey": "BULK_PRODUCT_CSV_IMPORT"
}
```

## Performance Considerations

- **Chunked Inserts:** Products inserted in batches of 200 to avoid transaction timeouts
- **Duplicate Detection:** Single database query for all SKUs (efficient)
- **Validation:** Row-by-row validation (can be optimized for large files)
- **Memory:** CSV parsed in memory (consider streaming for very large files)

## Future Enhancements

- [ ] Streaming CSV parser for very large files
- [ ] Progress indicator for long-running imports
- [ ] Import history/logging
- [ ] Bulk update existing products (update mode)
- [ ] Image URL import (bulk image assignment)
- [ ] Variant import support
- [ ] Category/tag import
- [ ] Export products to CSV (reverse operation)
