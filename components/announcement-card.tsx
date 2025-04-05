import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  ImageIcon,
  Video,
  FileAudioIcon as Audio,
  File,
  FileSpreadsheet,
  FileIcon as FilePresentation,
} from "lucide-react"
import Link from "next/link"

interface AnnouncementCardProps {
  announcement: {
    _id: string
    title: string
    content: string
    createdAt: string
    postedBy: string
    fileUrl?: string
    fileType?: string
    fileName?: string
  }
  compact?: boolean
}

export default function AnnouncementCard({ announcement, compact = false }: AnnouncementCardProps) {
  const { _id, title, content, createdAt, postedBy, fileUrl, fileType, fileName } = announcement

  // Format the date as "X time ago" (e.g., "2 hours ago")
  const formattedDate = formatDistanceToNow(new Date(createdAt), { addSuffix: true })

  // Get the appropriate icon based on file type
  const getFileIcon = () => {
    if (!fileType) return <File className="h-4 w-4" />

    switch (fileType.toLowerCase()) {
      case "image":
        return <ImageIcon className="h-4 w-4 text-purple-500" />
      case "video":
        return <Video className="h-4 w-4 text-red-500" />
      case "audio":
        return <Audio className="h-4 w-4 text-blue-500" />
      case "pdf":
        return <FileText className="h-4 w-4 text-primary" />
      case "spreadsheet":
        return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
      case "presentation":
        return <FilePresentation className="h-4 w-4 text-orange-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  // Get a preview image if the file is an image
  const getImagePreview = () => {
    if (fileType === "image" && fileUrl) {
      return (
        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-md border">
          <img
            src={fileUrl || "/placeholder.svg"}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )
    }
    return null
  }

  return (
    <Link href={`/dashboard/announcements/${_id}`} className="block h-full">
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-md hover:bg-muted/50">
        <CardContent className={compact ? "p-4" : "p-6"}>
          {!compact && getImagePreview()}

          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {fileUrl && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {getFileIcon()}
                  <span>{fileType || "File"}</span>
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{formattedDate}</span>
          </div>

          <h3 className={`mb-2 line-clamp-2 font-semibold ${compact ? "text-base" : "text-xl"}`}>{title}</h3>

          <p className={`line-clamp-${compact ? "2" : "3"} text-muted-foreground`}>{content}</p>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t bg-muted/30 px-6 py-3">
          <span className="text-sm">Posted by: {postedBy}</span>
          <Button variant="ghost" size="sm" className="font-medium text-primary">
            Read more
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}

