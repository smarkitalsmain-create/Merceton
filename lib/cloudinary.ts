/**
 * Upload a file to Cloudinary using a signed upload (no unsigned presets).
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; publicId: string }> {
  // Step 1: Get signature from our API
  let signResponse: Response
  try {
    signResponse = await fetch("/api/cloudinary/sign", {
      method: "POST",
    })
  } catch (error) {
    console.error("Cloudinary sign request failed:", error)
    throw new Error("Failed to contact Cloudinary sign endpoint")
  }

  if (!signResponse.ok) {
    let message = "Failed to get Cloudinary signature"
    try {
      const data = await signResponse.json()
      if (data?.error) {
        message = data.error
      }
    } catch {
      // ignore JSON parse errors
    }
    console.error("Cloudinary sign error response:", signResponse.status, message)
    throw new Error(message)
  }

  const { timestamp, signature, apiKey, cloudName, folder } = await signResponse.json()

  // Step 2: Upload to Cloudinary with signed parameters
  const formData = new FormData()
  formData.append("file", file)
  formData.append("api_key", apiKey)
  formData.append("timestamp", timestamp.toString())
  formData.append("folder", folder)
  formData.append("signature", signature)

  const xhr = new XMLHttpRequest()

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100
        onProgress(progress)
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve({
            url: response.secure_url,
            publicId: response.public_id,
          })
        } catch (error) {
          console.error("Cloudinary response parse error:", error)
          reject(new Error("Failed to parse Cloudinary response"))
        }
      } else {
        console.error("Cloudinary upload failed:", xhr.status, xhr.responseText)
        reject(new Error(`Upload failed: ${xhr.statusText || xhr.status}`))
      }
    })

    xhr.addEventListener("error", () => {
      console.error("Cloudinary upload network error")
      reject(new Error("Upload failed"))
    })

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)
    xhr.send(formData)
  })
}

