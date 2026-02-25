import { redirect } from "next/navigation"
import Link from "next/link"
import { requireMerchant } from "@/lib/auth"
import { assertFeature, FeatureDeniedError } from "@/lib/features"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"
import { prisma } from "@/lib/prisma"
import { DomainSettingsForm } from "@/components/DomainSettingsForm"
import { ChevronRight } from "lucide-react"

export default async function DomainSettingsPage() {
  const merchant = await requireMerchant()
  try {
    await assertFeature(merchant.id, GROWTH_FEATURE_KEYS.G_CUSTOM_DOMAIN, "/dashboard/settings/domain")
  } catch (e) {
    if (e instanceof FeatureDeniedError) redirect("/dashboard/upgrade")
    throw e
  }

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
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/dashboard/settings" className="hover:text-foreground">Settings</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Custom Domain</span>
      </nav>
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
