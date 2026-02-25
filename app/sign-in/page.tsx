"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    <AuthShell
      variant="merchant"
      mode="signin"
      title="Sign in"
      subtitle="Enter your email and password to access your dashboard."
      footerLink={{
        label: "Don't have an account?",
        href: "/sign-up",
        linkText: "Sign up",
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
    </AuthShell>
  )
}
