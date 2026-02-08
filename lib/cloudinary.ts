/**
 * Upload a file to Cloudinary using unsigned upload with signature
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; publicId: string }> {
  // Step 1: Get signature from our API
  const signResponse = await fetch("/api/upload/cloudinary-sign", {
    method: "POST",
  })

  if (!signResponse.ok) {
    throw new Error("Failed to get Cloudinary signature")
  }

  const { timestamp, signature, apiKey, cloudName } = await signResponse.json()

  // Step 2: Upload to Cloudinary
  const formData = new FormData()
  formData.append("file", file)
  formData.append("api_key", apiKey)
  formData.append("timestamp", timestamp.toString())
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
          reject(new Error("Failed to parse Cloudinary response"))
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`))
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"))
    })

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)
    xhr.send(formData)
  })
}
