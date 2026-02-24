"use client"

import { AdminUserMenu } from "./AdminUserMenu"

interface AdminHeaderProps {
  email: string
}

export function AdminHeader({ email }: AdminHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          {email} (Super Admin)
        </span>
      </div>
      <div className="flex items-center gap-4">
        <a
          href="http://app.merceton.localhost:3000"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Go to Merchant Dashboard →
        </a>
        <AdminUserMenu />
      </div>
    </header>
  )
}
