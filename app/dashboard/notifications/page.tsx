"use client"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Calendar, FileText, MessageSquare } from "lucide-react"
import { notificationService } from "@/lib/api-service"
import { toast } from "sonner"
import Link from "next/link"

interface Notification {
  _id: string
  user: string
  message: string
  type: string
  event?: string
  status: string
  createdAt: string
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return

      setLoading(true)
      try {
        const data = await notificationService.getNotifications(user.id)
        setNotifications(data)
      } catch (error) {
        console.error("Error fetching notifications:", error)
        toast.error("Failed to load notifications", {
          description: "Please try again.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [user])

  const formatDate = (dateString: string) => {
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
      return date.toLocaleDateString()
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId ? { ...notification, status: "sent" } : notification,
        ),
      )

      toast.success("Notification marked as read")
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-5 w-5 text-primary" />
      case "event":
        return <Calendar className="h-5 w-5 text-primary" />
      case "announcement":
        return <FileText className="h-5 w-5 text-primary" />
      default:
        return <Bell className="h-5 w-5 text-primary" />
    }
  }

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case "message":
        return `/dashboard/messages/${notification.event}`
      case "event":
        return `/dashboard/calendar/${notification.event}`
      case "announcement":
        return `/dashboard/announcements/${notification.event}`
      default:
        return `/dashboard`
    }
  }

  return (
    <div className="container py-6">
      <h1 className="mb-6 text-3xl font-bold">Notifications</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                    notification.status === "new" ? "bg-muted/50" : ""
                  }`}
                >
                  <div className="rounded-full bg-primary/10 p-2">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <Link href={getNotificationLink(notification)} className="flex-1">
                        <p className="font-medium">{notification.message}</p>
                      </Link>
                      <span className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</span>
                    </div>
                    {notification.status === "new" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleMarkAsRead(notification._id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
              <Bell className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-medium">No notifications</h3>
                <p className="text-muted-foreground">You don't have any notifications yet</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

