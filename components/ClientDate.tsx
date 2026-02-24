"use client"

import { useEffect, useState } from "react"

interface ClientDateProps {
  value: string | Date
  className?: string
}

export function ClientDate({ value, className }: ClientDateProps) {
  const [formatted, setFormatted] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const date = typeof value === "string" ? new Date(value) : value
    if (Number.isNaN(date.getTime())) {
      setFormatted("")
      return
    }

    // Fixed locale and options to avoid environment differences
    const formatter = new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })

    setFormatted(formatter.format(date))
  }, [value])

  // Render a stable placeholder on server to avoid hydration mismatch
  if (!mounted || !formatted) {
    return <span className={className}>—</span>
  }

  return <span className={className}>{formatted}</span>
}

