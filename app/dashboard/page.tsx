"use client"

import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Bell, Calendar, FileText, MessageSquare, Users, BookOpen, GraduationCap, User } from "lucide-react"
import { useEffect, useState } from "react"
import { announcementService, eventService, notificationService } from "@/lib/api-service"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

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
        const messagesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/recent`)
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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name || "Student"}</h1>
        <p className="text-muted-foreground">Here's an overview of your academic progress and recent activities</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-1/20 to-chart-1/5 rounded-lg"></div>
          <CardContent className="p-6 relative">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">Courses</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">6</span>
                <BookOpen className="h-4 w-4 text-chart-1" />
              </div>
              <span className="text-xs text-muted-foreground">Current semester</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-2/20 to-chart-2/5 rounded-lg"></div>
          <CardContent className="p-6 relative">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">GPA</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">3.8</span>
                <GraduationCap className="h-4 w-4 text-chart-2" />
              </div>
              <span className="text-xs text-muted-foreground">Current semester</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-3/20 to-chart-3/5 rounded-lg"></div>
          <CardContent className="p-6 relative">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">Assignments</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">4</span>
                <FileText className="h-4 w-4 text-chart-3" />
              </div>
              <span className="text-xs text-muted-foreground">Due this week</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-4/20 to-chart-4/5 rounded-lg"></div>
          <CardContent className="p-6 relative">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">Attendance</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">92%</span>
                <Users className="h-4 w-4 text-chart-4" />
              </div>
              <span className="text-xs text-muted-foreground">Current semester</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle>Course Progress</CardTitle>
          <CardDescription>Track your progress in current courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Introduction to Computer Science</span>
                <span className="text-xs text-muted-foreground">85%</span>
              </div>
              <Progress value={85} className="h-2" indicatorColor="bg-chart-1" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Advanced Mathematics</span>
                <span className="text-xs text-muted-foreground">72%</span>
              </div>
              <Progress value={72} className="h-2" indicatorColor="bg-chart-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Business Ethics</span>
                <span className="text-xs text-muted-foreground">93%</span>
              </div>
              <Progress value={93} className="h-2" indicatorColor="bg-chart-3" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Data Structures</span>
                <span className="text-xs text-muted-foreground">65%</span>
              </div>
              <Progress value={65} className="h-2" indicatorColor="bg-chart-4" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md">
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

        <Card className="shadow-md">
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
                  <div key={message._id} className="flex items-start gap-3">
                    <Avatar className="mt-0.5 h-8 w-8">
                      <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{message.senderName}</span>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(message.createdAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
                    </div>
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

        <Card className="shadow-md">
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
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                        <span className="text-xs font-medium">
                          {new Date(event.startDate).toLocaleDateString([], { month: "short" })}
                        </span>
                        <span className="text-sm font-bold">{new Date(event.startDate).getDate()}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{event.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.startDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
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
                  <User className="mb-2 h-5 w-5" />
                  <span>My Profile</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
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
                  let bgColor
                  switch (notification.type) {
                    case "message":
                      icon = <MessageSquare className="h-4 w-4 text-chart-2" />
                      bgColor = "bg-chart-2/10"
                      break
                    case "event":
                      icon = <Calendar className="h-4 w-4 text-chart-3" />
                      bgColor = "bg-chart-3/10"
                      break
                    case "announcement":
                      icon = <FileText className="h-4 w-4 text-chart-4" />
                      bgColor = "bg-chart-4/10"
                      break
                    default:
                      icon = <Bell className="h-4 w-4 text-chart-5" />
                      bgColor = "bg-chart-5/10"
                  }

                  return (
                    <div
                      key={notification._id}
                      className="flex items-center gap-4 rounded-lg border p-3 shadow-sm hover:bg-muted/50 transition-colors"
                    >
                      <div className={`rounded-full p-2 ${bgColor}`}>{icon}</div>
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
                <div className="flex items-center gap-4 rounded-lg border p-3 shadow-sm">
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

