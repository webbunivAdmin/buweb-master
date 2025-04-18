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
import { Checkbox } from "@/components/ui/checkbox"

interface User {
  _id: string
  name: string
  email: string
}

export default function NewEventPage() {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [eventType, setEventType] = useState("general")
  const [addReminders, setAddReminders] = useState(false)
  const [emailReminder, setEmailReminder] = useState(false)
  const [pushReminder, setPushReminder] = useState(false)
  const [smsReminder, setSmsReminder] = useState(false)
  const [reminderTime, setReminderTime] = useState("30")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Check if user has permission to create events
        if (user.role !== "Admin" && user.role !== "Faculty") {
          toast.error("Permission Denied", {
            description: "You don't have permission to create events.",
          })
          router.push("/dashboard/calendar")
          return
        }

        // Set default dates and times
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(now.getDate() + 1)

        setStartDate(now.toISOString().split("T")[0])
        setStartTime("09:00")
        setEndDate(now.toISOString().split("T")[0])
        setEndTime("10:00")
      } catch (error) {
        console.error("Error checking permission:", error)
        toast.error("Failed to load data", {
          description: "Please try again later",
        })
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

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
        title,
        description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: location || null,
        isGeneral: eventType === "general",
        type: eventType,
        reminderTimes: reminderTimes,
      }
      const data = await eventService.createEvent(eventData)
      toast.success("Event created successfully")
      router.push(`/dashboard/calendar/${data.event._id}`)
    } catch (error) {
      console.error("Error creating event:", error)
      toast.error("Failed to create event", {
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

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/calendar">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Event</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Create Event</CardTitle>
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

                  <div className="space-y-2">
                    <Label>Reminder Methods</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="emailReminder"
                          checked={emailReminder}
                          onCheckedChange={(checked) => setEmailReminder(!!checked)}
                        />
                        <Label htmlFor="emailReminder">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pushReminder"
                          checked={pushReminder}
                          onCheckedChange={(checked) => setPushReminder(!!checked)}
                        />
                        <Label htmlFor="pushReminder">Push Notification</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="smsReminder"
                          checked={smsReminder}
                          onCheckedChange={(checked) => setSmsReminder(!!checked)}
                        />
                        <Label htmlFor="smsReminder">SMS</Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={submitting} className="ml-auto">
              {submitting ? "Creating..." : "Create Event"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

