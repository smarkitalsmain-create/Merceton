"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  Settings,
  Wallet,
  BookOpen,
  Ticket,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/storefront", label: "Storefront", icon: Store },
  { href: "/dashboard/payouts", label: "Payouts", icon: Wallet },
  { href: "/dashboard/ledger", label: "Ledger", icon: BookOpen },
  { href: "/dashboard/support/new", label: "Support", icon: Ticket },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Primary merchant dashboard navigation (named export).
 */
export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-muted/30">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-foreground hover:text-primary"
        >
          Merceton
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Dashboard">
        {NAV_ITEMS.map((item) => {
          const { href, label, icon: Icon } = item
          const exact = "exact" in item && item.exact === true
          const active = isActive(pathname, href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
