import { redirect } from "next/navigation"
import { getCurrentMerchant } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import StoreSetupForm from "@/components/StoreSetupForm"

export default async function SetupPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  const merchant = await getCurrentMerchant()

  if (merchant) {
    redirect("/dashboard")
  }

  if (error || !user) {
    redirect("/sign-in")
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Set up your store</h1>
      <p className="text-muted-foreground mb-8">
        Create your storefront to start accepting orders
      </p>
      <StoreSetupForm />
    </div>
  )
}
