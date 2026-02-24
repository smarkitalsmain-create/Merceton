// This file is deprecated - invoice settings now use /api/settings/invoice route
// Keeping for backward compatibility type exports only (no "use server")

export interface InvoiceSettingsData {
  invoicePrefix: string
  invoiceNextNumber: number
  invoiceNumberPadding: number
  invoiceSeriesFormat?: string
  resetFy: boolean
}
