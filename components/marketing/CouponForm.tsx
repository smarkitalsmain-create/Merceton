"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"
import { createCoupon, updateCoupon } from "@/app/actions/coupons"
import { CouponType } from "@prisma/client"

const couponSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must be 50 characters or less")
    .regex(/^[A-Z0-9_-]+$/, "Code can only contain uppercase letters, numbers, hyphens, and underscores"),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().positive("Value must be positive"),
  minOrderAmount: z.coerce.number().positive().optional().nullable(),
  maxDiscount: z.coerce.number().positive().optional().nullable(),
  validFrom: z.string().min(1, "Valid from date is required"),
  validUntil: z.string().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
})

type CouponFormData = z.infer<typeof couponSchema>

interface CouponFormProps {
  initialData?: {
    id: string
    code: string
    type: CouponType
    value: number
    minOrderAmount: number | null
    maxDiscount: number | null
    validFrom: Date
    validUntil: Date | null
    usageLimit: number | null
    description: string | null
  }
}

export function CouponForm({ initialData }: CouponFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          type: initialData.type,
          value: initialData.value,
          minOrderAmount: initialData.minOrderAmount || undefined,
          maxDiscount: initialData.maxDiscount || undefined,
          validFrom: new Date(initialData.validFrom).toISOString().split("T")[0],
          validUntil: initialData.validUntil
            ? new Date(initialData.validUntil).toISOString().split("T")[0]
            : undefined,
          usageLimit: initialData.usageLimit || undefined,
          description: initialData.description || undefined,
        }
      : {
          type: "PERCENT",
          validFrom: new Date().toISOString().split("T")[0],
        },
  })

  const couponType = watch("type")
  const value = watch("value")

  const onSubmit = (data: CouponFormData) => {
    startTransition(async () => {
      try {
        const payload = {
          ...data,
          validFrom: new Date(data.validFrom),
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
        }

        if (initialData) {
          const result = await updateCoupon({
            id: initialData.id,
            ...payload,
          })
          if (result.success) {
            toast({
              title: "Coupon updated",
              description: "Coupon has been updated successfully.",
            })
            router.push("/dashboard/marketing/coupons")
          }
        } else {
          const result = await createCoupon(payload)
          if (result.success) {
            toast({
              title: "Coupon created",
              description: "Coupon has been created successfully.",
            })
            router.push("/dashboard/marketing/coupons")
          }
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to save coupon",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Edit Coupon" : "Create Coupon"}</CardTitle>
          <CardDescription>
            {initialData
              ? "Update coupon details"
              : "Create a new discount coupon for your customers"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code *</Label>
            <Input
              id="code"
              {...register("code")}
              placeholder="SAVE20"
              className="font-mono"
              disabled={!!initialData} // Don't allow editing code after creation
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Uppercase letters, numbers, hyphens, and underscores only. Cannot be changed after creation.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Discount Type *</Label>
            <RadioGroup
              value={couponType}
              onValueChange={(value) => {
                setValue("type", value as "PERCENT" | "FIXED")
                // Reset value when switching types
                setValue("value", 0)
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PERCENT" id="percent" />
                <Label htmlFor="percent" className="font-normal cursor-pointer">
                  Percentage (%)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="FIXED" id="fixed" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer">
                  Fixed Amount (₹)
                </Label>
              </div>
            </RadioGroup>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">
              Discount Value *{" "}
              {couponType === "PERCENT" && (
                <span className="text-muted-foreground">(0-100)</span>
              )}
            </Label>
            <Input
              id="value"
              type="number"
              step={couponType === "PERCENT" ? "1" : "0.01"}
              min="0"
              max={couponType === "PERCENT" ? "100" : undefined}
              {...register("value")}
              placeholder={couponType === "PERCENT" ? "20" : "100.00"}
            />
            {errors.value && (
              <p className="text-sm text-destructive">{errors.value.message}</p>
            )}
            {couponType === "PERCENT" && value && value > 100 && (
              <p className="text-sm text-destructive">
                Percentage discount cannot exceed 100%
              </p>
            )}
          </div>

          {couponType === "PERCENT" && (
            <div className="space-y-2">
              <Label htmlFor="maxDiscount">Maximum Discount (₹)</Label>
              <Input
                id="maxDiscount"
                type="number"
                step="0.01"
                min="0"
                {...register("maxDiscount")}
                placeholder="500.00"
              />
              {errors.maxDiscount && (
                <p className="text-sm text-destructive">{errors.maxDiscount.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Optional: Limit the maximum discount amount for percentage coupons
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="minOrderAmount">Minimum Order Amount (₹)</Label>
            <Input
              id="minOrderAmount"
              type="number"
              step="0.01"
              min="0"
              {...register("minOrderAmount")}
              placeholder="500.00"
            />
            {errors.minOrderAmount && (
              <p className="text-sm text-destructive">{errors.minOrderAmount.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Optional: Minimum order amount required to use this coupon
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Valid From *</Label>
              <Input
                id="validFrom"
                type="date"
                {...register("validFrom")}
              />
              {errors.validFrom && (
                <p className="text-sm text-destructive">{errors.validFrom.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                {...register("validUntil")}
              />
              {errors.validUntil && (
                <p className="text-sm text-destructive">{errors.validUntil.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Optional: Leave empty for no expiration
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usageLimit">Usage Limit</Label>
            <Input
              id="usageLimit"
              type="number"
              step="1"
              min="1"
              {...register("usageLimit")}
              placeholder="100"
            />
            {errors.usageLimit && (
              <p className="text-sm text-destructive">{errors.usageLimit.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Optional: Maximum number of times this coupon can be used. Leave empty for unlimited.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Optional description for internal use"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Saving..." : initialData ? "Update Coupon" : "Create Coupon"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
