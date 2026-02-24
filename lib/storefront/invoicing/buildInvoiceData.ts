import { Order, OrderItem, Merchant } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

interface StoreTaxProfile {
  isGstRegistered: boolean
  gstin?: string | null
  legalName?: string | null
  tradeName?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  stateCode?: string | null
  pincode?: string | null
  email?: string | null
  phone?: string | null
}

export interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string
  invoiceType: "TAX_INVOICE" | "BILL_OF_SUPPLY"
  isCancelled: boolean
  orderNumber: string
  paymentStatus?: string
  paymentMethod?: string
  seller: {
    legalName: string
    tradeName?: string
    gstin?: string
    address: string
    city?: string
    state: string
    pincode?: string
    phone?: string
    email?: string
  }
  buyer: {
    name: string
    phone?: string
    email?: string
    billingAddress?: string
    shippingAddress: string
    state?: string
    pincode?: string
  }
  placeOfSupplyState: string
  taxMode: "IGST" | "CGST_SGST" | "NONE"
  items: Array<{
    name: string
    hsn?: string
    qty: number
    unitPrice: number
    taxableValue: number
    gstRate: number
    cgst: number
    sgst: number
    igst: number
    lineTotal: number
  }>
  totals: {
    subtotal: number
    shipping: number
    discount: number
    taxableTotal: number
    cgstTotal: number
    sgstTotal: number
    igstTotal: number
    grandTotal: number
  }
}

/**
 * Build normalized invoice data from order and tax profile
 */
export function buildInvoiceData(
  order: Order & {
    items: OrderItem[]
    merchant: Merchant
  },
  taxProfile: StoreTaxProfile | null,
  invoiceNumber: string
): InvoiceData {
  const isGstRegistered = taxProfile?.isGstRegistered ?? false
  const invoiceType: "TAX_INVOICE" | "BILL_OF_SUPPLY" = isGstRegistered
    ? "TAX_INVOICE"
    : "BILL_OF_SUPPLY"

  // Format invoice date
  const invoiceDate = order.invoiceIssuedAt
    ? new Date(order.invoiceIssuedAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date(order.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

  // Build seller info with safe defaults
  const sellerAddress = [
    taxProfile?.addressLine1,
    taxProfile?.addressLine2,
    taxProfile?.city,
    taxProfile?.state,
    taxProfile?.pincode,
  ]
    .filter(Boolean)
    .join(", ") ?? order.merchant.displayName

  const seller = {
    legalName: taxProfile?.legalName ?? order.merchant.displayName,
    tradeName: taxProfile?.tradeName ?? undefined,
    gstin: taxProfile?.gstin ?? undefined,
    address: sellerAddress,
    city: taxProfile?.city ?? undefined,
    state: taxProfile?.state ?? "Not Specified",
    pincode: taxProfile?.pincode ?? undefined,
    phone: taxProfile?.phone ?? undefined,
    email: taxProfile?.email ?? undefined,
  }

  // Build buyer info from shipping address or customer address
  const shippingAddress =
    typeof order.shippingAddress === "object" && order.shippingAddress !== null
      ? (order.shippingAddress as any)
      : null

  const shippingAddressStr = shippingAddress
    ? [
        shippingAddress.line1,
        shippingAddress.line2,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.postalCode,
      ]
        .filter(Boolean)
        .join(", ")
    : (order.customerAddress ?? undefined)

  const billingAddressStr = order.customerAddress ?? undefined

  const buyer = {
    name: order.customerName,
    phone: order.customerPhone ?? undefined,
    email: order.customerEmail ?? undefined,
    billingAddress: billingAddressStr ?? undefined,
    shippingAddress: shippingAddressStr ?? undefined,
    state: shippingAddress?.state ?? shippingAddress?.state_code ?? undefined,
    pincode: shippingAddress?.postalCode ?? shippingAddress?.postal_code ?? undefined,
  }

  // Determine place of supply and tax mode (CGST/SGST vs IGST)
  const supplierState = taxProfile?.state ?? ""
  const customerState = shippingAddress?.state ?? shippingAddress?.state_code ?? ""
  const isSameState = !!(
    supplierState && customerState && supplierState.toLowerCase() === customerState.toLowerCase()
  )
  
  let taxMode: "IGST" | "CGST_SGST" | "NONE"
  if (!isGstRegistered) {
    taxMode = "NONE"
  } else if (isSameState) {
    taxMode = "CGST_SGST"
  } else {
    taxMode = "IGST"
  }

  const placeOfSupplyState = customerState || supplierState || "India"

  // Build items with tax calculation (always include all tax fields, set to 0 if not applicable)
  // Note: Product relation is not included - use snapshot data from OrderItem only
  const items = order.items.map((item) => {
    const unitPrice = Number((item.price / 100).toFixed(2)) // Convert paise to INR, round to 2 decimals
    const qty = item.quantity
    const taxableValue = Number((unitPrice * qty).toFixed(2))

    // Get GST rate from item snapshot data (gstRate is stored in OrderItem)
    const gstRate = (item as any).gstRate ?? 0
    const hsn = (item as any).hsnOrSac ?? undefined

    let cgst = 0
    let sgst = 0
    let igst = 0

    if (isGstRegistered && gstRate > 0) {
      const taxAmount = Number(((taxableValue * gstRate) / 100).toFixed(2))

      if (taxMode === "CGST_SGST") {
        // CGST + SGST (split equally)
        cgst = Number((taxAmount / 2).toFixed(2))
        sgst = Number((taxAmount / 2).toFixed(2))
      } else if (taxMode === "IGST") {
        // IGST
        igst = taxAmount
      }
    }

    const lineTotal = Number((taxableValue + cgst + sgst + igst).toFixed(2))

    // Use product name from snapshot (product relation not included)
    const productName =
      item.productName ??
      `Product ${item.id.slice(0, 8)}`

    return {
      name: productName,
      hsn,
      qty,
      unitPrice,
      taxableValue,
      gstRate,
      cgst,
      sgst,
      igst,
      lineTotal,
    }
  })

  // Calculate totals (always include all fields, set to 0 if not applicable)
  const subtotal = Number(items.reduce((sum, item) => sum + item.taxableValue, 0).toFixed(2))
  const totalCgst = Number(items.reduce((sum, item) => sum + item.cgst, 0).toFixed(2))
  const totalSgst = Number(items.reduce((sum, item) => sum + item.sgst, 0).toFixed(2))
  const totalIgst = Number(items.reduce((sum, item) => sum + item.igst, 0).toFixed(2))
  const taxableTotal = subtotal
  const shipping = Number(order.shippingFee.toNumber().toFixed(2))
  const discount = Number(order.discount.toNumber().toFixed(2))
  const grandTotal = Number(order.totalAmount.toNumber().toFixed(2))

  return {
    invoiceNumber,
    invoiceDate,
    invoiceType,
    isCancelled: order.stage === "CANCELLED",
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus ?? undefined,
    paymentMethod: undefined, // Can be extended if payment method is stored in Order
    seller,
    buyer,
    placeOfSupplyState,
    taxMode,
    items,
    totals: {
      subtotal,
      shipping,
      discount,
      taxableTotal,
      cgstTotal: totalCgst,
      sgstTotal: totalSgst,
      igstTotal: totalIgst,
      grandTotal,
    },
  }
}
