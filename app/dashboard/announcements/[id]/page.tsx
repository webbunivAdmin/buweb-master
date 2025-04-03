"use client"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, FileText, Trash } from "lucide-react"
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

interface Announcement {
  _id: string
  title: string
  content: string
  createdAt: string
  postedBy: string
  fileUrl?: string
  fileType?: string
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

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

  const canEditDelete = user?.role === "admin" || (announcement && user && announcement.postedBy === user.id)

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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/announcements">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Announcement</h1>
        </div>
        {canEditDelete && (
          <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {announcement.fileUrl && <Badge variant="outline">{announcement.fileType || "File"}</Badge>}
            <span className="text-sm text-muted-foreground">{formatDate(announcement.createdAt)}</span>
          </div>
          <CardTitle className="text-2xl">{announcement.title}</CardTitle>
          <div className="text-sm text-muted-foreground">Posted by: {announcement.postedBy}</div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none dark:prose-invert">
            {announcement.content.split("\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {announcement.fileUrl && (
            <div className="mt-6 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium">Attachment</p>
                  <a
                    href={announcement.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View or Download {announcement.fileType} File
                  </a>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

