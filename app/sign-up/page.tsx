"use client"

import { useState } from "react"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { getSiteUrl } from "@/lib/site"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const supabase = createSupabaseBrowserClient()
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        },
      })

      if (err) {
        setError(err.message)
        return
      }

      setMessage("Check your email to confirm your account.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      variant="merchant"
      mode="signup"
      title="Create account"
      subtitle="Enter your details to get started."
      footerLink={{
        label: "Already have an account?",
        href: "/sign-in",
        linkText: "Sign in",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Continue with email</span>
          </div>
        </div>

        {error && (
          <p
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        {message && (
          <p
            className="text-sm text-green-600 dark:text-green-500"
            role="status"
          >
            {message}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-confirm">Confirm password</Label>
          <Input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            className="bg-background"
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Creating account…" : "Sign up"}
        </Button>
      </form>
    </AuthShell>
  )
}
