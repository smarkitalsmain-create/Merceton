/**
 * Shared client-side image upload function
 * Uploads file to our API which handles Cloudinary upload server-side
 */

export type UploadKind = "logo" | "favicon" | "banner" | "product" | "generic"

export interface UploadImageResult {
  url: string
  publicId?: string
}

/**
 * Upload image file to server, which uploads to Cloudinary
 */
export async function uploadImage(
  file: File,
  kind: UploadKind
): Promise<UploadImageResult> {
  const form = new FormData()
  form.append("file", file)
  form.append("kind", kind)

  let response: Response
  try {
    response = await fetch("/api/uploads/image", {
      method: "POST",
      body: form,
      credentials: "include", // Include auth cookies
    })
  } catch (error) {
    // Network error - route doesn't exist or server is down
    console.error("Upload network error:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Failed to connect to server"
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
        errorMessage =
          response.statusText || `Upload failed with status ${response.status}`
      }
    }

    // Map status codes to user-friendly messages
    if (response.status === 400) {
      throw new Error(errorMessage)
    } else if (response.status === 401) {
      throw new Error("Unauthorized. Please sign in and try again.")
    } else if (response.status === 403) {
      throw new Error("Merchant not found. Please complete store setup.")
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
    }
  } catch (error) {
    throw new Error("Failed to parse server response")
  }
}
