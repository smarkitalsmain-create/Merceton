"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/_admin", label: "Overview" },
  { href: "/_admin/merchants", label: "Merchants" },
  { href: "/_admin/orders", label: "Orders" },
  { href: "/_admin/pricing-packages", label: "Pricing packages" },
  { href: "/_admin/audit-logs", label: "Audit logs" },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-muted/30 md:block">
      <div className="flex h-16 items-center border-b px-4 font-semibold">Admin</div>
      <nav className="flex flex-col gap-1 p-2">
        {LINKS.map(({ href, label }) => {
          const active = pathname === href || (href !== "/_admin" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:bg-background/60"
              )}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
