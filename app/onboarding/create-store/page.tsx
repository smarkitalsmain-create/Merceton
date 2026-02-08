import { redirect } from "next/navigation"
import { requireUser } from "@/lib/auth"
import CreateStoreForm from "@/components/CreateStoreForm"

export default async function CreateStorePage() {
  const user = await requireUser()

  // If user already has a merchant, redirect to dashboard
  if (user.merchant) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Create Your Store</h1>
          <p className="text-muted-foreground">
            Set up your storefront to start accepting orders
          </p>
        </div>
        <CreateStoreForm />
      </div>
    </div>
  )
}
