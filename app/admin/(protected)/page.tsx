import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, ShoppingCart, CreditCard, Wallet, FileText, Settings } from "lucide-react"

const quickLinks = [
  { name: "Merchants", href: "/admin/merchants", icon: Store },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Pricing", href: "/admin/pricing", icon: CreditCard },
  { name: "Payouts", href: "/admin/payouts", icon: Wallet },
  { name: "Platform Invoices", href: "/admin/platform-invoices", icon: FileText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">
          Platform administration and merchant management.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
          <CardDescription>Navigate to main admin sections.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
