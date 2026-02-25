"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import { DateRangeControls } from "@/components/billing/DateRangeControls"
import { getDefaultMonthRangeIST, validateRange } from "@/lib/billing/dateRange"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Merchant {
  id: string
  displayName: string
  users: Array<{ email: string }>
}

interface PlatformInvoicesClientProps {
  merchants: Merchant[]
}

export function PlatformInvoicesClient({ merchants }: PlatformInvoicesClientProps) {
  const { toast } = useToast()
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [loading, setLoading] = useState(false)

  // Initialize dates on mount
  useEffect(() => {
    const { from: defaultFrom, to: defaultTo } = getDefaultMonthRangeIST()
    setFrom(defaultFrom)
    setTo(defaultTo)
  }, [])

  const isValid = selectedMerchantId && from && to && validateRange(from, to)

  function handleDownloadInvoice() {
    if (!isValid) {
      toast({
        title: "Error",
        description: "Please select a merchant and valid date range",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        merchantId: selectedMerchantId,
        from,
        to,
      })
      const url = `/api/admin/billing/invoice.pdf?${params}`
      
      // Direct download using window.location.href
      window.location.href = url
      
      // Note: We can't detect success/failure with direct navigation
      // The browser will handle the download or show error
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    } catch (error: any) {
      console.error("Error downloading invoice:", error)
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  function handleDownloadStatement() {
    if (!isValid) {
      toast({
        title: "Error",
        description: "Please select a merchant and valid date range",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        merchantId: selectedMerchantId,
        from,
        to,
      })
      const url = `/api/billing/statement.csv?${params}`
      
      // Direct download using window.location.href
      window.location.href = url
      
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    } catch (error: any) {
      console.error("Error downloading statement:", error)
      toast({
        title: "Error",
        description: "Failed to download statement",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* On-Demand Invoice Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Invoice (On-Demand)</CardTitle>
          <CardDescription>
            Download invoices generated from ledger entries for any merchant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Merchant Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Merchant</label>
            <Select value={selectedMerchantId} onValueChange={setSelectedMerchantId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a merchant" />
              </SelectTrigger>
              <SelectContent>
                {merchants.map((merchant) => (
                  <SelectItem key={merchant.id} value={merchant.id}>
                    {merchant.displayName}
                    {merchant.users[0]?.email && ` (${merchant.users[0].email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium mb-2 block">Period</label>
            <DateRangeControls
              from={from}
              to={to}
              onChangeFrom={setFrom}
              onChangeTo={setTo}
            />
          </div>

          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={handleDownloadInvoice}
              disabled={!isValid || loading}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Invoice (PDF)
            </Button>
            <Button
              onClick={handleDownloadStatement}
              disabled={!isValid || loading}
              variant="outline"
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Statement (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
