"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Edit2, Trash2, Copy, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { deleteCoupon } from "@/app/actions/coupons"
import { CouponType } from "@prisma/client"
import { formatCurrency } from "@/lib/utils/currency"

interface Coupon {
  id: string
  code: string
  type: CouponType
  value: any // Decimal
  minOrderAmount: any | null
  maxDiscount: any | null
  validFrom: Date
  validUntil: Date | null
  usageLimit: number | null
  isActive: boolean
  description: string | null
  createdAt: Date
  _count: {
    redemptions: number
  }
}

interface CouponsListProps {
  initialCoupons: Coupon[]
}

export function CouponsList({ initialCoupons }: CouponsListProps) {
  const [coupons, setCoupons] = useState(initialCoupons)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleDelete = (couponId: string) => {
    if (!confirm("Are you sure you want to disable this coupon?")) {
      return
    }

    startTransition(async () => {
      try {
        const result = await deleteCoupon(couponId)
        if (result.success) {
          setCoupons((prev) => prev.filter((c) => c.id !== couponId))
          toast({
            title: "Coupon disabled",
            description: "The coupon has been disabled successfully.",
          })
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to disable coupon",
          variant: "destructive",
        })
      }
    })
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Copied",
      description: "Coupon code copied to clipboard",
    })
  }

  const getStatus = (coupon: Coupon) => {
    if (!coupon.isActive) {
      return { label: "Disabled", variant: "secondary" as const }
    }

    const now = new Date()
    if (coupon.validFrom > now) {
      return { label: "Scheduled", variant: "secondary" as const }
    }

    if (coupon.validUntil && coupon.validUntil < now) {
      return { label: "Expired", variant: "destructive" as const }
    }

    if (coupon.usageLimit && coupon._count.redemptions >= coupon.usageLimit) {
      return { label: "Limit Reached", variant: "destructive" as const }
    }

    return { label: "Active", variant: "default" as const }
  }

  if (coupons.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-lg text-muted-foreground mb-4">No coupons yet</p>
          <Button asChild>
            <Link href="/dashboard/marketing/coupons/new">Create Your First Coupon</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {coupons.map((coupon) => {
        const status = getStatus(coupon)
        const value = Number(coupon.value)
        const discountDisplay =
          coupon.type === "PERCENT" ? `${value}%` : `₹${value.toFixed(2)}`

        return (
          <Card key={coupon.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold font-mono">{coupon.code}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Discount: {discountDisplay}
                    {coupon.type === "PERCENT" && coupon.maxDiscount && (
                      <span> (max ₹{Number(coupon.maxDiscount).toFixed(2)})</span>
                    )}
                  </p>

                  {coupon.description && (
                    <p className="text-sm text-muted-foreground">{coupon.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {coupon.minOrderAmount && (
                      <span>Min order: ₹{Number(coupon.minOrderAmount).toFixed(2)}</span>
                    )}
                    <span>
                      Valid: {new Date(coupon.validFrom).toLocaleDateString()}
                      {coupon.validUntil && ` - ${new Date(coupon.validUntil).toLocaleDateString()}`}
                    </span>
                    {coupon.usageLimit && (
                      <span>
                        Usage: {coupon._count.redemptions} / {coupon.usageLimit}
                      </span>
                    )}
                    {!coupon.usageLimit && (
                      <span>Usage: {coupon._count.redemptions} (unlimited)</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/marketing/coupons/${coupon.id}/edit`}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(coupon.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disable
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
