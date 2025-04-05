"use client"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, Trash, Download, Eye, Share2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { announcementService } from "@/lib/api-service"
import { toast } from "sonner"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { marked } from "marked"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

export default function AnnouncementPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!user) return

      setLoading(true)
      try {
        const data = await announcementService.getAnnouncementById(params.id)
        setAnnouncement(data)
      } catch (error) {
        console.error("Error fetching announcement:", error)
        toast.error("Failed to load announcement", {
          description: "Please try again.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncement()
  }, [user, params.id])

  const handleDelete = async () => {
    if (!user || !announcement) return

    try {
      await announcementService.deleteAnnouncement(announcement._id)

      toast.success("Announcement deleted successfully")

      router.push("/dashboard/announcements")
    } catch (error) {
      console.error("Error deleting announcement:", error)
      toast.error("Failed to delete announcement", {
        description: "Please try again.",
      })
    }
  }

  const handleShare = () => {
    if (typeof navigator.share !== "undefined") {
      navigator
        .share({
          title: announcement?.title || "Announcement",
          text: `Check out this announcement: ${announcement?.title}`,
          url: window.location.href,
        })
        .catch((err) => {
          console.error("Error sharing:", err)
          copyToClipboard()
        })
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied to clipboard")
  }

  const canEditDelete = user?.role === "Admin" || (announcement && user && announcement.postedBy === user.id)

  // Convert markdown to HTML
  const getHtmlContent = () => {
    if (!announcement) return { __html: "" }
    try {
      return { __html: marked(announcement.content) }
    } catch (error) {
      return { __html: "<p>Error rendering content</p>" }
    }
  }

  // Get file icon and name for display
  const getFileInfo = () => {
    if (!announcement?.fileUrl) return null

    let icon = "file"
    let label = "File"

    if (announcement.fileType) {
      switch (announcement.fileType.toLowerCase()) {
        case "image":
          icon = "image"
          label = "Image"
          break
        case "video":
          icon = "video"
          label = "Video"
          break
        case "audio":
          icon = "audio"
          label = "Audio"
          break
        case "document":
        case "pdf":
          icon = "file-text"
          label = "Document"
          break
        default:
          icon = "file"
          label = announcement.fileType
      }
    }

    return { icon, label }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" disabled>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-8 w-40" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
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

  const fileInfo = getFileInfo()
  const formattedDate = format(new Date(announcement.createdAt), "EEEE, MMMM d, yyyy")

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/announcements">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Announcement</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>

          {canEditDelete && (
            <>
              <Button variant="outline" size="icon" asChild>
                <Link href={`/dashboard/announcements/edit/${announcement._id}`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Trash className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the announcement.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {announcement.fileUrl && fileInfo && (
              <Badge variant="outline" className="capitalize">
                {fileInfo.label}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">{formattedDate}</span>
          </div>
          <CardTitle className="text-2xl">{announcement.title}</CardTitle>
          <div className="text-sm text-muted-foreground">Posted by: {announcement.postedBy}</div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Render image preview if it's an image */}
          {announcement.fileUrl && announcement.fileType === "image" && (
            <div className="overflow-hidden rounded-lg border">
              <img
                src={announcement.fileUrl || "/placeholder.svg"}
                alt={announcement.title}
                className="w-full object-contain"
              />
            </div>
          )}

          {/* Render content as HTML from markdown */}
          <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={getHtmlContent()} />

          {/* File attachment section */}
          {announcement.fileUrl && (
            <div className="mt-6 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {fileInfo?.icon === "image" && <Eye className="h-6 w-6 text-purple-500" />}
                  {fileInfo?.icon === "video" && <Eye className="h-6 w-6 text-red-500" />}
                  {fileInfo?.icon === "file-text" && <Eye className="h-6 w-6 text-primary" />}
                  {fileInfo?.icon === "file" && <Eye className="h-6 w-6 text-gray-500" />}

                  <div>
                    <p className="font-medium">Attachment</p>
                    <p className="text-sm text-muted-foreground">
                      {announcement.fileName || `${fileInfo?.label} File`}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a
                        href={announcement.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex cursor-pointer items-center"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View in Browser
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={announcement.fileUrl}
                        download={announcement.fileName || "attachment"}
                        className="flex cursor-pointer items-center"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download File
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

