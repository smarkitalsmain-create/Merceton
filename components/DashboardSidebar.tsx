"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Store,
  Wallet,
  Palette,
  FileText,
  Tag,
  BarChart3,
  Headphones,
  Globe,
} from "lucide-react"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"

const navigation: Array<{
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  featureKey?: string
}> = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Import Products", href: "/dashboard/products/import", icon: Package, featureKey: GROWTH_FEATURE_KEYS.G_BULK_CSV },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Storefront", href: "/dashboard/storefront", icon: Palette },
  { name: "Coupons", href: "/dashboard/marketing/coupons", icon: Tag, featureKey: GROWTH_FEATURE_KEYS.G_COUPONS },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Payouts", href: "/dashboard/payouts", icon: Wallet },
  { name: "Billing", href: "/dashboard/billing", icon: FileText },
  { name: "Support", href: "/dashboard/support", icon: Headphones },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Custom Domain", href: "/dashboard/settings/domain", icon: Globe, featureKey: GROWTH_FEATURE_KEYS.G_CUSTOM_DOMAIN },
]

interface DashboardSidebarProps {
  enabledFeatureKeys?: Set<string>
}

export function DashboardSidebar({ enabledFeatureKeys }: DashboardSidebarProps = {}) {
  const pathname = usePathname()

  const visible = navigation.filter((item) => {
    if (!enabledFeatureKeys) return true
    if (!item.featureKey) return true
    return enabledFeatureKeys.has(item.featureKey)
  })

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/40">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Store className="h-6 w-6" />
          <span className="text-lg font-bold">Merceton</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visible.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
