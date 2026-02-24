"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function StoreSetupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function safeJson(res: Response) {
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(text.slice(0, 200) || "Unexpected response from server")
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const storeName = formData.get("storeName") as string
    const storeSlug = formData.get("storeSlug") as string
    const description = formData.get("description") as string

    try {
      const res = await fetch("/api/merchant/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, storeSlug, description }),
      })

      if (!res.ok) {
        const data = await safeJson(res)
        throw new Error(data.error || "Failed to create store")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Information</CardTitle>
        <CardDescription>Enter your store details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <Input
              id="storeName"
              name="storeName"
              required
              placeholder="My Awesome Store"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeSlug">Store URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">merceton.com/store/</span>
              <Input
                id="storeSlug"
                name="storeSlug"
                required
                pattern="[a-z0-9-]+"
                placeholder="my-store"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Only lowercase letters, numbers, and hyphens
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Tell customers about your store"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Store"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
