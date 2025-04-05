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

export default function NewAnnouncementPage() {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [fileData, setFileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [previewTab, setPreviewTab] = useState("edit")
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

  const handleFileUpload = (data: { file: File; preview: string | null; type: string }) => {
    setFileData(data)
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
        fileData: fileData, // Pass the file data to the service
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

  // Convert markdown to HTML for preview
  const getHtmlContent = () => {
    try {
      return { __html: marked(content) }
    } catch (error) {
      return { __html: "<p>Error rendering preview</p>" }
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
              <FileUploadPreview onFileUpload={handleFileUpload} />
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

