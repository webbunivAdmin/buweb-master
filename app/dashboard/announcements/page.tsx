"use client"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { FileText, Plus, Search } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!user) return

      setLoading(true)
      try {
        const data = await announcementService.getAllAnnouncements()
        setAnnouncements(data)
        setFilteredAnnouncements(data)
      } catch (error) {
        console.error("Error fetching announcements:", error)
        toast.error("Failed to load announcements", {
          description: "Please try again.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [user])

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = announcements.filter(
        (announcement) =>
          announcement.title.toLowerCase().includes(query) || announcement.content.toLowerCase().includes(query),
      )
      setFilteredAnnouncements(filtered)
    } else {
      setFilteredAnnouncements(announcements)
    }
  }, [searchQuery, announcements])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const canCreateAnnouncement = user?.role === "Admin" || user?.role === "Faculty"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">Stay updated with the latest university announcements and news</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {canCreateAnnouncement && (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/announcements/new">
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto">
          <TabsTrigger value="all" className="flex-1 sm:flex-none">
            All
          </TabsTrigger>
          <TabsTrigger value="files" className="flex-1 sm:flex-none">
            With Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AnnouncementsList announcements={filteredAnnouncements} loading={loading} formatDate={formatDate} />
        </TabsContent>

        <TabsContent value="files">
          <AnnouncementsList
            announcements={filteredAnnouncements.filter((a) => a.fileUrl)}
            loading={loading}
            formatDate={formatDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AnnouncementsList({
  announcements,
  loading,
  formatDate,
}: {
  announcements: Announcement[]
  loading: boolean
  formatDate: (date: string) => string
}) {
  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (announcements.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-medium">No announcements found</h3>
          <p className="text-muted-foreground">There are no announcements matching your criteria</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {announcements.map((announcement) => (
        <Link key={announcement._id} href={`/dashboard/announcements/${announcement._id}`} className="block">
          <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-md hover:bg-muted/50">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {announcement.fileUrl && <Badge variant="outline">{announcement.fileType || "File"}</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">{formatDate(announcement.createdAt)}</span>
                </div>
                <CardTitle className="mb-2 line-clamp-2">{announcement.title}</CardTitle>
                <p className="mb-4 line-clamp-3 text-muted-foreground">{announcement.content}</p>
              </div>
              <div className="flex items-center justify-between border-t bg-muted/30 px-6 py-3">
                <span className="text-sm">Posted by: {announcement.postedBy}</span>
                <Button variant="ghost" size="sm" className="font-medium text-primary">
                  Read more
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

