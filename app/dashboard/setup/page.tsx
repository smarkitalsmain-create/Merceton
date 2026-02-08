import { redirect } from "next/navigation"
import { getCurrentMerchant } from "@/lib/auth"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import StoreSetupForm from "@/components/StoreSetupForm"

export default async function SetupPage() {
  const { userId } = auth()
  const merchant = await getCurrentMerchant()

  if (merchant) {
    redirect("/dashboard")
  }

  if (!userId) {
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
