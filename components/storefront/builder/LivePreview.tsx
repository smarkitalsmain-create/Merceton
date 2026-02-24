"use client"

import { useState } from "react"
import { StorefrontConfig } from "@/lib/storefront/core/config/schema"
import { themeToCssVars } from "@/lib/storefront/core/css-vars"
import { SectionRenderer } from "../SectionRenderer"
import { StorefrontHeader } from "@/components/StorefrontHeader"
import { StorefrontFooter } from "../StorefrontFooter"
import { Monitor, Tablet, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LivePreviewProps {
  config: StorefrontConfig
  merchantSlug: string
}

// Mock products for preview
const mockProducts = [
  {
    id: "preview-1",
    name: "Sample Product",
    description: "This is a preview product",
    price: 199900,
    mrp: 299900,
    stock: 10,
    images: [{ url: "/placeholder-product.jpg", alt: "Product" }],
  },
]

type ViewportSize = "desktop" | "tablet" | "mobile"

const viewportSizes: Record<ViewportSize, { width: string; label: string; icon: any }> = {
  desktop: { width: "100%", label: "Desktop", icon: Monitor },
  tablet: { width: "768px", label: "Tablet", icon: Tablet },
  mobile: { width: "375px", label: "Mobile", icon: Smartphone },
}

export function LivePreview({ config, merchantSlug }: LivePreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop")
  const themeVars = themeToCssVars(config.theme)
  const viewportConfig = viewportSizes[viewport]

  return (
    <div className="h-full flex flex-col border rounded-lg bg-background overflow-hidden shadow-lg">
      {/* Preview Header */}
      <div className="border-b px-4 py-2 bg-muted flex items-center justify-between">
        <h3 className="text-sm font-semibold">Live Preview</h3>
        <div className="flex items-center gap-1">
          {Object.entries(viewportSizes).map(([key, { label, icon: Icon }]) => (
            <Button
              key={key}
              variant={viewport === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewport(key as ViewportSize)}
              className="h-7 px-2"
            >
              <Icon className="h-3 w-3 mr-1" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div
          className="mx-auto bg-white shadow-xl rounded-lg overflow-hidden transition-all"
          style={{
            width: viewportConfig.width,
            minHeight: "600px",
          }}
        >
          <div
            id="storefront-preview-root"
            className="min-h-screen flex flex-col"
            style={themeVars}
          >
            {config.theme.customCss && (
              <style dangerouslySetInnerHTML={{ __html: config.theme.customCss }} />
            )}
            <StorefrontHeader
              storeSlug={merchantSlug}
              storeName={config.branding.storeDisplayName || "Store Name"}
              logoUrl={config.branding.logo || null}
            />
            <main className="flex-1">
              <SectionRenderer
                sections={config.layout.sections}
                storeSlug={merchantSlug}
                products={mockProducts}
              />
            </main>
            <StorefrontFooter branding={config.branding} />
          </div>
        </div>
      </div>
    </div>
  )
}
