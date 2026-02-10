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
    throw new Error(`Sign request failed: ${String(error)}`)
  }

  if (!signResponse.ok) {
    let text = ""
    try {
      text = await signResponse.text()
    } catch {
      text = "<non-text response>"
    }
    console.error(
      "Cloudinary sign error response:",
      signResponse.status,
      text
    )
    throw new Error(`Sign failed (${signResponse.status}): ${text}`)
  }

  const { timestamp, signature, apiKey, cloudName, folder } =
    await signResponse.json()

  // Step 2: Upload to Cloudinary with signed parameters
  const formData = new FormData()
  formData.append("file", file)
  formData.append("api_key", apiKey)
  formData.append("timestamp", timestamp.toString())
  formData.append("folder", folder)
  formData.append("signature", signature)

  let uploadResponse: Response
  try {
    uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    )
  } catch (error) {
    console.error("Cloudinary upload network error:", error)
    throw new Error(`Cloudinary upload failed: ${String(error)}`)
  }

  if (!uploadResponse.ok) {
    let text = ""
    try {
      text = await uploadResponse.text()
    } catch {
      text = "<non-text response>"
    }
    console.error(
      "Cloudinary upload failed:",
      uploadResponse.status,
      text
    )
    throw new Error(
      `Cloudinary upload failed (${uploadResponse.status}): ${text}`
    )
  }

  try {
    const response = await uploadResponse.json()
    return {
      url: response.secure_url,
      publicId: response.public_id,
    }
  } catch (error) {
    console.error("Cloudinary response parse error:", error)
    throw new Error("Failed to parse Cloudinary response")
  }
}

