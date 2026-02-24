import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InvoiceSettingsForm } from "@/components/settings/InvoiceSettingsForm"

export default async function InvoiceSettingsPage() {
  const merchant = await requireMerchant()

  // Fetch store settings
  const storeSettings = await prisma.merchantStoreSettings.findUnique({
    where: { merchantId: merchant.id },
      select: {
        invoicePrefix: true,
        invoiceNextNumber: true,
        invoicePadding: true, // Schema field is invoicePadding
        invoiceSeriesFormat: true,
        logoUrl: true,
      },
  })

  // Also fetch storefront logo as fallback
  const storefrontSettings = await prisma.storefrontSettings.findUnique({
    where: { merchantId: merchant.id },
    select: {
      logoUrl: true,
    },
  })

  const logoUrl = storeSettings?.logoUrl || storefrontSettings?.logoUrl || null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Invoice Settings</h1>
        <p className="text-muted-foreground">
          Configure invoice numbering and branding for your invoices.
        </p>
      </div>

      <InvoiceSettingsForm
        initialData={{
          invoicePrefix: storeSettings?.invoicePrefix || "MRC",
          invoiceNextNumber: storeSettings?.invoiceNextNumber || 1,
          invoiceNumberPadding: storeSettings?.invoicePadding || 5, // Map invoicePadding to invoiceNumberPadding for component
          invoiceSeriesFormat: storeSettings?.invoiceSeriesFormat || "{PREFIX}-{YYYY}-{NNNNN}",
          resetFy: false, // Field doesn't exist in schema, always false
          logoUrl,
        }}
      />
    </div>
  )
}
