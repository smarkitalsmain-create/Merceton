"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface DomainSettingsProps {
  merchant: {
    customDomain: string | null
    domainStatus: string
    domainVerificationToken: string | null
  }
}

export function DomainSettings({ merchant: initialMerchant }: DomainSettingsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [merchant, setMerchant] = useState(initialMerchant)
  const [domain, setDomain] = useState(merchant.customDomain || "")

  const handleSaveDomain = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/domains/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customDomain: domain }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to save domain")
        }

        const data = await response.json()
        setMerchant(data.merchant)
        toast({
          title: "Domain saved",
          description: data.message,
        })
        router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to save domain",
          variant: "destructive",
        })
      }
    })
  }

  const handleVerify = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/domains/verify", {
          method: "POST",
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to verify domain")
        }

        const data = await response.json()
        setMerchant(data.merchant)
        toast({
          title: data.verified ? "Domain verified" : "Verification failed",
          description: data.message,
        })
        router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to verify domain",
          variant: "destructive",
        })
      }
    })
  }

  const handleActivate = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/domains/activate", {
          method: "POST",
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to activate domain")
        }

        const data = await response.json()
        setMerchant(data.merchant)
        toast({
          title: "Domain activated",
          description: data.message,
        })
        router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to activate domain",
          variant: "destructive",
        })
      }
    })
  }

  const getStatusBadge = () => {
    switch (merchant.domainStatus) {
      case "PENDING":
        return <Badge variant="outline">PENDING</Badge>
      case "VERIFIED":
        return <Badge variant="secondary">VERIFIED</Badge>
      case "ACTIVE":
        return <Badge>ACTIVE</Badge>
      default:
        return <Badge variant="outline">Not Set</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Domain</CardTitle>
        <CardDescription>Connect your own domain to your storefront</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="domain">Domain</Label>
          <Input
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="mystore.com"
            disabled={!!merchant.customDomain && merchant.domainStatus !== "PENDING"}
          />
          <p className="text-sm text-muted-foreground">
            Enter your domain without www or protocol (e.g., mystore.com)
          </p>
        </div>

        {merchant.customDomain && (
          <div className="space-y-2">
            <Label>Status</Label>
            <div>{getStatusBadge()}</div>
          </div>
        )}

        <div className="flex gap-2">
          {!merchant.customDomain || merchant.domainStatus === "PENDING" ? (
            <Button onClick={handleSaveDomain} disabled={isPending || !domain.trim()}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Domain"
              )}
            </Button>
          ) : null}

          {merchant.customDomain && merchant.domainStatus === "PENDING" && (
            <Button onClick={handleVerify} disabled={isPending} variant="outline">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Domain"
              )}
            </Button>
          )}

          {merchant.customDomain && merchant.domainStatus === "VERIFIED" && (
            <Button onClick={handleActivate} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                "Activate Domain"
              )}
            </Button>
          )}
        </div>

        {merchant.customDomain && merchant.domainStatus === "PENDING" && merchant.domainVerificationToken && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">DNS Instructions</p>
            <p className="text-sm text-muted-foreground">
              Add this TXT record to your DNS:
            </p>
            <div className="font-mono text-sm space-y-1">
              <div><strong>Type:</strong> TXT</div>
              <div><strong>Name:</strong> _sellarity.{merchant.customDomain}</div>
              <div><strong>Value:</strong> {merchant.domainVerificationToken}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              After adding the DNS record, click "Verify Domain" to check verification.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
