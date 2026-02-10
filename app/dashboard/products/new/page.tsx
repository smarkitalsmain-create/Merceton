import { requireMerchant } from "@/lib/auth"
import { getMerchantOnboarding } from "@/lib/onboarding"
import { NewProductForm } from "@/components/NewProductForm"

export default async function NewProductPage() {
  const merchant = await requireMerchant()
  const onboarding = await getMerchantOnboarding(merchant.id)
  const isGstRegistered = onboarding.gstStatus === "REGISTERED"

  if (process.env.NODE_ENV !== "production") {
    // Debug log: confirm onboarding GST status for this merchant
    console.log("NewProductPage GST status", {
      merchantId: merchant.id,
      gstStatus: onboarding.gstStatus,
      isGstRegistered,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Product</h1>
        <p className="text-muted-foreground">Create a new product for your store</p>
        {process.env.NODE_ENV !== "production" && (
          <p className="text-xs text-muted-foreground mt-1">
            GST Registered (debug): {String(isGstRegistered)}
          </p>
        )}
      </div>
      <NewProductForm isGstRegistered={isGstRegistered} />
    </div>
  )
}
