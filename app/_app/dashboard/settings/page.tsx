import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DomainSettings } from "@/components/DomainSettings"
import { getEffectiveFeeConfig } from "@/lib/pricing"
import { StoreUrlDisplay } from "@/components/settings/StoreUrlDisplay"

export default async function SettingsPage() {
  // Require admin role - only admins can access settings
  const { merchant: merchantBase } = await requireAdmin()

  // Fetch merchant with all fields needed for settings
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantBase.id },
  })

  if (!merchant) {
    throw new Error("Merchant not found")
  }

  const storefront = await prisma.storefrontSettings.findUnique({
    where: { merchantId: merchant.id },
    select: { publishedAt: true },
  })

  const effectiveConfig = await getEffectiveFeeConfig(merchant.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your store configuration</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>Basic store details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Store Name</label>
              <p className="text-sm text-muted-foreground">{merchant.displayName}</p>
            </div>
            <StoreUrlDisplay slug={merchant.slug} />
            <Link href="/dashboard/settings/store">
              <Button variant="outline" className="w-full">
                Edit Store Info
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storefront</CardTitle>
            <CardDescription>Customize your storefront appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <p className="text-sm text-muted-foreground">
                {storefront?.publishedAt ? "Published" : "Draft"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active pricing package</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {effectiveConfig.packageName ? (
              <>
                <div>
                  <p className="text-sm font-medium">{effectiveConfig.packageName}</p>
                  <p className="text-xs text-muted-foreground">
                    Fees: ₹{(effectiveConfig.fixedFeePaise / 100).toFixed(2)} +{" "}
                    {effectiveConfig.variableFeeBps / 100}% per order
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Payout: {effectiveConfig.payoutFrequency}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  To change your plan, please contact support.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No plan assigned</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onboarding Details</CardTitle>
            <CardDescription>View and update your PAN, GST, and business basics</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/onboarding">
              <Button variant="outline" className="w-full">
                Manage Onboarding Details
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Account</CardTitle>
            <CardDescription>Configure the bank account for payouts</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/bank">
              <Button variant="outline" className="w-full">
                Configure Bank Account
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
            <CardDescription>Configure invoice numbering and branding</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/invoice">
              <Button variant="outline" className="w-full">
                Manage Invoice Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <DomainSettings
        merchant={{
          customDomain: (merchant as any).customDomain,
          domainStatus: (merchant as any).domainStatus,
          domainVerificationToken: (merchant as any).domainVerificationToken,
        }}
      />
    </div>
  )
}
