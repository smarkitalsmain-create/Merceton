import Link from "next/link"
import { requireMerchant } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default async function DomainSettingsPage() {
  await requireMerchant()

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Custom domain</h1>
        <p className="text-muted-foreground">
          Domain connection is managed from store settings. Use the link below to configure your domain when
          available.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/dashboard/settings/store">Back to store settings</Link>
      </Button>
    </div>
  )
}
