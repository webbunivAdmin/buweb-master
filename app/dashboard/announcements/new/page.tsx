"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { announcementService } from "@/lib/api-service"
import { toast } from "sonner"

export default function NewAnnouncementPage() {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Check if user has permission to create announcements
        if (user.role !== "admin" && user.role !== "faculty") {
          toast.error("Permission Denied", {
            description: "You don't have permission to create announcements.",
          })
          router.push("/dashboard/announcements")
          return
        }
      } catch (error) {
        console.error("Error checking permission:", error)
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [user, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Create a preview URL for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setFilePreview(event.target?.result as string)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        setFilePreview(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    try {
      // In a real implementation, you would upload the file to a server or cloud storage
      // and get back a URL. For this example, we'll simulate that.
      let fileUrl = null
      let fileType = null

      if (file) {
        // Simulate file upload and getting a URL
        fileUrl = URL.createObjectURL(file)
        fileType = file.type.split("/")[0] // e.g., 'image', 'application', etc.
      }

      const announcementData = {
        title,
        content,
        fileUrl,
        fileType,
        postedBy: user.id,
      }

      const data = await announcementService.createAnnouncement(announcementData)

      toast.success("Announcement created successfully")

      router.push(`/dashboard/announcements/${data._id}`)
    } catch (error) {
      console.error("Error creating announcement:", error)
      toast.error("Failed to create announcement", {
        description: "Please try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container flex h-full items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/announcements">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Announcement</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Create Announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter announcement content"
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Attachment (Optional)</Label>
              <div className="flex items-center gap-4">
                <Input id="file" type="file" onChange={handleFileChange} className="flex-1" />
              </div>
              {filePreview && (
                <div className="mt-2 rounded-md border p-2">
                  <img
                    src={filePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="max-h-40 rounded-md object-contain"
                  />
                </div>
              )}
              {file && !filePreview && (
                <div className="mt-2 flex items-center gap-2 rounded-md border p-2">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{file.name}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={submitting} className="ml-auto">
              {submitting ? "Creating..." : "Create Announcement"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

