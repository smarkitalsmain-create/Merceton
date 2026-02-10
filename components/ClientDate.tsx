"use client"

import { useEffect, useState } from "react"

interface ClientDateProps {
  value: string | Date
  className?: string
}

export function ClientDate({ value, className }: ClientDateProps) {
  const [formatted, setFormatted] = useState<string>("")

  useEffect(() => {
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

  if (!formatted) return null

  return <span className={className}>{formatted}</span>
}

