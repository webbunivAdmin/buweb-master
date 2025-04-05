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
import FileUploadPreview from "@/components/file-upload-preview"
import RichTextEditor from "@/components/rich-text-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { marked } from "marked"

interface Announcement {
  _id: string
  title: string
  content: string
  createdAt: string
  postedBy: string
  fileUrl?: string
  fileType?: string
  fileName?: string
}

export default function EditAnnouncementPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [fileData, setFileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [previewTab, setPreviewTab] = useState("edit")
  const router = useRouter()

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!user) return

      setLoading(true)
      try {
        const data = await announcementService.getAnnouncementById(params.id)
        setAnnouncement(data)

        // Set form values
        setTitle(data.title)
        setContent(data.content)

        // If there's an existing file, set initial file data
        if (data.fileUrl) {
          setFileData({
            existingUrl: data.fileUrl,
            existingType: data.fileType,
            existingName: data.fileName,
          })
        }
      } catch (error) {
        console.error("Error fetching announcement:", error)
        toast.error("Failed to load announcement", {
          description: "Please try again.",
        })
        router.push("/dashboard/announcements")
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncement()
  }, [user, params.id, router])

  const handleFileUpload = (data: { file: File; preview: string | null; type: string }) => {
    setFileData({
      ...fileData,
      file: data.file,
      preview: data.preview,
      type: data.type,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !announcement) return

    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    try {
      const announcementData = {
        title,
        content,
        fileData: fileData, // Pass the file data to the service
      }

      await announcementService.updateAnnouncement(announcement._id, announcementData)

      toast.success("Announcement updated successfully")

      router.push(`/dashboard/announcements/${announcement._id}`)
    } catch (error) {
      console.error("Error updating announcement:", error)
      toast.error("Failed to update announcement", {
        description: "Please try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Convert markdown to HTML for preview
  const getHtmlContent = () => {
    try {
      return { __html: marked(content) }
    } catch (error) {
      return { __html: "<p>Error rendering preview</p>" }
    }
  }

  // Check if user has permission to edit
  const canEdit = user?.role === "Admin" || (announcement && user && announcement.postedBy === user.id)

  useEffect(() => {
    // Redirect if user doesn't have permission
    if (!loading && !canEdit) {
      toast.error("Permission Denied", {
        description: "You don't have permission to edit this announcement.",
      })
      router.push(`/dashboard/announcements/${params.id}`)
    }
  }, [loading, canEdit, router, params.id])

  if (loading) {
    return (
      <div className="container flex h-full items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!announcement) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-center text-muted-foreground">Announcement not found</p>
          <Button asChild>
            <Link href="/dashboard/announcements">Back to Announcements</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/announcements/${announcement._id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Announcement</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Update Announcement</CardTitle>
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
              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <TabsList className="mb-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Write your announcement content here..."
                    minHeight="300px"
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div
                    className="min-h-[300px] rounded-md border bg-card p-4 prose max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={getHtmlContent()}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Attachment (Optional)</Label>
              <FileUploadPreview
                onFileUpload={handleFileUpload}
                initialFileUrl={announcement.fileUrl}
                initialFileType={announcement.fileType}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/announcements/${announcement._id}`)}
              className="mr-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Announcement"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

