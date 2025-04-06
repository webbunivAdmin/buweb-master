import { storage } from "@/lib/firebase"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { v4 as uuidv4 } from "uuid"

/**
 * Uploads a file to Firebase Storage and returns the download URL
 */
export async function uploadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a unique file name to prevent overwriting
      const fileName = `${uuidv4()}-${file.name}`
      const storageRef = ref(storage, `announcements/${fileName}`)

      // Start upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // You can track progress here if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log(`Upload progress: ${progress.toFixed(0)}%`)
        },
        (error) => {
          console.error("Upload error:", error)
          reject(new Error("Failed to upload file. Please try again."))
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(downloadURL)
        },
      )
    } catch (error) {
      console.error("Upload error:", error)
      reject(new Error("Failed to upload file. Please try again."))
    }
  })
}

/**
 * Determines the file type from a file object
 */
export function getFileType(file: File): string {
  const type = file.type.split("/")[0]

  if (type === "image") return "image"
  if (type === "video") return "video"
  if (type === "audio") return "audio"
  if (type === "application" || type === "text") {
    // Check for common document types
    if (file.name.match(/\.(pdf)$/i)) return "pdf"
    if (file.name.match(/\.(doc|docx)$/i)) return "document"
    if (file.name.match(/\.(xls|xlsx)$/i)) return "spreadsheet"
    if (file.name.match(/\.(ppt|pptx)$/i)) return "presentation"
    if (file.name.match(/\.(txt|rtf)$/i)) return "text"
  }

  return "other"
}

/**
 * Format file size in a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

