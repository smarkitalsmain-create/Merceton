/**
 * Shared client-side image upload utility
 * Handles validation, upload, and error reporting
 */

export interface UploadImageOptions {
  /** Maximum file size in bytes */
  maxSizeBytes?: number
  /** Allowed MIME types */
  allowedTypes?: string[]
  /** Upload category for folder organization */
  category?: "logo" | "favicon" | "banner" | "product" | "og" | "document"
}

export interface UploadImageResult {
  url: string
  publicId?: string
  width?: number
  height?: number
  bytes?: number
  mime?: string
}

/**
 * Validate file before upload
 */
function validateFile(file: File, options: UploadImageOptions): { valid: boolean; error?: string } {
  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${options.allowedTypes.join(", ")}`,
    }
  }

  // Check file size
  if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
    const maxSizeMB = (options.maxSizeBytes / (1024 * 1024)).toFixed(1)
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `File too large: ${fileSizeMB}MB. Maximum size: ${maxSizeMB}MB`,
    }
  }

  return { valid: true }
}

/**
 * Upload image to server
 */
export async function uploadImage(
  file: File,
  options: UploadImageOptions = {}
): Promise<UploadImageResult> {
  // Set defaults based on category
  const category = options.category || "product"
  const defaults = {
    logo: {
      maxSizeBytes: 2 * 1024 * 1024, // 2MB
      allowedTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
    },
    favicon: {
      maxSizeBytes: 500 * 1024, // 500KB
      allowedTypes: ["image/png", "image/x-icon", "image/svg+xml"],
    },
    banner: {
      maxSizeBytes: 5 * 1024 * 1024, // 5MB
      allowedTypes: ["image/png", "image/jpeg", "image/webp"],
    },
    product: {
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      allowedTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    },
    og: {
      maxSizeBytes: 5 * 1024 * 1024, // 5MB
      allowedTypes: ["image/png", "image/jpeg", "image/webp"],
    },
    document: {
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      allowedTypes: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
    },
  }

  const categoryDefaults = defaults[category] || defaults.product
  const maxSizeBytes = options.maxSizeBytes || categoryDefaults.maxSizeBytes
  const allowedTypes = options.allowedTypes || categoryDefaults.allowedTypes

  // Validate file
  const validation = validateFile(file, { maxSizeBytes, allowedTypes })
  if (!validation.valid) {
    throw new Error(validation.error || "File validation failed")
  }

  // Upload to server
  const formData = new FormData()
  formData.append("file", file)
  if (category) {
    formData.append("category", category)
  }

  let response: Response
  try {
    response = await fetch("/api/uploads/image", {
      method: "POST",
      body: formData,
      // Ensure credentials are included for auth
      credentials: "include",
    })
  } catch (error) {
    // Network error - this typically means the route doesn't exist or crashed
    console.error("Upload network error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to connect to server"
    throw new Error(`Network error: ${errorMessage}. Check if /api/uploads/image route is accessible.`)
  }

  // Handle response
  if (!response.ok) {
    let errorMessage = "Upload failed"
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      // Try to get text response
      try {
        const errorText = await response.text()
        errorMessage = errorText || errorMessage
      } catch {
        // Fallback to status text
        errorMessage = response.statusText || `Upload failed with status ${response.status}`
      }
    }

    // Map status codes to user-friendly messages
    if (response.status === 400) {
      throw new Error(errorMessage)
    } else if (response.status === 401) {
      throw new Error("Unauthorized. Please sign in and try again.")
    } else if (response.status === 413) {
      throw new Error("File too large. Please choose a smaller file.")
    } else if (response.status === 500) {
      throw new Error(errorMessage || "Server error. Please try again later.")
    } else {
      throw new Error(`${errorMessage} (Status: ${response.status})`)
    }
  }

  // Parse successful response
  try {
    const data = await response.json()
    return {
      url: data.url,
      publicId: data.publicId,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
      mime: data.mime || file.type,
    }
  } catch (error) {
    throw new Error("Failed to parse server response")
  }
}
