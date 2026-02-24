import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DomainSettingsForm } from "@/components/DomainSettingsForm"

export default async function DomainSettingsPage() {
  const merchant = await requireMerchant()

  // Fetch merchant with domain fields
  const merchantWithDomain = await prisma.merchant.findUnique({
    where: { id: merchant.id },
    select: {
      id: true,
      customDomain: true,
      domainStatus: true,
      domainVerificationToken: true,
      domainVerifiedAt: true,
    },
  })

  if (!merchantWithDomain) {
    return <div>Merchant not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Custom Domain</h1>
        <p className="text-muted-foreground">
          Connect your custom domain to your storefront
        </p>
      </div>
      <DomainSettingsForm merchant={merchantWithDomain} />
    </div>
  )
}
