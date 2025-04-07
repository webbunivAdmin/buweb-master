"use client"

import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Bell, Calendar, FileText, MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"
import { announcementService, eventService, notificationService } from "@/lib/api-service"
import { toast } from "sonner"

interface Announcement {
  _id: string
  title: string
  content: string
  createdAt: string
  postedBy: string
}

interface Message {
  _id: string
  sender: string
  senderName: string
  content: string
  createdAt: string
}

interface Event {
  _id: string
  title: string
  description: string
  startDate: string
  endDate: string
}

interface Notification {
  _id: string
  message: string
  type: string
  createdAt: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        // Fetch recent announcements
        const announcementsData = await announcementService.getAllAnnouncements()
        setAnnouncements(announcementsData.slice(0, 3))

        // Fetch recent messages - this endpoint isn't explicitly shown in your API
        const messagesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${user.id}`)
        if (!messagesResponse.ok) throw new Error("Failed to fetch messages")
        const messagesData = await messagesResponse.json()
        setMessages(messagesData.slice(0, 3))

        // Fetch upcoming events
        const eventsData = await eventService.getAllEvents()
        const today = new Date().toISOString()
        const upcomingEvents = eventsData
          .filter((event: any) => event.endDate >= today)
          .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .slice(0, 3)
        setEvents(upcomingEvents)

        // Fetch recent notifications
        const notificationsData = await notificationService.getNotifications(user.id)
        setNotifications(notificationsData.slice(0, 3))
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast.error("Failed to load some dashboard data")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInSecs = Math.floor(diffInMs / 1000)
    const diffInMins = Math.floor(diffInSecs / 60)
    const diffInHours = Math.floor(diffInMins / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInSecs < 60) {
      return "Just now"
    } else if (diffInMins < 60) {
      return `${diffInMins} ${diffInMins === 1 ? "minute" : "minutes"} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`
    } else {
      return formatDate(dateString)
    }
  }

  return (
    <div className="container py-6">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Recent university announcements</CardDescription>
            </div>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{announcement.title}</h3>
                      <span className="text-xs text-muted-foreground">{formatDate(announcement.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/announcements">View all announcements</Link>
                </Button>
              </div>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center gap-2">
                <p className="text-center text-muted-foreground">No announcements yet</p>
                <Button asChild variant="outline">
                  <Link href="/dashboard/announcements">View announcements</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Messages</CardTitle>
              <CardDescription>Recent messages</CardDescription>
            </div>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{message.senderName}</h3>
                      <span className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/messages">View all messages</Link>
                </Button>
              </div>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center gap-2">
                <p className="text-center text-muted-foreground">No messages yet</p>
                <Button asChild variant="outline">
                  <Link href="/dashboard/messages">View messages</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events and deadlines</CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{event.title}</h3>
                      <span className="text-xs text-muted-foreground">{formatDate(event.startDate)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/calendar">View calendar</Link>
                </Button>
              </div>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center gap-2">
                <p className="text-center text-muted-foreground">No upcoming events</p>
                <Button asChild variant="outline">
                  <Link href="/dashboard/calendar">View calendar</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/dashboard/messages/new">
                  <MessageSquare className="mb-2 h-5 w-5" />
                  <span>New Message</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/dashboard/calendar/new">
                  <Calendar className="mb-2 h-5 w-5" />
                  <span>Add Event</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/dashboard/notifications">
                  <Bell className="mb-2 h-5 w-5" />
                  <span>Notifications</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/dashboard/profile">
                  <FileText className="mb-2 h-5 w-5" />
                  <span>My Profile</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => {
                  let icon
                  switch (notification.type) {
                    case "message":
                      icon = <MessageSquare className="h-4 w-4 text-primary" />
                      break
                    case "event":
                      icon = <Calendar className="h-4 w-4 text-primary" />
                      break
                    case "announcement":
                      icon = <FileText className="h-4 w-4 text-primary" />
                      break
                    default:
                      icon = <Bell className="h-4 w-4 text-primary" />
                  }

                  return (
                    <div key={notification._id} className="flex items-center gap-4 rounded-lg border p-3">
                      <div className="rounded-full bg-primary/10 p-2">{icon}</div>
                      <div className="flex-1">
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs text-muted-foreground">Check back later</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

