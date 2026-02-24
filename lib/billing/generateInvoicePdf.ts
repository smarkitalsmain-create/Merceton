import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"
import { BillingInvoiceData } from "./types"

/**
 * Assert fonts exist and register them immediately
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
  doc.font("Body")
}

/**
 * Generate billing invoice PDF (Merceton to Merchant)
 */
export async function generateBillingInvoicePdf(
  data: BillingInvoiceData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 36,
    })

    try {
      assertAndRegisterFonts(doc)
    } catch (error: any) {
      reject(error)
      return
    }

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

    // Helper to format currency
    const formatCurrency = (amount: number) => {
      return `₹${amount.toFixed(2)}`
    }

    // ============================================
    // HEADER SECTION
    // ============================================
    let currentY = 36

    // Left: Supplier (Merceton) info
    doc.fontSize(18).font("Heading").text(data.supplier.legalName, 36, currentY)
    currentY += 20

    doc.fontSize(9).font("Body")
    if (data.supplier.address) {
      doc.text(data.supplier.address, 36, currentY)
      currentY += 12
    }

    const supplierCityState = [
      data.supplier.city,
      data.supplier.state,
      data.supplier.pincode,
    ]
      .filter(Boolean)
      .join(", ")

    if (supplierCityState) {
      doc.text(supplierCityState, 36, currentY)
      currentY += 12
    }

    if (data.supplier.gstin) {
      doc.text(`GSTIN: ${data.supplier.gstin}`, 36, currentY)
      currentY += 12
    }

    if (data.supplier.phone) {
      doc.text(`Phone: ${data.supplier.phone}`, 36, currentY)
      currentY += 12
    }

    if (data.supplier.email) {
      doc.text(`Email: ${data.supplier.email}`, 36, currentY)
      currentY += 12
    }

    // Right: TAX INVOICE badge
    const rightX = doc.page.width - 36
    doc.fontSize(16).font("Heading").text("TAX INVOICE", rightX, 36, {
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
    doc.rect(metaBoxX, metaBoxY, metaBoxWidth, 100).stroke()
    let metaY = metaBoxY + 8

    doc.fontSize(9).font("Body")
    doc.text(`Invoice No: ${data.invoiceNumber}`, metaBoxX + 8, metaY)
    metaY += 12
    doc.text(
      `Invoice Date: ${data.invoiceDate.toISOString().slice(0, 10)}`,
      metaBoxX + 8,
      metaY
    )
    metaY += 12
    doc.text(
      `Period From: ${data.periodFrom.toISOString().slice(0, 10)}`,
      metaBoxX + 8,
      metaY
    )
    metaY += 12
    doc.text(
      `Period To: ${data.periodTo.toISOString().slice(0, 10)}`,
      metaBoxX + 8,
      metaY
    )
    metaY += 12
    doc.text(`Place of Supply: ${data.recipient.state}`, metaBoxX + 8, metaY)

    // ============================================
    // RECIPIENT (MERCHANT) DETAILS
    // ============================================
    currentY = metaBoxY + 120
    const recipientSectionY = currentY

    // Bill To
    doc.fontSize(11).font("Heading").text("Bill To", 36, currentY)
    currentY += 15
    doc.fontSize(9).font("Body")
    doc.text(data.recipient.legalName, 36, currentY)
    currentY += 12

    if (data.recipient.tradeName) {
      doc.text(`Trade Name: ${data.recipient.tradeName}`, 36, currentY)
      currentY += 12
    }

    if (data.recipient.address) {
      doc.text(data.recipient.address, 36, currentY)
      currentY += 12
    }

    const recipientCityState = [
      data.recipient.city,
      data.recipient.state,
      data.recipient.pincode,
    ]
      .filter(Boolean)
      .join(", ")

    if (recipientCityState) {
      doc.text(recipientCityState, 36, currentY)
      currentY += 12
    }

    if (data.recipient.gstin) {
      doc.text(`GSTIN: ${data.recipient.gstin}`, 36, currentY)
      currentY += 12
    }

    if (data.recipient.phone) {
      doc.text(`Phone: ${data.recipient.phone}`, 36, currentY)
      currentY += 12
    }

    if (data.recipient.email) {
      doc.text(`Email: ${data.recipient.email}`, 36, currentY)
      currentY += 12
    }

    // ============================================
    // ITEMS TABLE
    // ============================================
    currentY = Math.max(currentY, recipientSectionY + 50) + 20
    const tableTop = currentY
    const showCgstSgst = data.taxType === "CGST_SGST"
    const showIgst = data.taxType === "IGST"

    // Table header background
    doc.rect(36, tableTop, doc.page.width - 72, 20).fill("#f0f0f0")
    doc.fillColor("black")

    // Table headers
    let headerX = 40
    doc.fontSize(8).font("Heading")
    doc.text("Sr", headerX, tableTop + 6)
    headerX += 30
    doc.text("Description", headerX, tableTop + 6, { width: 200 })
    headerX += 210
    doc.text("SAC", headerX, tableTop + 6, { width: 50 })
    headerX += 60
    doc.text("Taxable", headerX, tableTop + 6, { width: 70, align: "right" })
    headerX += 80
    if (showCgstSgst) {
      doc.text("CGST", headerX, tableTop + 6, { width: 60, align: "right" })
      headerX += 70
      doc.text("SGST", headerX, tableTop + 6, { width: 60, align: "right" })
      headerX += 70
    }
    if (showIgst) {
      doc.text("IGST", headerX, tableTop + 6, { width: 60, align: "right" })
      headerX += 70
    }
    doc.text("Total", headerX, tableTop + 6, { width: 70, align: "right" })

    // Table rows
    let rowY = tableTop + 20
    doc.fontSize(8).font("Body")
    data.lineItems.forEach((item, index) => {
      if (rowY > doc.page.height - 100) {
        doc.addPage()
        rowY = 36
        // Redraw header on new page
        doc.rect(36, rowY, doc.page.width - 72, 20).fill("#f0f0f0")
        doc.fillColor("black")
        headerX = 40
        doc.fontSize(8).font("Heading")
        doc.text("Sr", headerX, rowY + 6)
        headerX += 30
        doc.text("Description", headerX, rowY + 6, { width: 200 })
        headerX += 210
        doc.text("SAC", headerX, rowY + 6, { width: 50 })
        headerX += 60
        doc.text("Taxable", headerX, rowY + 6, { width: 70, align: "right" })
        headerX += 80
        if (showCgstSgst) {
          doc.text("CGST", headerX, rowY + 6, { width: 60, align: "right" })
          headerX += 70
          doc.text("SGST", headerX, rowY + 6, { width: 60, align: "right" })
          headerX += 70
        }
        if (showIgst) {
          doc.text("IGST", headerX, rowY + 6, { width: 60, align: "right" })
          headerX += 70
        }
        doc.text("Total", headerX, rowY + 6, { width: 70, align: "right" })
        rowY += 20
      }

      let cellX = 40
      doc.font("Body")
      doc.text(String(index + 1), cellX, rowY + 4)
      cellX += 30
      doc.text(item.description, cellX, rowY + 4, { width: 200 })
      cellX += 210
      doc.text(item.sacCode, cellX, rowY + 4, { width: 50 })
      cellX += 60
      doc.text(formatCurrency(item.taxableValue), cellX, rowY + 4, {
        width: 70,
        align: "right",
      })
      cellX += 80
      if (showCgstSgst) {
        doc.text(formatCurrency(item.cgst), cellX, rowY + 4, {
          width: 60,
          align: "right",
        })
        cellX += 70
        doc.text(formatCurrency(item.sgst), cellX, rowY + 4, {
          width: 60,
          align: "right",
        })
        cellX += 70
      }
      if (showIgst) {
        doc.text(formatCurrency(item.igst), cellX, rowY + 4, {
          width: 60,
          align: "right",
        })
        cellX += 70
      }
      doc.text(formatCurrency(item.total), cellX, rowY + 4, {
        width: 70,
        align: "right",
      })

      // Draw row separator
      doc.moveTo(36, rowY + 16).lineTo(doc.page.width - 36, rowY + 16).stroke()
      rowY += 16
    })

    // ============================================
    // TOTALS SECTION
    // ============================================
    const totalsY = rowY + 10
    const totalsBoxWidth = 300
    const totalsBoxX = doc.page.width - 36 - totalsBoxWidth

    doc.rect(totalsBoxX, totalsY, totalsBoxWidth, 100).stroke()

    let totalRowY = totalsY + 8
    doc.fontSize(9).font("Body")

    doc.text("Subtotal (Taxable Value):", totalsBoxX + 8, totalRowY, {
      width: totalsBoxWidth - 100,
    })
    doc.text(formatCurrency(data.totals.totalTaxable), totalsBoxX + totalsBoxWidth - 80, totalRowY, {
      align: "right",
      width: 70,
    })
    totalRowY += 15

    if (showCgstSgst) {
      doc.text("CGST (9%):", totalsBoxX + 8, totalRowY, {
        width: totalsBoxWidth - 100,
      })
      doc.text(formatCurrency(data.totals.totalCgst), totalsBoxX + totalsBoxWidth - 80, totalRowY, {
        align: "right",
        width: 70,
      })
      totalRowY += 15

      doc.text("SGST (9%):", totalsBoxX + 8, totalRowY, {
        width: totalsBoxWidth - 100,
      })
      doc.text(formatCurrency(data.totals.totalSgst), totalsBoxX + totalsBoxWidth - 80, totalRowY, {
        align: "right",
        width: 70,
      })
      totalRowY += 15
    }

    if (showIgst) {
      doc.text("IGST (18%):", totalsBoxX + 8, totalRowY, {
        width: totalsBoxWidth - 100,
      })
      doc.text(formatCurrency(data.totals.totalIgst), totalsBoxX + totalsBoxWidth - 80, totalRowY, {
        align: "right",
        width: 70,
      })
      totalRowY += 15
    }

    // Grand total line
    doc.moveTo(totalsBoxX + 8, totalRowY).lineTo(totalsBoxX + totalsBoxWidth - 8, totalRowY).stroke()
    totalRowY += 8

    doc.fontSize(11).font("Heading")
    doc.text("Grand Total:", totalsBoxX + 8, totalRowY, {
      width: totalsBoxWidth - 100,
    })
    doc.text(formatCurrency(data.totals.grandTotal), totalsBoxX + totalsBoxWidth - 80, totalRowY, {
      align: "right",
      width: 70,
    })

    // ============================================
    // FOOTER
    // ============================================
    const footerY = doc.page.height - 50
    doc.fontSize(8).font("Body").fillColor("#666666")
    doc.text(
      "This is a system-generated invoice. Ledger entries are the source of truth.",
      36,
      footerY,
      {
        align: "center",
        width: doc.page.width - 72,
      }
    )

    doc.end()
  })
}
