"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { productFormSchema, type ProductFormData } from "@/lib/validations/product"
import { createProduct, updateProduct } from "@/app/actions/products"
import { useToast } from "@/hooks/use-toast"
import { paiseToInr } from "@/lib/utils/currency"
import { Plus, X, Loader2 } from "lucide-react"
import { uploadToCloudinary } from "@/lib/cloudinary"

interface ProductFormProps {
  product?: {
    id: string
    name: string
    description: string | null
    price: number
    mrp: number | null
    sku: string | null
    stock: number
    images: Array<{ url: string; alt: string | null }>
  }
}

interface ImageState {
  url: string
  alt?: string
  sortOrder: number
  uploading?: boolean
  uploadProgress?: number
  uploadId?: string // Unique ID for tracking uploads
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<ImageState[]>(
    product?.images.map((img, idx) => ({
      url: img.url,
      alt: img.alt || "",
      sortOrder: idx,
    })) || []
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description || "",
          price: paiseToInr(product.price),
          mrp: product.mrp ? paiseToInr(product.mrp) : undefined,
          sku: product.sku || "",
          stock: product.stock,
        }
      : undefined,
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const filesArray = Array.from(files)
    const startIndex = images.length

    // Add all placeholders first
    const placeholders: ImageState[] = filesArray.map((file, idx) => ({
      url: "",
      alt: file.name,
      sortOrder: startIndex + idx,
      uploading: true,
      uploadProgress: 0,
      uploadId: `${Date.now()}-${idx}`,
    }))

    setImages((prev) => [...prev, ...placeholders])

    // Upload each file
    filesArray.forEach((file, fileIndex) => {
      const uploadId = placeholders[fileIndex].uploadId!
      const targetIndex = startIndex + fileIndex

      uploadToCloudinary(file, (progress) => {
        setImages((prev) => {
          const updated = [...prev]
          const img = updated.find((i) => i.uploadId === uploadId)
          if (img) {
            img.uploadProgress = progress
          }
          return [...updated]
        })
      })
        .then((result) => {
          setImages((prev) => {
            const updated = [...prev]
            const img = updated.find((i) => i.uploadId === uploadId)
            if (img) {
              img.url = result.url
              img.uploading = false
              delete img.uploadId
            }
            return [...updated]
          })
        })
        .catch((error) => {
          console.error("Upload error:", error)
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          })
          // Remove failed upload
          setImages((prev) => prev.filter((img) => img.uploadId !== uploadId))
        })
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index).map((img, idx) => ({
      ...img,
      sortOrder: idx,
    })))
  }

  const updateImageAlt = (index: number, alt: string) => {
    const updated = [...images]
    updated[index] = { ...updated[index], alt }
    setImages(updated)
  }

  const onSubmit = (data: ProductFormData) => {
    // Check if any images are still uploading
    const uploadingImages = images.filter((img) => img.uploading)
    if (uploadingImages.length > 0) {
      toast({
        title: "Please wait",
        description: "Some images are still uploading. Please wait for them to complete.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const formData = {
        ...data,
        images: images
          .filter((img) => img.url.trim() !== "")
          .map((img) => ({
            url: img.url,
            alt: img.alt || undefined,
          })),
      }

      const result = product
        ? await updateProduct({ ...formData, id: product.id })
        : await createProduct({ ...formData, merchantId: "" }) // Will be set in action

      if (result.success) {
        toast({
          title: product ? "Product updated" : "Product created",
          description: `${data.name} has been ${product ? "updated" : "created"} successfully.`,
        })
        router.push("/dashboard/products")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save product",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Product name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter product name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter product description"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & Inventory</CardTitle>
          <CardDescription>Set price, MRP, SKU, and stock</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Price (INR) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                {...register("price", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mrp">MRP (INR)</Label>
              <Input
                id="mrp"
                type="number"
                step="0.01"
                min="0.01"
                {...register("mrp", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.mrp && (
                <p className="text-sm text-destructive">{errors.mrp.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                {...register("sku")}
                placeholder="Product SKU"
              />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                {...register("stock", { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-sm text-destructive">{errors.stock.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
          <CardDescription>Upload product images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* File Input */}
            <div>
              <Label htmlFor="image-upload">Upload Images</Label>
              <Input
                id="image-upload"
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Select one or more images to upload
              </p>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="relative group border rounded-lg overflow-hidden aspect-square bg-muted"
                  >
                    {image.uploading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">
                          {image.uploadProgress
                            ? `${Math.round(image.uploadProgress)}%`
                            : "Uploading..."}
                        </p>
                      </div>
                    ) : image.url ? (
                      <>
                        <img
                          src={image.url}
                          alt={image.alt || `Product image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeImage(index)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {/* Alt Text Inputs */}
            {images.length > 0 && (
              <div className="space-y-2">
                <Label>Image Alt Text (Optional)</Label>
                {images
                  .filter((img) => !img.uploading && img.url)
                  .map((image, index) => {
                    const actualIndex = images.findIndex((img) => img === image)
                    return (
                      <div key={actualIndex} className="flex gap-2">
                        <Input
                          placeholder={`Alt text for image ${actualIndex + 1}`}
                          value={image.alt || ""}
                          onChange={(e) => updateImageAlt(actualIndex, e.target.value)}
                        />
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? product
              ? "Updating..."
              : "Creating..."
            : product
            ? "Update Product"
            : "Create Product"}
        </Button>
      </div>
    </form>
  )
}
