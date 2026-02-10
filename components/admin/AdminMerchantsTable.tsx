"use client"

import { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { activateMerchant, deactivateMerchant } from "@/app/actions/admin"
import Link from "next/link"
import { CheckCircle2, XCircle, Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { formatMoney } from "@/lib/formatMoney"
import { ClientDate } from "@/components/ClientDate"

interface Merchant {
  id: string
  slug: string
  displayName: string
  isActive: boolean
  createdAt: Date
  customDomain: string | null
  domainStatus: string
  feeConfig: {
    pricingPackage: {
      id: string
      name: string
      status: string
    } | null
  } | null
  _count: {
    orders: number
    products: number
  }
  gmv: number
}

interface AdminMerchantsTableProps {
  merchants: Merchant[]
}

export function AdminMerchantsTable({ merchants }: AdminMerchantsTableProps) {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(searchParams.get("search") || "")

  const handleSearch = (value: string) => {
    setSearch(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }
    router.push(`/admin/merchants?${params.toString()}`)
  }

  const handleToggleStatus = (merchantId: string, currentStatus: boolean) => {
    const reason = prompt(
      `Reason for ${currentStatus ? "deactivating" : "activating"} this merchant:`
    )
    if (!reason) return

    startTransition(async () => {
      try {
        let result
        if (currentStatus) {
          result = await deactivateMerchant(merchantId, reason)
        } else {
          result = await activateMerchant(merchantId, reason)
        }
        if (result.success) {
          toast({
            title: "Success",
            description: `Merchant ${result.merchant.isActive ? "activated" : "deactivated"}`,
          })
          router.refresh()
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update merchant status",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search merchants..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merchant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pricing Package</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {merchants.map((merchant) => (
              <TableRow key={merchant.id}>
                <TableCell>
                  <div>
                    <Link
                      href={`/admin/merchants/${merchant.id}`}
                      className="font-medium hover:underline"
                    >
                      {merchant.displayName}
                    </Link>
                    <p className="text-xs text-muted-foreground">/{merchant.slug}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={merchant.isActive ? "default" : "secondary"}>
                    {merchant.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {merchant.feeConfig?.pricingPackage ? (
                    <div>
                      <p className="text-sm font-medium">{merchant.feeConfig.pricingPackage.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {merchant.feeConfig.pricingPackage.status}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No package</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  <div>Orders: {merchant._count.orders}</div>
                  <div>Products: {merchant._count.products}</div>
                  <div>GMV: ₹{formatMoney(merchant.gmv)}</div>
                </TableCell>
                <TableCell>
                  <ClientDate value={merchant.createdAt} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(merchant.id, merchant.isActive)}
                      disabled={isPending}
                    >
                      {merchant.isActive ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/merchants/${merchant.id}`}>View</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
