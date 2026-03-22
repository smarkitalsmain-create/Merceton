import { requireMerchant } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function SupportPage() {
  await requireMerchant()

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-3xl font-bold">Support</h1>
      <p className="text-muted-foreground">
        Support inbox is not enabled in this build. For urgent issues, contact your account manager.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  )
}
