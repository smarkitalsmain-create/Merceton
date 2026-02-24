"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export function AdminUserMenu() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setEmail((data.user?.email as string | null) ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSignOut() {
    // Use the sign-out route handler
    await fetch("/admin/sign-out", { method: "POST" })
    router.push("/admin/sign-in")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      {!loading && email && (
        <span
          className="max-w-[200px] truncate text-muted-foreground"
          title={email}
        >
          {email}
        </span>
      )}
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded border px-2 py-1 text-xs font-medium hover:bg-muted"
      >
        Sign out
      </button>
    </div>
  )
}
