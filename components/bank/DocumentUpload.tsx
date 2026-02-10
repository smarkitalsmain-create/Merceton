"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, X, FileText } from "lucide-react"

interface DocumentUploadProps {
  value?: string | null
  onChange: (url: string) => void
  maxSizeMB?: number
  className?: string
  disabled?: boolean
  accept?: string
}

export function DocumentUpload({
  value,
  onChange,
  maxSizeMB = 5,
  className = "",
  disabled = false,
  accept = "application/pdf,image/jpeg,image/jpg,image/png",
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ]
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a PDF, JPG, or PNG file")
      return
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      alert(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    // Upload to server
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      const result = await new Promise<{ url: string }>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100
            setUploadProgress(progress)
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } catch (error) {
              reject(new Error("Failed to parse response"))
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText)
              reject(new Error(error.error || "Upload failed"))
            } catch {
              reject(new Error(`Upload failed: ${xhr.statusText}`))
            }
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"))
        })

        xhr.open("POST", "/api/uploads/document")
        xhr.send(formData)
      })

      onChange(result.url)
    } catch (error: any) {
      console.error("Upload error:", error)
      alert(error.message || "Failed to upload document")
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = () => {
    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {value ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                Document uploaded
              </p>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline truncate block"
              >
                View document
              </a>
            </div>
            {uploading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">{Math.round(uploadProgress)}%</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClick}
              disabled={disabled || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Replace
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={disabled || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading... {Math.round(uploadProgress)}%
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        Max size: {maxSizeMB}MB. Supports: PDF, JPG, PNG
      </p>
    </div>
  )
}
