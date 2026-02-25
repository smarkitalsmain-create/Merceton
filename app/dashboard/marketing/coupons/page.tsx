import { redirect } from "next/navigation"
import { requireMerchant } from "@/lib/auth"
import { assertFeature, FeatureDeniedError } from "@/lib/features"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"
import { getCoupons } from "@/app/actions/coupons"
import { CouponsList } from "@/components/marketing/CouponsList"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function CouponsPage() {
  const merchant = await requireMerchant()
  try {
    await assertFeature(merchant.id, GROWTH_FEATURE_KEYS.G_COUPONS, "/dashboard/marketing/coupons")
  } catch (e) {
    if (e instanceof FeatureDeniedError) redirect("/dashboard/upgrade")
    throw e
  }

  const coupons = await getCoupons()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">Manage discount coupons for your store</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/marketing/coupons/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Coupon
          </Link>
        </Button>
      </div>

      <CouponsList initialCoupons={coupons} />
    </div>
  )
}
