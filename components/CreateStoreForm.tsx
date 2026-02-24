"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CreateStoreForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const storeName = formData.get("storeName") as string
    const storeSlug = formData.get("storeSlug") as string

    try {
      const res = await fetch("/api/merchant/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, storeSlug }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create store")
      }

      // Redirect to dashboard after successful creation
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
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              This will be displayed to your customers
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeSlug">Store URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">merceton.com/s/</span>
              <Input
                id="storeSlug"
                name="storeSlug"
                required
                pattern="[a-z0-9-]+"
                placeholder="my-store"
                className="flex-1"
                disabled={loading}
                onChange={(e) => {
                  // Auto-format: lowercase, replace spaces with hyphens
                  const value = e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "")
                  e.target.value = value
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Only lowercase letters, numbers, and hyphens. This will be your storefront URL.
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating Store..." : "Create Store"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
