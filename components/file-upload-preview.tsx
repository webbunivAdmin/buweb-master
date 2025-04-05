"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  File,
  FileText,
  FileSpreadsheet,
  FileIcon as FilePresentation,
  ImageIcon,
  Video,
  FileAudioIcon as Audio,
  Archive,
  X,
  UploadIcon,
} from "lucide-react"
import { getFileCategory, getFileIcon, formatFileSize, isFileTooLarge, createFilePreview } from "@/lib/file-utils"

interface FileUploadPreviewProps {
  onFileUpload: (fileData: { file: File; preview: string | null; type: string }) => void
  maxSizeMB?: number
  allowedTypes?: string[]
  initialFileUrl?: string
  initialFileType?: string
}

export default function FileUploadPreview({
  onFileUpload,
  maxSizeMB = 10,
  allowedTypes = [
    "image/*",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/*",
    "audio/*",
    "video/*",
  ],
  initialFileUrl,
  initialFileType,
}: FileUploadPreviewProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(initialFileUrl || null)
  const [fileCategory, setFileCategory] = useState<string | null>(initialFileType || null)
  const [error, setError] = useState<string | null>(null)
  const [hasExistingFile, setHasExistingFile] = useState(!!initialFileUrl)

  useEffect(() => {
    if (!file) {
      if (!initialFileUrl) {
        setPreview(null)
        setFileCategory(null)
      }
      return
    }

    const category = getFileCategory(file)
    setFileCategory(category)

    // Only create previews for images
    if (category === "image") {
      createFilePreview(file).then((previewUrl) => {
        setPreview(previewUrl)
      })
    } else {
      setPreview(null)
    }

    // Notify parent component about the file
    onFileUpload({
      file,
      preview: category === "image" ? preview : null,
      type: category || "other",
    })
  }, [file, preview, onFileUpload, initialFileUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setHasExistingFile(false)

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check file size
      if (isFileTooLarge(selectedFile, maxSizeMB)) {
        setError(`File is too large. Maximum size is ${maxSizeMB}MB.`)
        return
      }

      setFile(selectedFile)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setPreview(null)
    setFileCategory(null)
    setError(null)
    setHasExistingFile(false)

    // Notify parent component that file was removed
    onFileUpload({ file: null as unknown as File, preview: null, type: null as unknown as string })
  }

  // Render the appropriate icon based on file type
  const renderFileIcon = () => {
    if (!file && !hasExistingFile) return <UploadIcon className="h-8 w-8 text-muted-foreground" />

    const iconName = file ? getFileIcon(file.name) : fileCategory === "image" ? "image" : "file-text"

    switch (iconName) {
      case "file-text":
        return <FileText className="h-8 w-8 text-primary" />
      case "file-spreadsheet":
        return <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
      case "file-presentation":
        return <FilePresentation className="h-8 w-8 text-orange-500" />
      case "image":
        return <ImageIcon className="h-8 w-8 text-purple-500" />
      case "video":
        return <Video className="h-8 w-8 text-red-500" />
      case "audio":
        return <Audio className="h-8 w-8 text-blue-500" />
      case "archive":
        return <Archive className="h-8 w-8 text-amber-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("file-upload")?.click()}
            className="flex-1"
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            {file || hasExistingFile ? "Change File" : "Select File"}
          </Button>

          <input
            id="file-upload"
            type="file"
            accept={allowedTypes.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {error && <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">{error}</div>}
      </div>

      {(file || hasExistingFile) && (
        <div className="relative rounded-lg border bg-card p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">{renderFileIcon()}</div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">{file ? file.name : "Existing File"}</p>
                <Button type="button" variant="ghost" size="icon" onClick={handleRemove} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {file && <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>}
            </div>
          </div>

          {/* Show preview for images */}
          {preview && (fileCategory === "image" || initialFileType === "image") && (
            <div className="mt-4 overflow-hidden rounded-md border">
              <img src={preview || "/placeholder.svg"} alt="Preview" className="max-h-[300px] w-full object-contain" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

