"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { announcementService } from "@/lib/api-service"
import { toast } from "sonner"
import FileUpload from "@/components/file-upload"
import RichTextEditor from "@/components/rich-text-editor"

export default function NewAnnouncementPage() {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [fileData, setFileData] = useState<{ url: string; type: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Check if user has permission to create announcements
        if (user.role !== "Admin" && user.role !== "Faculty") {
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

  const handleFileUpload = (data: { url: string; type: string; name: string }) => {
    setFileData(data.url ? data : null)
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
      const announcementData = {
        title,
        content,
        postedBy: user.id,
        fileUrl: fileData?.url,
        fileType: fileData?.type,
        fileName: fileData?.name,
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
          <CardContent className="space-y-6">
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
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your announcement content here... Use markdown for formatting."
                minHeight="400px"
              />
            </div>

            <div className="space-y-2">
              <Label>Attachment</Label>
              <FileUpload onFileUpload={handleFileUpload} />
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

