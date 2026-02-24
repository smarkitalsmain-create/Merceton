import { requireMerchant } from "@/lib/auth"
import { CouponForm } from "@/components/marketing/CouponForm"

export default async function NewCouponPage() {
  await requireMerchant()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Coupon</h1>
        <p className="text-muted-foreground">Create a new discount coupon</p>
      </div>

      <CouponForm />
    </div>
  )
}
