# Invoice Fonts

This directory contains TTF font files required for PDF invoice generation.

## Required Files

- `NotoSans-Regular.ttf` - Regular font for body text
- `NotoSans-Bold.ttf` - Bold font for headings

## Download Fonts

Run the download script:

```bash
bash scripts/download-fonts.sh
```

Or manually download from:
- https://fonts.google.com/noto/specimen/Noto+Sans
- Or use any TTF fonts (DejaVu Sans, Arial, etc.)

## Alternative: Use System Fonts

If you prefer, you can use any TTF fonts by:
1. Placing them in this directory
2. Updating the font file names in `lib/storefront/invoicing/pdf/generateInvoicePdf.ts`

## Important

These font files MUST be committed to the repository for PDF generation to work in production.
