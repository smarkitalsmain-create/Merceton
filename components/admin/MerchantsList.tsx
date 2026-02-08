"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { toggleMerchantStatus, updateMerchantFeeConfig } from "@/app/actions/admin"
import { Edit2, Save, X } from "lucide-react"

interface Merchant {
  id: string
  slug: string
  displayName: string
  isActive: boolean
  feePercentageBps: number | null
  feeFlatPaise: number | null
  feeMaxCapPaise: number | null
  _count: {
    orders: number
    products: number
  }
  orders: Array<{
    grossAmount: number
    platformFee: number
  }>
}

export function MerchantsList() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [feeConfig, setFeeConfig] = useState<{
    feePercentageBps: string
    feeFlatPaise: string
    feeMaxCapPaise: string
  }>({
    feePercentageBps: "",
    feeFlatPaise: "",
    feeMaxCapPaise: "",
  })
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // Fetch merchants on mount
  useEffect(() => {
    fetch("/api/admin/merchants")
      .then((res) => res.json())
      .then((data) => setMerchants(data))
      .catch((err) => {
        console.error("Failed to fetch merchants:", err)
        toast({
          title: "Error",
          description: "Failed to load merchants",
          variant: "destructive",
        })
      })
  }, [toast])

  const handleToggleStatus = (merchantId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await toggleMerchantStatus(merchantId, !currentStatus)
      if (result.success) {
        setMerchants((prev) =>
          prev.map((m) => (m.id === merchantId ? { ...m, isActive: result.merchant.isActive } : m))
        )
        toast({
          title: "Success",
          description: `Merchant ${result.merchant.isActive ? "activated" : "deactivated"}`,
        })
      }
    })
  }

  const handleStartEdit = (merchant: Merchant) => {
    setEditingId(merchant.id)
    setFeeConfig({
      feePercentageBps: merchant.feePercentageBps?.toString() || "",
      feeFlatPaise: merchant.feeFlatPaise?.toString() || "",
      feeMaxCapPaise: merchant.feeMaxCapPaise?.toString() || "",
    })
  }

  const handleSaveFeeConfig = (merchantId: string) => {
    startTransition(async () => {
      const result = await updateMerchantFeeConfig(merchantId, {
        feePercentageBps: feeConfig.feePercentageBps ? parseInt(feeConfig.feePercentageBps) : null,
        feeFlatPaise: feeConfig.feeFlatPaise ? parseInt(feeConfig.feeFlatPaise) : null,
        feeMaxCapPaise: feeConfig.feeMaxCapPaise ? parseInt(feeConfig.feeMaxCapPaise) : null,
      })

      if (result.success) {
        setMerchants((prev) =>
          prev.map((m) =>
            m.id === merchantId
              ? {
                  ...m,
                  feePercentageBps: result.merchant.feePercentageBps,
                  feeFlatPaise: result.merchant.feeFlatPaise,
                  feeMaxCapPaise: result.merchant.feeMaxCapPaise,
                }
              : m
          )
        )
        setEditingId(null)
        toast({
          title: "Success",
          description: "Fee configuration updated",
        })
      }
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFeeConfig({ feePercentageBps: "", feeFlatPaise: "", feeMaxCapPaise: "" })
  }

  if (merchants.length === 0) {
    return <p className="text-muted-foreground text-center py-8">Loading merchants...</p>
  }

  return (
    <div className="space-y-4">
      {merchants.map((merchant) => {
        const totalGMV = merchant.orders.reduce((sum, o) => sum + Number(o.grossAmount), 0)
        const totalFees = merchant.orders.reduce((sum, o) => sum + Number(o.platformFee), 0)
        const isEditing = editingId === merchant.id

        return (
          <Card key={merchant.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{merchant.displayName}</h3>
                      <Badge variant={merchant.isActive ? "default" : "secondary"}>
                        {merchant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">/{merchant.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`toggle-${merchant.id}`} className="text-sm">
                      Active
                    </Label>
                    <input
                      type="checkbox"
                      id={`toggle-${merchant.id}`}
                      checked={merchant.isActive}
                      onChange={() => handleToggleStatus(merchant.id, merchant.isActive)}
                      disabled={isPending}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Orders</p>
                    <p className="font-semibold">{merchant._count.orders}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Products</p>
                    <p className="font-semibold">{merchant._count.products}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">GMV</p>
                    <p className="font-semibold">₹{totalGMV.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fees</p>
                    <p className="font-semibold">₹{totalFees.toFixed(2)}</p>
                  </div>
                </div>

                {/* Fee Configuration */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Fee Configuration</Label>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEdit(merchant)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveFeeConfig(merchant.id)}
                          disabled={isPending}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`bps-${merchant.id}`} className="text-xs">
                          Percentage (bps)
                        </Label>
                        <Input
                          id={`bps-${merchant.id}`}
                          type="number"
                          placeholder="200"
                          value={feeConfig.feePercentageBps}
                          onChange={(e) =>
                            setFeeConfig({ ...feeConfig, feePercentageBps: e.target.value })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {feeConfig.feePercentageBps ? `${parseInt(feeConfig.feePercentageBps) / 100}%` : "Default: 2%"}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor={`flat-${merchant.id}`} className="text-xs">
                          Flat Fee (paise)
                        </Label>
                        <Input
                          id={`flat-${merchant.id}`}
                          type="number"
                          placeholder="500"
                          value={feeConfig.feeFlatPaise}
                          onChange={(e) =>
                            setFeeConfig({ ...feeConfig, feeFlatPaise: e.target.value })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {feeConfig.feeFlatPaise ? `₹${(parseInt(feeConfig.feeFlatPaise) / 100).toFixed(2)}` : "Default: ₹5"}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor={`cap-${merchant.id}`} className="text-xs">
                          Max Cap (paise)
                        </Label>
                        <Input
                          id={`cap-${merchant.id}`}
                          type="number"
                          placeholder="2500"
                          value={feeConfig.feeMaxCapPaise}
                          onChange={(e) =>
                            setFeeConfig({ ...feeConfig, feeMaxCapPaise: e.target.value })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {feeConfig.feeMaxCapPaise ? `₹${(parseInt(feeConfig.feeMaxCapPaise) / 100).toFixed(2)}` : "Default: ₹25"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <p>
                        {merchant.feePercentageBps
                          ? `${merchant.feePercentageBps / 100}%`
                          : "2% (default)"}{" "}
                        +{" "}
                        {merchant.feeFlatPaise
                          ? `₹${(merchant.feeFlatPaise / 100).toFixed(2)}`
                          : "₹5.00 (default)"}
                        {merchant.feeMaxCapPaise && (
                          <> (max ₹{(merchant.feeMaxCapPaise / 100).toFixed(2)})</>
                        )}
                        {!merchant.feeMaxCapPaise && <> (max ₹25.00 default)</>}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
