"use client"

import { useState } from "react"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { getSiteUrl } from "@/lib/site"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getSiteUrl()}/reset-password`,
      })

      if (error) {
        setError(error.message)
        return
      }

      setMessage("If an account exists for that email, a reset link has been sent.")
    } catch (err: any) {
      setError(err?.message ?? "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded border bg-card p-6 shadow-sm"
      >
        <h1 className="text-2xl font-semibold">Reset password</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <div>
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
        <p className="text-xs text-muted-foreground text-center">
          Remember your password?{" "}
          <Link href="/sign-in" className="text-primary underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
