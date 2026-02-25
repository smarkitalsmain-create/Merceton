import { requireMerchant } from "@/lib/auth"
import { CouponForm } from "@/components/marketing/CouponForm"

export default async function EditCouponPage({
  params,
}: {
  params: { id: string }
}) {
  await requireMerchant()

  // Coupons are not provisioned in this deployment; show a safe fallback.
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Coupon</h1>
        <p className="text-muted-foreground">
          Coupons are not available in this environment. Please contact support if you need this feature.
        </p>
      </div>
    </div>
  )
}
