"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface DomainSettingsFormProps {
  merchant: {
    id: string
    customDomain: string | null
    domainStatus: "PENDING" | "VERIFIED" | "ACTIVE"
    domainVerificationToken: string | null
    domainVerifiedAt: Date | null
  }
}

// Note: ACTIVE status exists in schema but step 4.4 uses VERIFIED for routing

export function DomainSettingsForm({ merchant: initialMerchant }: DomainSettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [merchant, setMerchant] = useState(initialMerchant)
  const [domain, setDomain] = useState(merchant.customDomain || "")

  const handleSave = () => {
    if (!domain.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/domains/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customDomain: domain.trim() }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Failed to save domain")
        }

        setMerchant(data.merchant)
        setDomain(data.merchant.customDomain || "")
        toast({
          title: "Domain saved",
          description: data.message || "Please add the DNS record to verify your domain",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save domain",
          variant: "destructive",
        })
      }
    })
  }

  const handleVerify = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/domains/verify", {
          method: "POST",
        })

        const data = await res.json()

        if (!res.ok) {
          // Handle detailed error messages
          const errorMsg = data.error || "Failed to verify domain"
          // Keep status as PENDING in this deployment; show error via toast.
          toast({
            title: "Verification failed",
            description: errorMsg,
            variant: "destructive",
          })
          router.refresh()
          return
        }

        setMerchant(data.merchant)
        toast({
          title: data.verified ? "Domain verified" : "Verification failed",
          description: data.message,
          variant: data.verified ? "default" : "destructive",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to verify domain",
          variant: "destructive",
        })
      }
    })
  }

  const handleDisconnect = () => {
    if (!confirm("Are you sure you want to disconnect this domain?")) return

    startTransition(async () => {
      try {
        const res = await fetch("/api/domains/disconnect", {
          method: "POST",
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Failed to disconnect domain")
        }

        setMerchant(data.merchant)
        setDomain("")
        toast({
          title: "Domain disconnected",
          description: "Your custom domain has been removed",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to disconnect domain",
          variant: "destructive",
        })
      }
    })
  }

  const getStatusBadge = () => {
    switch (merchant.domainStatus) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="mr-1 h-3 w-3" />
            PENDING
          </Badge>
        )
      case "VERIFIED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            VERIFIED
          </Badge>
        )
      case "ACTIVE":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            ACTIVE
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Domain Configuration</CardTitle>
          <CardDescription>
            Connect your custom domain to serve your storefront
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Custom Domain</Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="www.mystore.com"
              disabled={!!merchant.customDomain}
            />
            <p className="text-sm text-muted-foreground">
              Enter your domain without protocol (e.g., www.mystore.com)
            </p>
          </div>

          {merchant.customDomain && (
            <div className="space-y-2">
              <Label>Status</Label>
              <div>{getStatusBadge()}</div>
            </div>
          )}

          <div className="flex gap-2">
            {!merchant.customDomain && (
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Domain"
                )}
              </Button>
            )}

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

            {/* Activate button removed - step 4.4 uses VERIFIED status for routing */}

            {merchant.customDomain && (
              <Button
                onClick={handleDisconnect}
                disabled={isPending}
                variant="destructive"
              >
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {merchant.customDomain && merchant.domainStatus === "PENDING" && (
        <Card>
          <CardHeader>
            <CardTitle>DNS Verification Instructions</CardTitle>
            <CardDescription>
              Add this TXT record to your DNS to verify domain ownership
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
              <div>
                <strong>Type:</strong> TXT
              </div>
              <div>
                <strong>Name/Host:</strong> _merceton-verify.{merchant.customDomain}
              </div>
              <div>
                <strong>Value:</strong> {merchant.domainVerificationToken}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">How to add this record:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Log in to your domain registrar or DNS provider</li>
                <li>Navigate to DNS management / DNS records</li>
                <li>Add a new TXT record with the values above</li>
                <li>Save the changes</li>
                <li>Wait 2-5 minutes for DNS propagation</li>
                <li>Click &quot;Verify Domain&quot; button above</li>
              </ol>
            </div>
            <p className="text-sm text-muted-foreground">
              DNS changes may take a few minutes to propagate. If verification fails, wait a bit longer and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {merchant.customDomain && merchant.domainStatus === "VERIFIED" && (
        <Card>
          <CardHeader>
            <CardTitle>Domain Verified</CardTitle>
            <CardDescription>Your custom domain has been verified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900 font-medium mb-2">✓ Domain verification successful</p>
              <p className="text-sm text-green-800">
                Your domain <strong>{merchant.customDomain}</strong> has been verified and is ready to use.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">Next Steps:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Configure your domain&apos;s DNS to point to our servers (A/CNAME records)</li>
                <li>SSL certificate provisioning is in progress</li>
                <li>Once DNS and SSL are configured, your storefront will be available at:{" "}
                  <a
                    href={`https://${merchant.customDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    https://{merchant.customDomain}
                  </a>
                </li>
              </ol>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> SSL provisioning may take a few minutes to complete. Your domain will be fully active once SSL is provisioned.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
