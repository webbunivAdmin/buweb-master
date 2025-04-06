"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/image-upload"
import {
  File,
  FileText,
  FileSpreadsheet,
  FileIcon as FilePresentation,
  Video,
  FileAudioIcon as Audio,
  X,
  UploadIcon,
} from "lucide-react"
import { getFileType } from "@/lib/upload"
import { uploadFile } from "@/lib/upload"
import { toast } from "sonner"

interface FileUploadProps {
  onFileUpload: (fileData: { url: string; type: string; name: string }) => void
  initialFileUrl?: string
  initialFileType?: string
  initialFileName?: string
}

export default function FileUpload({
  onFileUpload,
  initialFileUrl,
  initialFileType,
  initialFileName,
}: FileUploadProps) {
  const [fileUrl, setFileUrl] = useState<string | undefined>(initialFileUrl)
  const [fileType, setFileType] = useState<string | undefined>(initialFileType)
  const [fileName, setFileName] = useState<string | undefined>(initialFileName)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    // If we have initial values, notify parent component
    if (initialFileUrl && initialFileType) {
      onFileUpload({
        url: initialFileUrl,
        type: initialFileType,
        name: initialFileName || "file",
      })
    }
  }, [initialFileUrl, initialFileType, initialFileName, onFileUpload])

  const handleImageUpload = (url: string) => {
    if (selectedFile) {
      setFileUrl(url)
      setFileType("image")
      setFileName(selectedFile.name)

      onFileUpload({
        url,
        type: "image",
        name: selectedFile.name,
      })
    }
  }

  const handleImageError = (error: Error) => {
    toast.error("Failed to upload image", {
      description: error.message,
    })
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleOtherFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setSelectedFile(file)

    try {
      setIsUploading(true)
      const type = getFileType(file)
      const url = await uploadFile(file)

      setFileUrl(url)
      setFileType(type)
      setFileName(file.name)

      onFileUpload({
        url,
        type,
        name: file.name,
      })

      toast.success("File uploaded successfully")
    } catch (error) {
      toast.error("Failed to upload file", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setFileUrl(undefined)
    setFileType(undefined)
    setFileName(undefined)
    setSelectedFile(null)

    onFileUpload({
      url: "",
      type: "",
      name: "",
    })
  }

  // Render file icon based on type
  const renderFileIcon = () => {
    if (!fileType) return null

    switch (fileType) {
      case "document":
        return <FileText className="h-6 w-6 text-primary" />
      case "pdf":
        return <FileText className="h-6 w-6 text-red-500" />
      case "spreadsheet":
        return <FileSpreadsheet className="h-6 w-6 text-emerald-500" />
      case "presentation":
        return <FilePresentation className="h-6 w-6 text-orange-500" />
      case "video":
        return <Video className="h-6 w-6 text-red-500" />
      case "audio":
        return <Audio className="h-6 w-6 text-blue-500" />
      default:
        return <File className="h-6 w-6 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Image upload section */}
      <div className="space-y-2">
        <Label>Image</Label>
        <ImageUpload
          value={fileType === "image" ? fileUrl : undefined}
          onChange={handleImageUpload}
          onError={handleImageError}
          onFileSelect={handleFileSelect}
        />
      </div>

      {/* Other file upload section */}
      <div className="space-y-2">
        <Label>Other File Types (PDF, Documents, etc.)</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("file-upload")?.click()}
            disabled={isUploading}
            className="flex-1"
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Select File"}
          </Button>

          <input
            id="file-upload"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.mp3,.mp4,.zip"
            onChange={handleOtherFileUpload}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      </div>

      {/* File preview section */}
      {fileUrl && fileType && fileType !== "image" && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {renderFileIcon()}
                <div>
                  <p className="font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground capitalize">{fileType} File</p>
                </div>
              </div>

              <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

