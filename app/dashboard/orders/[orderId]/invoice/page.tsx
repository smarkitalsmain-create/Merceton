import { notFound } from "next/navigation"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildInvoiceData } from "@/lib/storefront/invoicing/buildInvoiceData"
import { InvoicePrintButton } from "@/components/dashboard/InvoicePrintButton"
import { allocateInvoiceNumberForOrder } from "@/lib/storefront/invoicing/allocateInvoiceNumber"
import Image from "next/image"

export default async function InvoicePage({
  params,
}: {
  params: { orderId: string }
}) {
  const merchant = await requireMerchant()

  // Fetch order with all relations
  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      merchantId: merchant.id,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      merchant: true,
      payment: true,
    },
  })

  if (!order) {
    notFound()
  }

  // Fetch tax profile from onboarding
  let onboarding = null
  try {
    onboarding = await prisma.merchantOnboarding.findUnique({
      where: { merchantId: merchant.id },
    })
  } catch (error) {
    // Continue without tax profile
  }

  // Fetch store settings for logo
  const storeSettings = await prisma.merchantStoreSettings.findUnique({
    where: { merchantId: merchant.id },
    select: {
      logoUrl: true,
    },
  })

  // Also check storefront settings for logo fallback
  const storefrontSettings = await prisma.storefrontSettings.findUnique({
    where: { merchantId: merchant.id },
    select: {
      logoUrl: true,
    },
  })

  const logoUrl = storeSettings?.logoUrl || storefrontSettings?.logoUrl || null

  const taxProfile = onboarding
    ? {
        isGstRegistered: onboarding.gstStatus === "REGISTERED",
        gstin: onboarding.gstin,
        legalName: onboarding.gstLegalName || onboarding.legalBusinessName,
        tradeName: onboarding.gstTradeName || onboarding.storeDisplayName,
        addressLine1: onboarding.invoiceAddressLine1,
        addressLine2: onboarding.invoiceAddressLine2,
        city: onboarding.invoiceCity,
        state: onboarding.gstState,
        stateCode: null,
        pincode: onboarding.invoicePincode,
        email: onboarding.invoiceEmail,
        phone: onboarding.invoicePhone,
      }
    : null

  // Allocate invoice number (transaction-safe)
  const { invoiceNumber, invoiceIssuedAt } = await allocateInvoiceNumberForOrder(
    order.id,
    merchant.id
  )

  // Build invoice data
  const invoiceData = buildInvoiceData(order, taxProfile, invoiceNumber)

  const isTaxInvoice = invoiceData.invoiceType === "TAX_INVOICE"
  const showTaxColumns = isTaxInvoice && invoiceData.taxMode !== "NONE"
  const showCgstSgst = invoiceData.taxMode === "CGST_SGST"
  const showIgst = invoiceData.taxMode === "IGST"

  return (
    <div id="invoice-root" className="min-h-screen bg-gray-50 print:bg-white">
      {/* Print button - hidden on print */}
      <div className="bg-white border-b mb-4 print-hide">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold">Invoice</h1>
          <InvoicePrintButton />
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto bg-white p-8 print:p-0">
        {/* CANCELLED Watermark */}
        {invoiceData.isCancelled && (
          <div className="fixed inset-0 pointer-events-none hidden print:block" style={{ zIndex: 9999 }}>
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
            {/* Logo at top-left */}
            {logoUrl && (
              <div className="mb-4">
                <Image
                  src={logoUrl}
                  alt={invoiceData.seller.tradeName || invoiceData.seller.legalName || "Logo"}
                  width={120}
                  height={60}
                  className="h-auto max-h-16 w-auto object-contain"
                  unoptimized
                />
              </div>
            )}
            <h2 className="text-2xl font-bold mb-2">
              {invoiceData.seller.tradeName || invoiceData.seller.legalName}
            </h2>
            {onboarding?.invoiceAddressLine1 && (
              <p className="text-sm text-gray-600">{onboarding.invoiceAddressLine1}</p>
            )}
            {onboarding?.invoiceAddressLine2 && (
              <p className="text-sm text-gray-600">{onboarding.invoiceAddressLine2}</p>
            )}
            {(onboarding?.invoiceCity || onboarding?.invoiceState || onboarding?.invoicePincode) && (
              <p className="text-sm text-gray-600">
                {[
                  onboarding?.invoiceCity,
                  onboarding?.invoiceState,
                  onboarding?.invoicePincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {onboarding?.invoicePhone && (
              <p className="text-sm text-gray-600">Phone: {onboarding.invoicePhone}</p>
            )}
            {onboarding?.invoiceEmail && (
              <p className="text-sm text-gray-600">Email: {onboarding.invoiceEmail}</p>
            )}
            {invoiceData.seller.gstin && (
              <p className="text-sm text-gray-600 mt-2">GSTIN: {invoiceData.seller.gstin}</p>
            )}
          </div>

          <div className="text-right">
            <h3 className="text-xl font-bold mb-4">
              {invoiceData.invoiceType === "TAX_INVOICE" ? "TAX INVOICE" : "BILL OF SUPPLY"}
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Invoice No: {invoiceNumber}</p>
              <p className="text-gray-600">
                Date: {new Date(invoiceIssuedAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <span className="font-semibold">Order No:</span> {invoiceData.orderNumber}
              </p>
              {invoiceData.paymentStatus && (
                <p>
                  <span className="font-semibold">Payment:</span> {invoiceData.paymentStatus}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-2">Bill To</h4>
            <p className="text-sm">{invoiceData.buyer.name}</p>
            {invoiceData.buyer.billingAddress && (
              <p className="text-sm text-gray-600">{invoiceData.buyer.billingAddress}</p>
            )}
            {(invoiceData.buyer.state || invoiceData.buyer.pincode) && (
              <p className="text-sm text-gray-600">
                {[invoiceData.buyer.state, invoiceData.buyer.pincode].filter(Boolean).join(", ")}
              </p>
            )}
            {invoiceData.buyer.phone && (
              <p className="text-sm text-gray-600">Phone: {invoiceData.buyer.phone}</p>
            )}
            {invoiceData.buyer.email && (
              <p className="text-sm text-gray-600">Email: {invoiceData.buyer.email}</p>
            )}
          </div>

          {invoiceData.buyer.shippingAddress &&
            invoiceData.buyer.shippingAddress !== invoiceData.buyer.billingAddress && (
              <div>
                <h4 className="font-semibold mb-2">Ship To</h4>
                <p className="text-sm text-gray-600">{invoiceData.buyer.shippingAddress}</p>
              </div>
            )}

          <div>
            <h4 className="font-semibold mb-2">Place of Supply</h4>
            <p className="text-sm">{invoiceData.placeOfSupplyState}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">S.No</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Item</th>
                {isTaxInvoice && (
                  <th className="border border-gray-300 px-3 py-2 text-left">HSN</th>
                )}
                <th className="border border-gray-300 px-3 py-2 text-right">Qty</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Rate</th>
                {showTaxColumns && showCgstSgst && (
                  <>
                    <th className="border border-gray-300 px-3 py-2 text-right">CGST%</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">CGST</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">SGST%</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">SGST</th>
                  </>
                )}
                {showTaxColumns && showIgst && (
                  <>
                    <th className="border border-gray-300 px-3 py-2 text-right">IGST%</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">IGST</th>
                  </>
                )}
                <th className="border border-gray-300 px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => {
                const cgstRate = item.gstRate > 0 ? (item.gstRate / 2).toFixed(2) : "0.00"
                return (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-3 py-2">{item.name}</td>
                    {isTaxInvoice && (
                      <td className="border border-gray-300 px-3 py-2">{item.hsn || "-"}</td>
                    )}
                    <td className="border border-gray-300 px-3 py-2 text-right">{item.qty}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      ₹{item.unitPrice.toFixed(2)}
                    </td>
                    {showTaxColumns && showCgstSgst && (
                      <>
                        <td className="border border-gray-300 px-3 py-2 text-right">
                          {cgstRate}%
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-right">
                          ₹{item.cgst.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-right">
                          {cgstRate}%
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-right">
                          ₹{item.sgst.toFixed(2)}
                        </td>
                      </>
                    )}
                    {showTaxColumns && showIgst && (
                      <>
                        <td className="border border-gray-300 px-3 py-2 text-right">
                          {item.gstRate.toFixed(2)}%
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-right">
                          ₹{item.igst.toFixed(2)}
                        </td>
                      </>
                    )}
                    <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                      ₹{item.lineTotal.toFixed(2)}
                    </td>
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
              <span>Subtotal:</span>
              <span>₹{invoiceData.totals.subtotal.toFixed(2)}</span>
            </div>
            {invoiceData.totals.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-₹{invoiceData.totals.discount.toFixed(2)}</span>
              </div>
            )}
            {invoiceData.totals.shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span>Shipping:</span>
                <span>₹{invoiceData.totals.shipping.toFixed(2)}</span>
              </div>
            )}
            {isTaxInvoice && (
              <div className="flex justify-between text-sm">
                <span>Taxable Value:</span>
                <span>₹{invoiceData.totals.taxableTotal.toFixed(2)}</span>
              </div>
            )}
            {showTaxColumns && showCgstSgst && invoiceData.totals.cgstTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span>CGST:</span>
                <span>₹{invoiceData.totals.cgstTotal.toFixed(2)}</span>
              </div>
            )}
            {showTaxColumns && showCgstSgst && invoiceData.totals.sgstTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span>SGST:</span>
                <span>₹{invoiceData.totals.sgstTotal.toFixed(2)}</span>
              </div>
            )}
            {showTaxColumns && showIgst && invoiceData.totals.igstTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span>IGST:</span>
                <span>₹{invoiceData.totals.igstTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total:</span>
                <span>₹{invoiceData.totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 space-y-2">
          <p>This is a system generated document.</p>
          {invoiceData.isCancelled && (
            <p className="text-red-600 font-semibold">
              Order cancelled. Document retained for record.
            </p>
          )}
          <p>
            All rights reserved © {new Date().getFullYear()}{" "}
            {invoiceData.seller.tradeName || invoiceData.seller.legalName}
          </p>
        </div>
      </div>

      {/* Print Styles - Server-safe plain style tag */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @page {
            size: A4;
            margin: 12mm;
          }

          @media print {
            /* Hide all UI by default */
            body * {
              visibility: hidden !important;
            }

            /* Show invoice only */
            #invoice-root,
            #invoice-root * {
              visibility: visible !important;
            }

            /* Put invoice at top-left for printing */
            #invoice-root {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }

            /* Hide print button & any controls */
            .print-hide {
              display: none !important;
            }

            /* Remove shadows/backgrounds */
            body {
              background: #fff !important;
            }

            /* Ensure watermark is visible in print */
            .fixed {
              position: fixed !important;
            }
          }
        `
      }} />
    </div>
  )
}
