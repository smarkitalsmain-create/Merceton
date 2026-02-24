import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"
import { InvoiceData } from "../buildInvoiceData"

/**
 * Assert fonts exist and register them immediately
 * CRITICAL: Sets doc.font("Body") immediately to prevent PDFKit from using default Helvetica
 */
function assertAndRegisterFonts(doc: PDFKit.PDFDocument) {
  const regular = path.join(process.cwd(), "assets", "fonts", "NotoSans-Regular.ttf")
  const bold = path.join(process.cwd(), "assets", "fonts", "NotoSans-Bold.ttf")

  if (!fs.existsSync(regular)) {
    throw new Error(`Missing font: ${regular}`)
  }
  if (!fs.existsSync(bold)) {
    throw new Error(`Missing font: ${bold}`)
  }

  doc.registerFont("Body", regular)
  doc.registerFont("Heading", bold)

  // CRITICAL: Set a font immediately so PDFKit never defaults to Helvetica
  doc.font("Body")
}

/**
 * Add CANCELLED watermark to PDF page
 * CRITICAL: FIRST line must set font to prevent default Helvetica
 */
function addCancelledWatermark(doc: PDFKit.PDFDocument) {
  // CRITICAL: Set font FIRST before any text operations
  doc.font("Heading")
  
  const centerX = doc.page.width / 2
  const centerY = doc.page.height / 2

  doc.save()
  doc.opacity(0.15)
  doc.fillColor("red")
  doc.fontSize(80)

  // Rotate and center text
  doc.translate(centerX, centerY)
  doc.rotate(-30)
  doc.text("CANCELLED", 0, 0, {
    align: "center",
    width: doc.page.width,
  })

  doc.restore()
  doc.opacity(1.0)
  doc.fillColor("black")
}

/**
 * Generate invoice PDF using PDFKit
 */
