import Image from "next/image"
import { Decimal } from "@prisma/client/runtime/library"
import { PlatformInvoicePrintButton } from "./PlatformInvoicePrintButton"

interface PlatformInvoiceHtmlProps {
  billingProfile: {
    legalName: string
    gstin?: string | null
    addressLine1?: string | null
    addressLine2?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    email?: string | null
    phone?: string | null
  }
  merchant: {
    displayName: string
    onboarding?: {
      invoiceEmail?: string | null
      invoicePhone?: string | null
      invoiceAddressLine1?: string | null
      invoiceAddressLine2?: string | null
      invoiceCity?: string | null
      invoiceState?: string | null
      invoicePincode?: string | null
    } | null
  }
  invoice: {
    invoiceNumber: string
    invoiceDate: Date
    subtotal: Decimal
    gstAmount: Decimal
    total: Decimal
    status: "ISSUED" | "CANCELLED" | "PAID"
    cancelledAt?: Date | null
  }
  cycle: {
    periodStart: Date
    periodEnd: Date
  }
  lineItems: Array<{
    type: string
    description: string
    sacCode?: string | null
    quantity: Decimal
    unitPrice: Decimal
    amount: Decimal
    gstRate: Decimal
    gstAmount: Decimal
    totalAmount: Decimal
  }>
}

export function PlatformInvoiceHtml({
  billingProfile,
  merchant,
  invoice,
  cycle,
  lineItems,
}: PlatformInvoiceHtmlProps) {
  const isCancelled = invoice.status === "CANCELLED"
  const subtotal = invoice.subtotal.toNumber()
  const gstAmount = invoice.gstAmount.toNumber()
  const total = invoice.total.toNumber()

  // Format seller address
  const sellerAddress = [
    billingProfile.addressLine1,
    billingProfile.addressLine2,
    billingProfile.city,
    billingProfile.state,
    billingProfile.pincode,
  ]
    .filter(Boolean)
    .join(", ")

  // Format merchant address
  const merchantAddress = merchant.onboarding
    ? [
        merchant.onboarding.invoiceAddressLine1,
        merchant.onboarding.invoiceAddressLine2,
        merchant.onboarding.invoiceCity,
        merchant.onboarding.invoiceState,
        merchant.onboarding.invoicePincode,
      ]
      .filter(Boolean)
      .join(", ")
    : null

  return (
    <div id="invoice-print" className="min-h-screen bg-gray-50 print:bg-white">
      {/* Print button - hidden on print */}
      <div className="bg-white border-b mb-4 print-hide">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold">Platform Invoice</h1>
          <PlatformInvoicePrintButton />
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto bg-white p-8 print:p-0" style={{ minHeight: "297mm" }}>
        {/* CANCELLED Watermark */}
        {isCancelled && (
          <div
            className="fixed inset-0 pointer-events-none hidden print:block"
            style={{ zIndex: 9999 }}
          >
            <div
              className="absolute text-red-500 font-bold whitespace-nowrap"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(-30deg)",
                fontSize: "120px",
                opacity: 0.12,
                zIndex: 9999,
              }}
            >
              CANCELLED
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{billingProfile.legalName}</h2>
            {sellerAddress && <p className="text-sm text-gray-600">{sellerAddress}</p>}
            {billingProfile.phone && (
              <p className="text-sm text-gray-600">Phone: {billingProfile.phone}</p>
            )}
            {billingProfile.email && (
              <p className="text-sm text-gray-600">Email: {billingProfile.email}</p>
            )}
            {billingProfile.gstin && (
              <p className="text-sm text-gray-600 mt-2">GSTIN: {billingProfile.gstin}</p>
            )}
          </div>

          <div className="text-right">
            <h3 className="text-xl font-bold mb-4">TAX INVOICE</h3>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Invoice No: {invoice.invoiceNumber}</p>
              <p className="text-gray-600">
                Date: {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <span className="font-semibold">Period:</span>{" "}
                {new Date(cycle.periodStart).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {new Date(cycle.periodEnd).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-2">Bill To</h4>
            <p className="text-sm font-medium">{merchant.displayName}</p>
            {merchantAddress && <p className="text-sm text-gray-600">{merchantAddress}</p>}
            {merchant.onboarding?.invoicePhone && (
              <p className="text-sm text-gray-600">Phone: {merchant.onboarding.invoicePhone}</p>
            )}
            {merchant.onboarding?.invoiceEmail && (
              <p className="text-sm text-gray-600">Email: {merchant.onboarding.invoiceEmail}</p>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-2">Place of Supply</h4>
            <p className="text-sm">
              {merchant.onboarding?.invoiceState || billingProfile.state || "N/A"}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">S.No</th>
                <th className="border p-2 text-left">Description</th>
                <th className="border p-2 text-left">SAC</th>
                <th className="border p-2 text-right">Qty</th>
                <th className="border p-2 text-right">Rate</th>
                <th className="border p-2 text-right">Amount</th>
                <th className="border p-2 text-right">GST %</th>
                <th className="border p-2 text-right">GST Amt</th>
                <th className="border p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => {
                const qty = item.quantity.toNumber()
                const unitPrice = item.unitPrice.toNumber()
                const amount = item.amount.toNumber()
                const gstRate = item.gstRate.toNumber()
                const gstAmt = item.gstAmount.toNumber()
                const totalAmt = item.totalAmount.toNumber()

                return (
                  <tr key={idx}>
                    <td className="border p-2">{idx + 1}</td>
                    <td className="border p-2">{item.description}</td>
                    <td className="border p-2">{item.sacCode || "-"}</td>
                    <td className="border p-2 text-right">{qty.toFixed(2)}</td>
                    <td className="border p-2 text-right">₹{unitPrice.toFixed(2)}</td>
                    <td className="border p-2 text-right">₹{amount.toFixed(2)}</td>
                    <td className="border p-2 text-right">{gstRate.toFixed(2)}%</td>
                    <td className="border p-2 text-right">₹{gstAmt.toFixed(2)}</td>
                    <td className="border p-2 text-right font-medium">₹{totalAmt.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST:</span>
              <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t text-xs text-gray-600">
          {isCancelled && (
            <p className="text-red-600 font-medium mb-2">
              This invoice has been cancelled. This document is retained for record purposes only.
            </p>
          )}
          <p>This is a system generated invoice.</p>
          <p className="mt-1">All rights reserved © {billingProfile.legalName}</p>
        </div>
      </div>

      {/* Print CSS */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print, #invoice-print * {
            visibility: visible;
          }
          #invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-hide {
            display: none !important;
          }
        }
      `,
        }}
      />
    </div>
  )
}
