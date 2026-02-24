import { requireMerchant } from "@/lib/auth"
import { getPlatformInvoiceById, getPlatformBillingProfile } from "@/lib/billing/queries"
import { PlatformInvoiceHtml } from "@/components/invoices/PlatformInvoiceHtml"
import { notFound } from "next/navigation"

export default async function MerchantPlatformInvoicePage({
  params,
}: {
  params: { invoiceId: string }
}) {
  const merchant = await requireMerchant()

  const [invoice, billingProfile] = await Promise.all([
    getPlatformInvoiceById(params.invoiceId),
    getPlatformBillingProfile(),
  ])

  if (!invoice) {
    notFound()
  }

  // Ensure merchant owns this invoice
  if (invoice.merchantId !== merchant.id) {
    notFound()
  }

  return (
    <PlatformInvoiceHtml
      billingProfile={billingProfile}
      merchant={invoice.merchant}
      invoice={invoice}
      cycle={invoice.cycle}
      lineItems={invoice.lineItems}
    />
  )
}