export async function generateInvoicePdf(invoiceData: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 36,
    })

    // CRITICAL ORDER: Register fonts and set default BEFORE any text operations
    try {
      assertAndRegisterFonts(doc)
    } catch (error: any) {
      reject(error)
      return
    }

    // Set font explicitly again to ensure it's active
    doc.font("Body")
    doc.fontSize(11)

    const chunks: Buffer[] = []

    doc.on("data", (chunk) => {
      chunks.push(chunk)
    })

    doc.on("end", () => {
      resolve(Buffer.concat(chunks))
    })

    doc.on("error", (error) => {
      reject(error)
    })

    // Add watermark on each page if cancelled
    // CRITICAL: pageAdded handler must set font before watermark
    if (invoiceData.isCancelled) {
      addCancelledWatermark(doc)
      doc.on("pageAdded", () => {
        // Set font before watermark to prevent default Helvetica
        doc.font("Body")
        addCancelledWatermark(doc)
      })
    }

    // Helper to format currency
    const formatCurrency = (amount: number) => {
      return `₹${amount.toFixed(2)}`
    }

    // ============================================
    // HEADER SECTION
    // ============================================
    let currentY = 36

    // Left: Seller info
    doc.fontSize(18).font("Heading").text(invoiceData.seller.tradeName || invoiceData.seller.legalName, 36, currentY)
    currentY += 20

    doc.fontSize(9).font("Body")
    if (invoiceData.seller.address) {
      doc.text(invoiceData.seller.address, 36, currentY)
      currentY += 12
    }

    const sellerCityState = [
      invoiceData.seller.city,
      invoiceData.seller.state,
      invoiceData.seller.pincode,
    ]
      .filter(Boolean)
      .join(", ")

    if (sellerCityState) {
      doc.text(sellerCityState, 36, currentY)
      currentY += 12
    }

    if (invoiceData.seller.gstin) {
      doc.text(`GSTIN: ${invoiceData.seller.gstin}`, 36, currentY)
      currentY += 12
    }

    if (invoiceData.seller.phone) {
      doc.text(`Phone: ${invoiceData.seller.phone}`, 36, currentY)
      currentY += 12
    }

    if (invoiceData.seller.email) {
      doc.text(`Email: ${invoiceData.seller.email}`, 36, currentY)
      currentY += 12
    }

    // Right: Invoice type badge
    const invoiceTypeText = invoiceData.invoiceType === "TAX_INVOICE" ? "TAX INVOICE" : "BILL OF SUPPLY"
    const rightX = doc.page.width - 36
    doc.fontSize(16).font("Heading").text(invoiceTypeText, rightX, 36, {
      align: "right",
      width: 200,
    })

    // ============================================
    // INVOICE META BOX
    // ============================================
    const metaBoxY = currentY + 15
    const metaBoxWidth = 250
    const metaBoxX = doc.page.width - 36 - metaBoxWidth

    // Draw box
    doc.rect(metaBoxX, metaBoxY, metaBoxWidth, 80).stroke()
    let metaY = metaBoxY + 8

    doc.fontSize(9).font("Body")
    doc.text(`Invoice No: ${invoiceData.invoiceNumber}`, metaBoxX + 8, metaY)
    metaY += 12
    doc.text(`Invoice Date: ${invoiceData.invoiceDate}`, metaBoxX + 8, metaY)
    metaY += 12
    doc.text(`Order No: ${invoiceData.orderNumber}`, metaBoxX + 8, metaY)
    metaY += 12
    if (invoiceData.paymentStatus) {
      doc.text(`Payment: ${invoiceData.paymentStatus}`, metaBoxX + 8, metaY)
      metaY += 12
    }
    if (invoiceData.paymentMethod) {
      doc.text(`Method: ${invoiceData.paymentMethod}`, metaBoxX + 8, metaY)
    }

    // ============================================
    // BUYER DETAILS
    // ============================================
    currentY = metaBoxY + 100
    const buyerSectionY = currentY

    // Bill To
    doc.fontSize(11).font("Heading").text("Bill To", 36, currentY)
    currentY += 15
    doc.fontSize(9).font("Body")
    doc.text(invoiceData.buyer.name, 36, currentY)
    currentY += 12

    if (invoiceData.buyer.billingAddress) {
      doc.text(invoiceData.buyer.billingAddress, 36, currentY)
      currentY += 12
    }

    if (invoiceData.buyer.state || invoiceData.buyer.pincode) {
      const buyerLocation = [invoiceData.buyer.state, invoiceData.buyer.pincode]
        .filter(Boolean)
        .join(", ")
      if (buyerLocation) {
        doc.text(buyerLocation, 36, currentY)
        currentY += 12
      }
    }

    if (invoiceData.buyer.phone) {
      doc.text(`Phone: ${invoiceData.buyer.phone}`, 36, currentY)
      currentY += 12
    }

    if (invoiceData.buyer.email) {
      doc.text(`Email: ${invoiceData.buyer.email}`, 36, currentY)
      currentY += 12
    }

    // Ship To (if different from billing)
    if (invoiceData.buyer.shippingAddress && invoiceData.buyer.shippingAddress !== invoiceData.buyer.billingAddress) {
      currentY += 10
      doc.fontSize(11).font("Heading").text("Ship To", 36, currentY)
      currentY += 15
      doc.fontSize(9).font("Body")
      doc.text(invoiceData.buyer.shippingAddress, 36, currentY)
      currentY += 12
    }

    // Place of Supply (right side)
    const placeOfSupplyX = doc.page.width - 200
    doc.fontSize(10).font("Heading").text("Place of Supply", placeOfSupplyX, buyerSectionY)
    doc.fontSize(9).font("Body").text(invoiceData.placeOfSupplyState, placeOfSupplyX, buyerSectionY + 15)

    // ============================================
    // ITEMS TABLE
    // ============================================
    currentY = Math.max(currentY, buyerSectionY + 50) + 20
    const tableTop = currentY
    const isTaxInvoice = invoiceData.invoiceType === "TAX_INVOICE"
    const showTaxColumns = isTaxInvoice && invoiceData.taxMode !== "NONE"
    const showCgstSgst = invoiceData.taxMode === "CGST_SGST"
    const showIgst = invoiceData.taxMode === "IGST"

    // Table header background
    doc.rect(36, tableTop, doc.page.width - 72, 20).fill("#f5f5f5")

    // Table header text
    doc.fontSize(9).font("Heading").fillColor("black")
    let headerX = 40
    doc.text("S.No", headerX, tableTop + 6, { width: 30 })
    headerX += 35
    doc.text("Item", headerX, tableTop + 6, { width: 150 })
    headerX += 155

    if (isTaxInvoice) {
      doc.text("HSN", headerX, tableTop + 6, { width: 60 })
      headerX += 65
    }

    doc.text("Qty", headerX, tableTop + 6, { width: 40 })
    headerX += 45
    doc.text("Rate", headerX, tableTop + 6, { width: 60 })
    headerX += 65

    if (showTaxColumns) {
      if (showCgstSgst) {
        doc.text("CGST%", headerX, tableTop + 6, { width: 50 })
        headerX += 55
        doc.text("CGST", headerX, tableTop + 6, { width: 50 })
        headerX += 55
        doc.text("SGST%", headerX, tableTop + 6, { width: 50 })
        headerX += 55
        doc.text("SGST", headerX, tableTop + 6, { width: 50 })
        headerX += 55
      } else if (showIgst) {
        doc.text("IGST%", headerX, tableTop + 6, { width: 50 })
        headerX += 55
        doc.text("IGST", headerX, tableTop + 6, { width: 50 })
        headerX += 55
      }
    }

    doc.text("Amount", headerX, tableTop + 6, { width: 70 })

    // Table header line
    doc.moveTo(36, tableTop + 20).lineTo(doc.page.width - 36, tableTop + 20).stroke()

    // Table rows
    doc.fontSize(8).font("Body")
    let rowY = tableTop + 25
    let serialNumber = 1

    invoiceData.items.forEach((item) => {
      // Check if we need a new page
      if (rowY > doc.page.height - 200) {
        doc.addPage()
        // CRITICAL: Set font immediately after addPage to prevent default Helvetica
        doc.font("Body")
        if (invoiceData.isCancelled) {
          addCancelledWatermark(doc)
        }
        // Redraw header on new page
        doc.rect(36, 36, doc.page.width - 72, 20).fill("#f5f5f5")
        doc.fontSize(9).font("Heading")
        headerX = 40
        doc.text("S.No", headerX, 42, { width: 30 })
        headerX += 35
        doc.text("Item", headerX, 42, { width: 150 })
        headerX += 155
        if (isTaxInvoice) {
          doc.text("HSN", headerX, 42, { width: 60 })
          headerX += 65
        }
        doc.text("Qty", headerX, 42, { width: 40 })
        headerX += 45
        doc.text("Rate", headerX, 42, { width: 60 })
        headerX += 65
        if (showTaxColumns) {
          if (showCgstSgst) {
            doc.text("CGST%", headerX, 42, { width: 50 })
            headerX += 55
            doc.text("CGST", headerX, 42, { width: 50 })
            headerX += 55
            doc.text("SGST%", headerX, 42, { width: 50 })
            headerX += 55
            doc.text("SGST", headerX, 42, { width: 50 })
            headerX += 55
          } else if (showIgst) {
            doc.text("IGST%", headerX, 42, { width: 50 })
            headerX += 55
            doc.text("IGST", headerX, 42, { width: 50 })
            headerX += 55
          }
        }
        doc.text("Amount", headerX, 42, { width: 70 })
        doc.moveTo(36, 56).lineTo(doc.page.width - 36, 56).stroke()
        rowY = 61
      }

      // Row background (alternating)
      if (serialNumber % 2 === 0) {
        doc.rect(36, rowY - 3, doc.page.width - 72, 18).fill("#fafafa")
      }

      let cellX = 40
      doc.fontSize(8).font("Body").fillColor("black")

      // S.No
      doc.text(serialNumber.toString(), cellX, rowY, { width: 30 })
      cellX += 35

      // Item name (use name field from new structure)
      const itemName = (item as any).name || (item as any).description || `Item ${serialNumber}`
      doc.text(itemName.substring(0, 25), cellX, rowY, { width: 150 })
      cellX += 155

      // HSN
      if (isTaxInvoice) {
        doc.text(item.hsn || "-", cellX, rowY, { width: 60 })
        cellX += 65
      }

      // Qty (InvoiceData uses qty)
      const qty = item.qty
      doc.text(qty.toString(), cellX, rowY, { width: 40 })
      cellX += 45

      // Rate (InvoiceData uses unitPrice)
      const unitPrice = item.unitPrice
      doc.text(formatCurrency(unitPrice), cellX, rowY, { width: 60 })
      cellX += 65

      // Tax columns
      if (showTaxColumns) {
        const gstRate = item.gstRate
        if (showCgstSgst) {
          const cgstRate = gstRate > 0 ? (gstRate / 2).toFixed(2) : "0.00"
          doc.text(`${cgstRate}%`, cellX, rowY, { width: 50 })
          cellX += 55
          doc.text(formatCurrency(item.cgst), cellX, rowY, { width: 50 })
          cellX += 55
          doc.text(`${cgstRate}%`, cellX, rowY, { width: 50 })
          cellX += 55
          doc.text(formatCurrency(item.sgst), cellX, rowY, { width: 50 })
          cellX += 55
        } else if (showIgst) {
          doc.text(`${gstRate.toFixed(2)}%`, cellX, rowY, { width: 50 })
          cellX += 55
          doc.text(formatCurrency(item.igst), cellX, rowY, { width: 50 })
          cellX += 55
        }
      }

      // Amount (InvoiceData uses lineTotal)
      doc.text(formatCurrency(item.lineTotal), cellX, rowY, { width: 70 })

      // Row separator
      doc.moveTo(36, rowY + 15).lineTo(doc.page.width - 36, rowY + 15).stroke()

      rowY += 20
      serialNumber++
    })

    // ============================================
    // TOTALS SECTION
    // ============================================
    const totalsY = Math.max(rowY + 20, doc.page.height - 250)
    const totalsX = doc.page.width - 280
    const totalsWidth = 240

    doc.fontSize(9).font("Body").fillColor("black")

    let totalsCurrentY = totalsY

    // Subtotal
    doc.text("Subtotal:", totalsX, totalsCurrentY, { width: 120, align: "right" })
    doc.text(formatCurrency(invoiceData.totals.subtotal), totalsX + 130, totalsCurrentY)
    totalsCurrentY += 15

    // Discount
    if (invoiceData.totals.discount > 0) {
      doc.text("Discount:", totalsX, totalsCurrentY, { width: 120, align: "right" })
      doc.text(`-${formatCurrency(invoiceData.totals.discount)}`, totalsX + 130, totalsCurrentY)
      totalsCurrentY += 15
    }

    // Shipping
    if (invoiceData.totals.shipping > 0) {
      doc.text("Shipping:", totalsX, totalsCurrentY, { width: 120, align: "right" })
      doc.text(formatCurrency(invoiceData.totals.shipping), totalsX + 130, totalsCurrentY)
      totalsCurrentY += 15
    }

    // Taxable value
    if (isTaxInvoice) {
      doc.text("Taxable Value:", totalsX, totalsCurrentY, { width: 120, align: "right" })
      doc.text(formatCurrency(invoiceData.totals.taxableTotal), totalsX + 130, totalsCurrentY)
      totalsCurrentY += 15
    }

    // Tax breakdown
    if (showTaxColumns) {
      if (showCgstSgst) {
        if (invoiceData.totals.cgstTotal > 0) {
          doc.text("CGST:", totalsX, totalsCurrentY, { width: 120, align: "right" })
          doc.text(formatCurrency(invoiceData.totals.cgstTotal), totalsX + 130, totalsCurrentY)
          totalsCurrentY += 15
        }
        if (invoiceData.totals.sgstTotal > 0) {
          doc.text("SGST:", totalsX, totalsCurrentY, { width: 120, align: "right" })
          doc.text(formatCurrency(invoiceData.totals.sgstTotal), totalsX + 130, totalsCurrentY)
          totalsCurrentY += 15
        }
      } else if (showIgst) {
        if (invoiceData.totals.igstTotal > 0) {
          doc.text("IGST:", totalsX, totalsCurrentY, { width: 120, align: "right" })
          doc.text(formatCurrency(invoiceData.totals.igstTotal), totalsX + 130, totalsCurrentY)
          totalsCurrentY += 15
        }
      }
    }

    // Grand total line
    doc.moveTo(totalsX, totalsCurrentY + 5).lineTo(doc.page.width - 36, totalsCurrentY + 5).stroke()
    totalsCurrentY += 15

    doc.fontSize(12).font("Heading")
    doc.text("Grand Total:", totalsX, totalsCurrentY, { width: 120, align: "right" })
    doc.text(formatCurrency(invoiceData.totals.grandTotal), totalsX + 130, totalsCurrentY)

    // ============================================
    // FOOTER
    // ============================================
    const footerY = doc.page.height - 80
    doc.fontSize(8).font("Body").fillColor("black")

    doc.text("This is a system generated document.", doc.page.width / 2, footerY, {
      align: "center",
    })

    if (invoiceData.isCancelled) {
      doc.fontSize(9).font("Heading").fillColor("red")
      doc.text(
        "Order cancelled. Document retained for record.",
        doc.page.width / 2,
        footerY + 15,
        { align: "center" }
      )
      doc.fillColor("black")
    }

    doc.fontSize(8).font("Body").text(
      `All rights reserved © ${new Date().getFullYear()} ${invoiceData.seller.tradeName || invoiceData.seller.legalName}`,
      doc.page.width / 2,
      footerY + (invoiceData.isCancelled ? 30 : 15),
      { align: "center" }
    )

    // Finalize PDF
    doc.end()
  })
}
