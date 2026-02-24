import { requireMerchant } from "@/lib/auth"
import { getCouponById } from "@/app/actions/coupons"
import { CouponForm } from "@/components/marketing/CouponForm"
import { notFound } from "next/navigation"

export default async function EditCouponPage({
  params,
}: {
  params: { id: string }
}) {
  await requireMerchant()

  try {
    const coupon = await getCouponById(params.id)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Coupon</h1>
          <p className="text-muted-foreground">Update coupon details</p>
        </div>

        <CouponForm
          initialData={{
            id: coupon.id,
            code: coupon.code,
            type: coupon.type,
            value: Number(coupon.value),
            minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
            maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
            validFrom: coupon.validFrom,
            validUntil: coupon.validUntil,
            usageLimit: coupon.usageLimit,
            description: coupon.description,
          }}
        />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
