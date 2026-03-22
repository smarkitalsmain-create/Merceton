import { requireMerchant } from "@/lib/auth"
import { notFound } from "next/navigation"

export default async function EditCouponPage() {
  await requireMerchant()
  notFound()
}
