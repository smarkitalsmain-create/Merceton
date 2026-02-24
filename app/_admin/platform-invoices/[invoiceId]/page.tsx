export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { getPlatformInvoiceById, getPlatformBillingProfile } from "@/lib/billing/queries"
import { PlatformInvoiceHtml } from "@/components/invoices/PlatformInvoiceHtml"
import { notFound } from "next/navigation"

export default async function AdminPlatformInvoicePage({
  params,
}: {
  params: { invoiceId: string }
}) {
  await requireSuperAdmin()

  const [invoice, billingProfile] = await Promise.all([
    getPlatformInvoiceById(params.invoiceId),
    getPlatformBillingProfile(),
  ])

  if (!invoice) {
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
