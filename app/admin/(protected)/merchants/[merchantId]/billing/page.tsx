"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, FileText } from "lucide-react"
import { formatMoney } from "@/lib/formatMoney"
import { useToast } from "@/hooks/use-toast"

export default function AdminBillingPage() {
  const params = useParams()
  const merchantId = params.merchantId as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [summary, setSummary] = useState<{
    taxable: number
    gst: number
    total: number
  } | null>(null)
  const [merchantInfo, setMerchantInfo] = useState<{
    displayName: string
    gstin: string | null
    state: string | null
  } | null>(null)

  // Default to current month
  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    setFrom(firstDay.toISOString().slice(0, 10))
    setTo(lastDay.toISOString().slice(0, 10))
  }, [])

  const loadMerchantInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/merchants/${merchantId}`)
      if (!res.ok) throw new Error("Failed to load merchant")
      const data = await res.json()
      setMerchantInfo({
        displayName: data.merchant?.displayName || "Unknown",
        gstin: data.merchant?.onboarding?.gstin || null,
        state: data.merchant?.onboarding?.gstState || null,
      })
    } catch (error) {
      console.error("Error loading merchant info:", error)
    }
  }, [merchantId])

  const loadSummary = useCallback(async () => {
    if (!from || !to || !merchantId) return

    try {
      const params = new URLSearchParams({
        merchantId,
        from,
        to,
      })
      const res = await fetch(`/api/billing/statement.csv?${params}`)
      if (!res.ok) {
        throw new Error("Failed to load summary")
      }
      const text = await res.text()
      const lines = text.split("\n")
      if (lines.length <= 1) {
        setSummary({ taxable: 0, gst: 0, total: 0 })
        return
      }

      // Parse CSV to calculate summary
      let totalTaxable = 0
      let totalGst = 0
      let totalAmount = 0

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Parse CSV line (handle quoted values)
        const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || []
        if (values.length < 10) continue

        const baseAmount = parseFloat(values[4]?.replace(/"/g, "") || "0")
        const cgst = parseFloat(values[5]?.replace(/"/g, "") || "0")
        const sgst = parseFloat(values[6]?.replace(/"/g, "") || "0")
        const igst = parseFloat(values[7]?.replace(/"/g, "") || "0")
        const total = parseFloat(values[9]?.replace(/"/g, "") || "0")

        totalTaxable += baseAmount
        totalGst += cgst + sgst + igst
        totalAmount += total
      }

      setSummary({
        taxable: totalTaxable,
        gst: totalGst,
        total: totalAmount,
      })
    } catch (error) {
      console.error("Error loading summary:", error)
      setSummary(null)
    }
  }, [from, to, merchantId])

  async function handleDownloadInvoice() {
    if (!from || !to) {
      toast({
        title: "Error",
        description: "Please select a date range",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        merchantId,
        from,
        to,
      })
      const url = `/api/billing/invoice.pdf?${params}`
      const response = await fetch(url)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to download invoice" }))
        throw new Error(error.error || "Failed to download invoice")
      }
      const blob = await response.blob()
      const contentDisposition = response.headers.get("Content-Disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch
        ? filenameMatch[1]
        : `merceton-invoice-${merchantId}-${from}-${to}.pdf`

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      })
    } catch (error: any) {
      console.error("Error downloading invoice:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadStatement() {
    if (!from || !to) {
      toast({
        title: "Error",
        description: "Please select a date range",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        merchantId,
        from,
        to,
      })
      const url = `/api/billing/statement.csv?${params}`
      const response = await fetch(url)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to download statement" }))
        throw new Error(error.error || "Failed to download statement")
      }
      const blob = await response.blob()
      const contentDisposition = response.headers.get("Content-Disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch
        ? filenameMatch[1]
        : `merceton-statement-${merchantId}-${from}-${to}.csv`

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast({
        title: "Success",
        description: "Statement downloaded successfully",
      })
    } catch (error: any) {
      console.error("Error downloading statement:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to download statement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const hasData = summary && summary.total > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Invoices</h1>
        <p className="text-muted-foreground">
          Download invoices and statements for {merchantInfo?.displayName || "merchant"}
        </p>
        {merchantInfo && (
          <div className="mt-2 text-sm text-muted-foreground">
            {merchantInfo.gstin && <span>GSTIN: {merchantInfo.gstin}</span>}
            {merchantInfo.gstin && merchantInfo.state && <span> • </span>}
            {merchantInfo.state && <span>State: {merchantInfo.state}</span>}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Taxable Value</CardTitle>
              <CardDescription>Base amount before GST</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{formatMoney(summary.taxable)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">GST</CardTitle>
              <CardDescription>Total GST amount</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{formatMoney(summary.gst)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Fees</CardTitle>
              <CardDescription>Including GST</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{formatMoney(summary.total)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Date Range Picker */}
      <Card>
        <CardHeader>
          <CardTitle>Select Period</CardTitle>
          <CardDescription>Choose date range for invoice/statement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="from">From Date</Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="to">To Date</Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Downloads</CardTitle>
          <CardDescription>
            {hasData
              ? "Download invoice PDF or CSV statement for the selected period"
              : "No fees found in the selected period"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleDownloadInvoice}
                disabled={loading}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice (PDF)
              </Button>
              <Button
                onClick={handleDownloadStatement}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Download Statement (CSV)
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No platform fees found in the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
