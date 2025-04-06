"use client"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Calendar, Clock, Edit, MapPin, Trash, User } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
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
import { eventService } from "@/lib/event-service"

interface Event {
  _id: string
  title: string
  description: string
  startTime: string
  endTime: string
  location: string | null
  creatorId: string
  isGeneral: boolean
  type: string
  reminderTimes: number[]
}

export default function EventPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchEvent = async () => {
      if (!user) return

      setLoading(true)
      try {
        const data = await eventService.getEventById(params.id)
        setEvent(data)
      } catch (error) {
        console.error("Error fetching event:", error)
        toast.error("Failed to load event", {
          description: "Please try again later",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleDelete = async () => {
    if (!user || !event) return

    try {
      await eventService.deleteEvent(event._id)
      toast.success("Event deleted successfully")
      router.push("/dashboard/calendar")
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error("Failed to delete event", {
        description: "Please try again later",
      })
    }
  }

  const canEditDelete =
    user?.role === "Admin" || user?.role === "Faculty" || (event && user && event.creatorId === user.id)

  if (loading) {
    return (
      <div className="container flex h-full items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-center text-muted-foreground">Event not found</p>
          <Button asChild>
            <Link href="/dashboard/calendar">Back to Calendar</Link>
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
            <Link href="/dashboard/calendar">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Event Details</h1>
        </div>
        {canEditDelete && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/dashboard/calendar/edit/${event._id}`}>
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
                    This action cannot be undone. This will permanently delete the event.
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
            {event.isGeneral && <Badge>General Event</Badge>}
            {event.type && event.type !== "general" && (
              <Badge variant="outline" className="capitalize">
                {event.type}
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl">{event.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Date</div>
                <div className="text-muted-foreground">
                  {formatDate(event.startTime)}
                  {new Date(event.startTime).toDateString() !== new Date(event.endTime).toDateString() && (
                    <> to {formatDate(event.endTime)}</>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Time</div>
                <div className="text-muted-foreground">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </div>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-muted-foreground">{event.location}</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Organizer</div>
                <div className="text-muted-foreground">
                  {user && user.id === event.creatorId ? "You" : "Event Creator"}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-medium">Description</h3>
            <div className="rounded-lg bg-muted/50 p-4">
              {event.description.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-2 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

