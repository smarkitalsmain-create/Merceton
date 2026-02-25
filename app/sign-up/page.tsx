"use client"

import { useState } from "react"
import Link from "next/link"
import { Store, TrendingUp, CreditCard, Zap, Shield } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { getSiteUrl } from "@/lib/site"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const BULLETS = [
  { icon: Store, text: "Your store, your brand" },
  { icon: TrendingUp, text: "Sell and scale with one dashboard" },
  { icon: CreditCard, text: "Transparent fees, weekly payouts" },
  { icon: Zap, text: "Go live in minutes, no code" },
  { icon: Shield, text: "Secure payments and payouts" },
]

const TESTIMONIAL = {
  quote: "We went from idea to first sale in a weekend. Merceton just works.",
  author: "Founder",
  role: "D2C brand",
}

const STATS = ["Weekly payouts", "Zero code setup", "Custom domain"]

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
    <AuthSplitLayout
      title="Create account"
      subtitle="Enter your details to get started."
      bullets={BULLETS}
      testimonial={TESTIMONIAL}
      stats={STATS}
      footerLink={{
        label: "Already have an account?",
        href: "/sign-in",
        linkText: "Sign in",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-green-600 dark:text-green-500" role="status">
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
    </AuthSplitLayout>
  )
}
