import { requireMerchant } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default async function UpgradePage() {
  await requireMerchant()

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Upgrade your plan</CardTitle>
          <CardDescription>
            This feature is not included in your current plan. Upgrade to access it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Contact us to change your pricing package or enable this feature for your store.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="default">
              <Link href="mailto:info@smarkitalstech.com">Contact support</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
