import { requireAdmin } from "@/lib/admin"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protect admin routes - redirects if not admin
  try {
    await requireAdmin()
  } catch {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Backoffice</h1>
              <p className="text-sm text-muted-foreground">Platform management</p>
            </div>
            <a
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Go to Dashboard →
            </a>
          </div>
        </div>
      </div>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
