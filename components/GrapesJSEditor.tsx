"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Eye, Rocket } from "lucide-react"

interface GrapesJSEditorProps {
  merchantId: string
  merchantSlug: string
  initialData?: {
    builderJson?: any
    builderHtml?: string | null
    builderCss?: string | null
  }
}

export function GrapesJSEditor({
  merchantId,
  merchantSlug,
  initialData,
}: GrapesJSEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const grapesEditorRef = useRef<any>(null)
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!editorRef.current) return

    // Dynamically load GrapesJS
    const initEditor = async () => {
      if (!GrapesJS) {
        const grapesModule = await import("grapesjs")
        GrapesJS = grapesModule.default
      }

      if (!editorRef.current || !GrapesJS) return

      // Initialize GrapesJS editor
      const editor = GrapesJS.init({
      container: editorRef.current,
      height: "100vh",
      width: "100%",
      storageManager: false, // We'll handle storage ourselves
      plugins: [],
      pluginsOpts: {},
      canvas: {
        styles: [
          "https://cdn.jsdelivr.net/npm/grapesjs@0.21.7/dist/css/grapes.min.css",
        ],
      },
      blockManager: {
        appendTo: ".blocks-container",
      },
      styleManager: {
        sectors: [
          {
            name: "Dimension",
            open: false,
            buildProps: ["width", "min-height", "padding"],
            properties: [
              {
                type: "integer",
                name: "The width",
                property: "width",
                units: ["px", "%"],
                defaults: "auto",
                min: 0,
              },
            ],
          },
          {
            name: "Extra",
            open: false,
            buildProps: ["background-color", "box-shadow", "custom-prop"],
            properties: [
              {
                id: "custom-prop",
                name: "Custom Label",
                property: "font-size",
                type: "select",
                defaults: "32px",
                options: [
                  { value: "12px", name: "Tiny" },
                  { value: "18px", name: "Medium" },
                  { value: "32px", name: "Big" },
                ],
              },
            ],
          },
        ],
      },
    })

    grapesEditorRef.current = editor

    // Add custom blocks
    const blockManager = editor.BlockManager

    // Hero Section
    blockManager.add("hero", {
      label: "Hero",
      category: "Layout",
      content: {
        type: "hero",
        classes: ["hero-section"],
        components: [
          {
            type: "text",
            content: "<h1>Welcome to Our Store</h1><p>Discover amazing products</p>",
            classes: ["hero-content"],
          },
        ],
      },
    })

    // Text Block
    blockManager.add("text", {
      label: "Text",
      category: "Basic",
      content: {
        type: "text",
        content: "Insert your text here",
      },
    })

    // Image Block
    blockManager.add("image", {
      label: "Image",
      category: "Basic",
      content: {
        type: "image",
        attributes: {
          src: "https://via.placeholder.com/350x250/78c5d6/fff",
          alt: "Image",
        },
      },
    })

    // Button Block
    blockManager.add("button", {
      label: "Button",
      category: "Basic",
      content: {
        type: "link",
        content: "Click Me",
        attributes: {
          class: "btn btn-primary",
          style: "padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; display: inline-block;",
        },
      },
    })

    // 2-Column Section
    blockManager.add("two-column", {
      label: "2 Columns",
      category: "Layout",
      content: {
        type: "row",
        classes: ["row"],
        components: [
          {
            type: "column",
            classes: ["col-md-6"],
            components: [
              {
                type: "text",
                content: "Left Column",
              },
            ],
          },
          {
            type: "column",
            classes: ["col-md-6"],
            components: [
              {
                type: "text",
                content: "Right Column",
              },
            ],
          },
        ],
      },
    })

    // Product Grid Placeholder
    blockManager.add("product-grid", {
      label: "Product Grid",
      category: "Layout",
      content: {
        type: "product-grid",
        classes: ["product-grid"],
        components: [
          {
            type: "text",
            content: "<h2>Featured Products</h2>",
          },
          {
            type: "row",
            classes: ["row"],
            components: [
              {
                type: "column",
                classes: ["col-md-4"],
                components: [
                  {
                    type: "text",
                    content: "<div class='product-card'><h3>Product 1</h3><p>Description</p></div>",
                  },
                ],
              },
              {
                type: "column",
                classes: ["col-md-4"],
                components: [
                  {
                    type: "text",
                    content: "<div class='product-card'><h3>Product 2</h3><p>Description</p></div>",
                  },
                ],
              },
              {
                type: "column",
                classes: ["col-md-4"],
                components: [
                  {
                    type: "text",
                    content: "<div class='product-card'><h3>Product 3</h3><p>Description</p></div>",
                  },
                ],
              },
            ],
          },
        ],
      },
    })

      // Load existing content if available
      if (initialData?.builderJson) {
        try {
          editor.loadProjectData(initialData.builderJson)
        } catch (error) {
          console.error("Error loading project data:", error)
        }
      } else if (initialData?.builderHtml) {
        // Fallback to HTML/CSS if JSON not available
        editor.setComponents(initialData.builderHtml)
        if (initialData.builderCss) {
          editor.setStyle(initialData.builderCss)
        }
      }

      setIsLoading(false)
    }

    initEditor()

    // Cleanup function
    return () => {
      if (grapesEditorRef.current) {
        grapesEditorRef.current.destroy()
        grapesEditorRef.current = null
      }
    }
  }, [initialData])

  const handleSaveDraft = () => {
    if (!grapesEditorRef.current) return

    startTransition(async () => {
      try {
        const projectData = grapesEditorRef.current.getProjectData()
        const html = grapesEditorRef.current.getHtml()
        const css = grapesEditorRef.current.getCss()

        const response = await fetch("/api/storefront/save-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            builderJson: projectData,
            builderHtml: html,
            builderCss: css,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to save draft")
        }

        toast({
          title: "Draft saved",
          description: "Your storefront draft has been saved successfully.",
        })
        router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to save draft",
          variant: "destructive",
        })
      }
    })
  }

  const handlePublish = () => {
    if (!grapesEditorRef.current) return

    startTransition(async () => {
      try {
        const projectData = grapesEditorRef.current.getProjectData()
        const html = grapesEditorRef.current.getHtml()
        const css = grapesEditorRef.current.getCss()

        const response = await fetch("/api/storefront/publish-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            builderJson: projectData,
            builderHtml: html,
            builderCss: css,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to publish")
        }

        toast({
          title: "Published",
          description: "Your storefront has been published successfully.",
        })
        router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to publish",
          variant: "destructive",
        })
      }
    })
  }

  const handlePreview = () => {
    window.open(`/s/${merchantSlug}`, "_blank")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div>
          <h2 className="text-lg font-semibold">Storefront Builder</h2>
          <p className="text-sm text-muted-foreground">
            Drag and drop to design your storefront
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSaveDraft}
            disabled={isPending}
            variant="outline"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </>
            )}
          </Button>
          <Button onClick={handlePreview} variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handlePublish} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 relative">
        <div className="blocks-container" style={{ display: "none" }} />
        <div ref={editorRef} className="gjs-editor" />
      </div>

      {/* GrapesJS Styles */}
      <style jsx global>{`
        .gjs-editor {
          height: 100%;
        }
        .gjs-cv-canvas {
          top: 0;
          width: 100%;
          height: 100%;
        }
        .gjs-frame {
          height: 100%;
        }
      `}</style>
    </div>
  )
}
