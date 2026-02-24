import React from "react"
import { Order, OrderItem, Merchant } from "@prisma/client"
import { OrderStage } from "@prisma/client"

interface InvoiceTemplateProps {
  order: Order & {
    items: OrderItem[]
    merchant: Merchant
  }
  invoiceData?: {
    invoiceNumber: string
    invoiceDate: string
    invoiceType: "TAX_INVOICE" | "BILL_OF_SUPPLY"
    seller?: {
      name: string
      gstin?: string
      address: string
    }
    buyer?: {
      name: string
      address: string
    }
    taxBreakdown?: {
      taxable: number
      cgst?: number
      sgst?: number
      igst?: number
      total: number
    }
  }
}

/**
 * Invoice Template Component
 * 
 * Renders invoice HTML that can be converted to PDF.
 * Adds "CANCELLED" watermark if order.stage === "CANCELLED"
 */
export function InvoiceTemplate({ order, invoiceData }: InvoiceTemplateProps) {
  const isCancelled = order.stage === "CANCELLED"

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const invoiceNumber = invoiceData?.invoiceNumber || order.invoiceNumber || order.orderNumber
  const invoiceDate = invoiceData?.invoiceDate || 
    (order.invoiceIssuedAt ? formatDate(order.invoiceIssuedAt) : formatDate(order.createdAt))
  const invoiceType = invoiceData?.invoiceType || 
    (order.invoiceType === "TAX_INVOICE" ? "TAX INVOICE" : "BILL OF SUPPLY")

  return (
    <html>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta charSet="utf-8" />
        <title>Invoice {invoiceNumber}</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 40px;
          }

          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            position: relative;
            background: #fff;
          }

          /* Watermark - Only visible if cancelled */
          .watermark {
            display: ${isCancelled ? "block" : "none"};
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 80px;
            font-weight: bold;
            color: rgba(200, 0, 0, 0.15);
            z-index: 1000;
            pointer-events: none;
            user-select: none;
            white-space: nowrap;
            width: 100%;
            text-align: center;
          }

          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #000;
          }

          .header-left h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            color: ${isCancelled ? "#999" : "#000"};
          }

          .header-left .invoice-type {
            font-size: 14px;
            font-weight: 600;
            margin-top: 10px;
            color: ${isCancelled ? "#999" : "#000"};
          }

          .header-right {
            text-align: right;
          }

          .header-right .invoice-number {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 5px;
          }

          .header-right .invoice-date {
            font-size: 12px;
            color: #666;
          }

          .seller-buyer {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
          }

          .section h3 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }

          .section p {
            font-size: 12px;
            margin-bottom: 5px;
            color: ${isCancelled ? "#999" : "#333"};
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }

          .items-table th {
            background: #f5f5f5;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            border: 1px solid #ddd;
          }

          .items-table td {
            padding: 10px;
            border: 1px solid #ddd;
            font-size: 11px;
            color: ${isCancelled ? "#999" : "#333"};
          }

          .items-table tr:nth-child(even) {
            background: #fafafa;
          }

          .totals {
            margin-top: 20px;
            margin-left: auto;
            width: 300px;
          }

          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 12px;
          }

          .totals-row.total {
            font-weight: bold;
            font-size: 14px;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }

          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 11px;
            color: #666;
            text-align: center;
          }

          .footer-cancelled {
            color: #c00;
            font-weight: 600;
            margin-top: 10px;
            font-size: 12px;
          }

          .text-right {
            text-align: right;
          }
        `}</style>
      </head>
      <body>
        {/* Watermark Overlay - Only renders if cancelled */}
        {isCancelled && (
          <div className="watermark">CANCELLED</div>
        )}

        <div className="invoice-container">
          {/* Header */}
          <div className="header">
            <div className="header-left">
              <h1>{invoiceData?.seller?.name || order.merchant.displayName}</h1>
              {invoiceData?.seller?.address && (
                <p style={{ fontSize: "11px", color: isCancelled ? "#999" : "#666" }}>
                  {invoiceData.seller.address}
                </p>
              )}
              {invoiceData?.seller?.gstin && (
                <p style={{ fontSize: "11px", color: isCancelled ? "#999" : "#666" }}>
                  GSTIN: {invoiceData.seller.gstin}
                </p>
              )}
              <div className="invoice-type">{invoiceType}</div>
            </div>
            <div className="header-right">
              <div className="invoice-number">Invoice #: {invoiceNumber}</div>
              <div className="invoice-date">Date: {invoiceDate}</div>
            </div>
          </div>

          {/* Seller & Buyer Info */}
          <div className="seller-buyer">
            <div className="section">
              <h3>Bill From</h3>
              <p>{invoiceData?.seller?.name || order.merchant.displayName}</p>
              {invoiceData?.seller?.address && <p>{invoiceData.seller.address}</p>}
              {invoiceData?.seller?.gstin && <p>GSTIN: {invoiceData.seller.gstin}</p>}
            </div>
            <div className="section">
              <h3>Bill To</h3>
              <p>{invoiceData?.buyer?.name || order.customerName}</p>
              <p>{invoiceData?.buyer?.address || order.customerAddress}</p>
              {order.customerEmail && <p>{order.customerEmail}</p>}
              {order.customerPhone && <p>{order.customerPhone}</p>}
            </div>
          </div>

          {/* Items Table */}
          <table className="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Rate</th>
                {invoiceData?.taxBreakdown && <th className="text-right">Tax</th>}
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => {
                const itemTotal = (item.price * item.quantity) / 100
                return (
                  <tr key={item.id || idx}>
                    <td>{item.productName || `Product ${idx + 1}`}</td>
                    <td>{item.sku || "-"}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{formatCurrency(item.price / 100)}</td>
                    {invoiceData?.taxBreakdown && (
                      <td className="text-right">
                        {invoiceData.taxBreakdown.cgst || invoiceData.taxBreakdown.igst
                          ? `${((invoiceData.taxBreakdown.cgst || invoiceData.taxBreakdown.igst || 0) / invoiceData.taxBreakdown.taxable) * 100}%`
                          : "-"}
                      </td>
                    )}
                    <td className="text-right">{formatCurrency(itemTotal)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals">
            <div className="totals-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal.toNumber())}</span>
            </div>
            {order.tax.toNumber() > 0 && (
              <>
                {invoiceData?.taxBreakdown?.cgst && (
                  <div className="totals-row">
                    <span>CGST:</span>
                    <span>{formatCurrency(invoiceData.taxBreakdown.cgst)}</span>
                  </div>
                )}
                {invoiceData?.taxBreakdown?.sgst && (
                  <div className="totals-row">
                    <span>SGST:</span>
                    <span>{formatCurrency(invoiceData.taxBreakdown.sgst)}</span>
                  </div>
                )}
                {invoiceData?.taxBreakdown?.igst && (
                  <div className="totals-row">
                    <span>IGST:</span>
                    <span>{formatCurrency(invoiceData.taxBreakdown.igst)}</span>
                  </div>
                )}
                {!invoiceData?.taxBreakdown && (
                  <div className="totals-row">
                    <span>Tax:</span>
                    <span>{formatCurrency(order.tax.toNumber())}</span>
                  </div>
                )}
              </>
            )}
            {order.shippingFee.toNumber() > 0 && (
              <div className="totals-row">
                <span>Shipping:</span>
                <span>{formatCurrency(order.shippingFee.toNumber())}</span>
              </div>
            )}
            {order.discount.toNumber() > 0 && (
              <div className="totals-row">
                <span>Discount:</span>
                <span>-{formatCurrency(order.discount.toNumber())}</span>
              </div>
            )}
            <div className="totals-row total">
              <span>Total:</span>
              <span>{formatCurrency(order.totalAmount.toNumber())}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <p>This is a system generated invoice.</p>
            {isCancelled && (
              <p className="footer-cancelled">
                This order has been cancelled. This document is retained for record purposes only.
              </p>
            )}
            <p style={{ marginTop: "10px" }}>
              © {new Date().getFullYear()} {order.merchant.displayName}. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}

/**
 * Helper function to render invoice HTML as string
 * Useful for HTML-to-PDF conversion
 */
export function renderInvoiceHTML(
  order: Order & {
    items: OrderItem[]
    merchant: Merchant
  },
  invoiceData?: InvoiceTemplateProps["invoiceData"]
): string {
  const React = require("react")
  const ReactDOMServer = require("react-dom/server")
  
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(InvoiceTemplate, { order, invoiceData })
  )
}
