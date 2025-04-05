/**
 * Utility functions for file handling
 */

// Get file type category (image, document, video, audio, etc.)
export function getFileCategory(file: File | null): string | null {
    if (!file) return null
  
    const type = file.type.split("/")[0]
  
    if (type === "image") return "image"
    if (type === "video") return "video"
    if (type === "audio") return "audio"
    if (type === "application" || type === "text") {
      // Check for common document types
      if (file.name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i)) {
        return "document"
      }
    }
  
    return "other"
  }
  
  // Get file icon based on file extension
  export function getFileIcon(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase()
  
    switch (extension) {
      case "pdf":
        return "file-text"
      case "doc":
      case "docx":
        return "file-text"
      case "xls":
      case "xlsx":
        return "file-spreadsheet"
      case "ppt":
      case "pptx":
        return "file-presentation"
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return "image"
      case "mp4":
      case "webm":
      case "mov":
        return "video"
      case "mp3":
      case "wav":
      case "ogg":
        return "audio"
      case "zip":
      case "rar":
      case "7z":
        return "archive"
      default:
        return "file"
    }
  }
  
  // Format file size
  export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
  
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
  
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
  
  // Check if file is too large (max 10MB by default)
  export function isFileTooLarge(file: File, maxSizeMB = 10): boolean {
    return file.size > maxSizeMB * 1024 * 1024
  }
  
  // Create a preview URL for a file
  export function createFilePreview(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        resolve(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    })
  }
  
  