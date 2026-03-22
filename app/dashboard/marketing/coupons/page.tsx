import { requireMerchant } from "@/lib/auth"

export default async function CouponsPage() {
  await requireMerchant()

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold">Coupons</h1>
      <p className="text-muted-foreground">Coupon management is not available in this build.</p>
    </div>
  )
}
