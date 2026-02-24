"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LedgerExportBar() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  // Default to last 30 days on mount
  useEffect(() => {
    const today = new Date()
    const end = new Date(today)
    const start = new Date(today)
    start.setDate(start.getDate() - 30)

    const toStr = end.toISOString().slice(0, 10)
    const fromStr = start.toISOString().slice(0, 10)

    setFrom((prev) => prev || fromStr)
    setTo((prev) => prev || toStr)
  }, [])

  const handleDownload = () => {
    const params = new URLSearchParams()
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    const qs = params.toString()
    const url = `/dashboard/ledger/export.csv${qs ? `?${qs}` : ""}`
    window.open(url, "_blank")
  }

  return (
    <div className="flex flex-col md:flex-row md:items-end gap-4 rounded-md border bg-card p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="ledger-from">
          From
        </label>
        <Input
          id="ledger-from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="ledger-to">
          To
        </label>
        <Input
          id="ledger-to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="flex-1" />
      <Button
        type="button"
        variant="outline"
        className="self-start md:self-auto"
        onClick={handleDownload}
      >
        Download Ledger (CSV)
      </Button>
    </div>
  )
}

