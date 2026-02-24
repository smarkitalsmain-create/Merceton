"use client"

import { useState } from "react"
import Link from "next/link"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getStoreUrl } from "@/lib/storeUrl"
import { useToast } from "@/hooks/use-toast"

interface StoreUrlDisplayProps {
  slug: string
}

export function StoreUrlDisplay({ slug }: StoreUrlDisplayProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const storeUrl = getStoreUrl(slug)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Store URL copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Store URL</label>
      <div className="flex items-center gap-2">
        <Link
          href={`/s/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex-1 truncate"
        >
          {storeUrl}
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
