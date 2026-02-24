"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, FileText } from "lucide-react"
import { formatMoney } from "@/lib/formatMoney"
import { useToast } from "@/hooks/use-toast"
import { getDefaultMonthRangeIST, validateRange } from "@/lib/billing/dateRange"
import { DateRangeControls } from "@/components/billing/DateRangeControls"

export default function BillingPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [summary, setSummary] = useState<{
    taxable: number
    gst: number
    total: number
  } | null>(null)

  // Default to current month
  useEffect(() => {
    const { from: defaultFrom, to: defaultTo } = getDefaultMonthRangeIST()
    setFrom(defaultFrom)
    setTo(defaultTo)
  }, [])

  const loadSummary = useCallback(async () => {
    if (!from || !to) return

    try {
      // Fetch ledger entries for summary
      const params = new URLSearchParams({
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
  }, [from, to])

  // Load summary when dates change
  useEffect(() => {
    if (from && to) {
      loadSummary()
    }
  }, [from, to, loadSummary])

  function handleDownloadInvoice() {
    if (!from || !to || !validateRange(from, to)) {
      toast({
        title: "Error",
        description: "Please select a valid date range",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        from,
        to,
      })
      const url = `/api/billing/invoice.pdf?${params}`
      
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
    if (!from || !to || !validateRange(from, to)) {
      toast({
        title: "Error",
        description: "Please select a valid date range",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
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

  const hasData = summary && summary.total > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Download your platform service invoice and statements
        </p>
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
          <DateRangeControls
            from={from}
            to={to}
            onChangeFrom={setFrom}
            onChangeTo={setTo}
          />
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
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleDownloadInvoice}
              disabled={loading || !from || !to || !validateRange(from, to)}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Invoice (PDF)
            </Button>
            <Button
              onClick={handleDownloadStatement}
              disabled={loading || !from || !to || !validateRange(from, to)}
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
