import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DomainSettings } from "@/components/DomainSettings"

export default async function SettingsPage() {
  // Require admin role - only admins can access settings
  const { merchant, user } = await requireAdmin()

  const storefront = await prisma.storefrontSettings.findUnique({
    where: { merchantId: merchant.id },
  })

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
            <div>
              <label className="text-sm font-medium">Store URL</label>
              <p className="text-sm text-muted-foreground">
                <Link href={`/s/${merchant.slug}`} target="_blank" className="text-primary hover:underline">
                  /s/{merchant.slug}
                </Link>
              </p>
            </div>
            <Button variant="outline" disabled>
              Edit Store Info (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storefront Settings</CardTitle>
            <CardDescription>Customize your storefront appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Theme</label>
              <p className="text-sm text-muted-foreground">
                {storefront?.theme || "minimal"}
              </p>
            </div>
            {storefront?.logoUrl && (
              <div>
                <label className="text-sm font-medium">Logo</label>
                <p className="text-sm text-muted-foreground">Logo is set</p>
              </div>
            )}
            <Link href="/dashboard/settings/storefront">
              <Button variant="outline" className="w-full">
                Configure Storefront
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="mt-4" disabled>
              Add Team Member (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Account settings and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              Account Settings (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      <DomainSettings
        merchant={{
          customDomain: merchant.customDomain,
          domainStatus: merchant.domainStatus,
          domainVerificationToken: merchant.domainVerificationToken,
        }}
      />
    </div>
  )
}
