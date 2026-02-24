# Billing Invoices System

## Overview

The billing invoice system allows merchants and super admins to download on-demand invoices for platform fees. Invoices are generated from ledger entries (the single source of truth) and include proper GST compliance for India.

## Key Features

- **On-Demand Generation**: No manual invoice creation; invoices are generated on-demand from ledger entries
- **Ledger as Source of Truth**: All calculations are derived from immutable ledger entries
- **GST Compliant**: Automatically calculates CGST+SGST (same state) or IGST (different state)
- **Sequential Invoice Numbers**: Unique per financial year (India FY: Apr 1 - Mar 31)
- **Audit Trail**: InvoiceRecord model tracks all generated invoices

## Invoice Numbering

Invoice numbers follow the format: `MERC/FY25-26/000123`

- **Prefix**: `MERC` (Merceton)
- **Financial Year**: `FY25-26` (e.g., April 2025 - March 2026)
- **Sequence**: `000123` (6-digit padded number, increments per FY)

Invoice numbers are allocated atomically using database transactions to prevent duplicates.

## Financial Year Calculation

India's financial year runs from **April 1 to March 31**.

- Months **April - December**: FY is `YYYY-(YY+1)` (e.g., April 2025 = FY 2025-26)
- Months **January - March**: FY is `(YYYY-1)-YY` (e.g., January 2025 = FY 2024-25)

## Tax Calculation

### CGST + SGST (Same State)
- Applied when merchant's state code matches Merceton's state code
- 18% GST split as:
  - 9% CGST (Central GST)
  - 9% SGST (State GST)

### IGST (Different State)
- Applied when merchant's state code differs from Merceton's state code
- 18% GST as single IGST (Integrated GST)

## Usage

### Merchant Dashboard

1. Navigate to `/dashboard/billing`
2. Select date range (defaults to current month)
3. View summary cards (Taxable Value, GST, Total Fees)
4. Click "Download Invoice (PDF)" or "Download Statement (CSV)"

### Super Admin

1. Navigate to `/admin/merchants/[merchantId]/billing`
2. Same interface as merchant, but for any merchant
3. Shows merchant name, GSTIN, and state

## API Endpoints

### GET /api/billing/invoice.pdf

**Query Parameters:**
- `merchantId` (optional for merchants, required for admins)
- `from` (required): Start date (YYYY-MM-DD)
- `to` (required): End date (YYYY-MM-DD)

**Response:** PDF file with invoice

**Authorization:**
- Merchants can only access their own invoices
- Admins can access any merchant's invoice

### GET /api/billing/statement.csv

**Query Parameters:**
- `merchantId` (optional for merchants, required for admins)
- `from` (required): Start date (YYYY-MM-DD)
- `to` (required): End date (YYYY-MM-DD)

**Response:** CSV file with ledger entries

## Database Models

### LedgerEntry (Extended)

Added GST fields:
- `baseAmountPaise`: Taxable amount before GST
- `gstAmountPaise`: Total GST amount
- `totalAmountPaise`: Total including GST
- `taxType`: CGST_SGST or IGST
- `cgstPaise`, `sgstPaise`, `igstPaise`: Individual tax components
- `occurredAt`: When transaction occurred (for invoice period grouping)
- `orderId`: Made nullable (can be null for non-order fees)

### InvoiceSequence

Tracks sequential invoice numbers per financial year:
- `financialYear`: "2025-26"
- `lastNumber`: Last allocated number

### InvoiceRecord

Audit trail of generated invoices:
- `invoiceNumber`: Unique invoice number
- `periodFrom`, `periodTo`: Invoice period
- `generatedBy`: MERCHANT, ADMIN, or SYSTEM
- Links to ledger entries via `invoiceRecordId`

## Development

### Seed Sample Data

```bash
npx tsx scripts/seed-billing-data.ts
```

This creates:
- 2 test merchants (Maharashtra and Delhi)
- 5 orders per merchant
- PLATFORM_FEE ledger entries with proper GST split

### Testing Invoice Generation

1. Run seed script
2. Navigate to merchant billing page
3. Select date range covering seeded orders
4. Download invoice PDF
5. Verify:
   - Invoice number format
   - GST calculation (CGST+SGST vs IGST)
   - Line items grouped by order
   - Totals match ledger entries

## Important Notes

1. **Ledger Entries are Immutable**: Once created, ledger entries should not be updated. Use reversal entries if needed.

2. **No Duplicate Totals**: Invoice totals are always calculated from ledger entries, never stored separately.

3. **Timezone Handling**: Dates are treated as Asia/Kolkata (IST) boundaries for period selection.

4. **Empty Periods**: If no ledger entries exist in the selected period, invoice download is disabled.

5. **Invoice Record Creation**: InvoiceRecord is created for audit trail but is non-blocking (won't fail invoice generation if it fails).
