"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Store, TrendingUp, CreditCard, Zap } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const BULLETS = [
  { icon: Store, text: "Your store, your brand" },
  { icon: TrendingUp, text: "Sell and scale with one dashboard" },
  { icon: CreditCard, text: "Transparent fees, weekly payouts" },
  { icon: Zap, text: "Go live in minutes, no code" },
]

const TESTIMONIAL = {
  quote: "We went from idea to first sale in a weekend. Merceton just works.",
  author: "Founder",
  role: "D2C brand",
}

const STATS = ["Weekly payouts", "Zero code setup", "Custom domain"]

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createSupabaseBrowserClient()
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (err) {
        setError(err.message)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      title="Sign in"
      subtitle="Enter your email and password to access your dashboard."
      bullets={BULLETS}
      testimonial={TESTIMONIAL}
      stats={STATS}
      footerLink={{
        label: "Don't have an account?",
        href: "/sign-up",
        linkText: "Sign up",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="signin-email">Email</Label>
          <Input
            id="signin-email"
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
          <div className="flex items-center justify-between">
            <Label htmlFor="signin-password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthSplitLayout>
  )
}
