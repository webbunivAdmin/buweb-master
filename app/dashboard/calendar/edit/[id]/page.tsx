"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function EditEventPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [eventType, setEventType] = useState("general")
  const [isGeneral, setIsGeneral] = useState(false)
  const [addReminders, setAddReminders] = useState(false)
  const [reminderTime, setReminderTime] = useState("30")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchEventAndUsers = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Fetch event details
        const eventData = await eventService.getEventById(params.id)
        setEvent(eventData)

        // Check if user has permission to edit
        if (eventData.creatorId !== user.id && user.role !== "Admin" && user.role !== "Faculty") {
          toast.error("Permission Denied", {
            description: "You don't have permission to edit this event.",
          })
          router.push(`/dashboard/calendar/${params.id}`)
          return
        }

        // Set form values
        setTitle(eventData.title)
        setDescription(eventData.description)
        setLocation(eventData.location || "")
        setIsGeneral(eventData.isGeneral)
        setEventType(eventData.type || "general")

        // Set dates and times
        const startDateTime = new Date(eventData.startTime)
        const endDateTime = new Date(eventData.endTime)

        setStartDate(startDateTime.toISOString().split("T")[0])
        setStartTime(startDateTime.toTimeString().slice(0, 5))
        setEndDate(endDateTime.toISOString().split("T")[0])
        setEndTime(endDateTime.toTimeString().slice(0, 5))

        // Set reminders
        if (eventData.reminderTimes && eventData.reminderTimes.length > 0) {
          setAddReminders(true)
          setReminderTime(eventData.reminderTimes[0].toString())
        }
      } catch (error) {
        console.error("Error fetching event:", error)
        toast.error("Failed to load event", {
          description: "Please try again later",
        })
        router.push("/dashboard/calendar")
      } finally {
        setLoading(false)
      }
    }

    fetchEventAndUsers()
  }, [user, params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !event) return

    if (!title.trim() || !description.trim() || !startDate || !startTime || !endDate || !endTime) {
      toast.error("Please fill in all required fields")
      return
    }

    const startDateTime = new Date(`${startDate}T${startTime}`)
    const endDateTime = new Date(`${endDate}T${endTime}`)

    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time")
      return
    }

    setSubmitting(true)
    try {
      // Prepare reminders if enabled
      const reminderTimes = []
      if (addReminders) {
        reminderTimes.push(Number.parseInt(reminderTime))
      }

      const eventData = {
        eventId: event._id,
        title,
        description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: location || null,
        isGeneral: user.role === "Admin" || user.role === "Faculty" ? isGeneral : event.isGeneral,
        type: eventType,
        reminderTimes: reminderTimes,
      }

      const data = await eventService.updateEvent(eventData)
      toast.success("Event updated successfully")
      router.push(`/dashboard/calendar/${event._id}`)
    } catch (error) {
      console.error("Error updating event:", error)
      toast.error("Failed to update event", {
        description: "Please try again later",
      })
    } finally {
      setSubmitting(false)
    }
  }

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
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/calendar/${event._id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Event</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Update Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter event description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="Enter event location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(user?.role === "Admin" || user?.role === "Faculty") && (
              <div className="flex items-center space-x-2">
                <Switch id="isGeneral" checked={isGeneral} onCheckedChange={setIsGeneral} />
                <Label htmlFor="isGeneral">General Event (visible to all users)</Label>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="addReminders" checked={addReminders} onCheckedChange={setAddReminders} />
                <Label htmlFor="addReminders">Add Reminders</Label>
              </div>

              {addReminders && (
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reminderTime">Remind Before</Label>
                    <Select value={reminderTime} onValueChange={setReminderTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="1440">1 day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/calendar/${event._id}`)}
              className="mr-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Event"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

