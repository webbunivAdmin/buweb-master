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
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { eventService } from "@/lib/api-service"
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
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [addReminders, setAddReminders] = useState(false)
  const [emailReminder, setEmailReminder] = useState(false)
  const [pushReminder, setPushReminder] = useState(false)
  const [smsReminder, setSmsReminder] = useState(false)
  const [reminderTime, setReminderTime] = useState("30")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Check if user has permission to create events
        if (user.role !== "admin" && user.role !== "faculty") {
          toast({
            title: "Permission Denied",
            description: "You don't have permission to create events.",
            variant: "destructive",
          })
          router.push("/dashboard/calendar")
          return
        }

        // Fetch users for participant selection
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
        if (!response.ok) throw new Error("Failed to fetch users")
        const userData = await response.json()
        setUsers(userData.filter((u: User) => u._id !== user.id))

        // Set default dates and times
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(now.getDate() + 1)

        setStartDate(now.toISOString().split("T")[0])
        setStartTime("09:00")
        setEndDate(+1)

        setStartDate(now.toISOString().split("T")[0])
        setStartTime("09:00")
        setEndDate(now.toISOString().split("T")[0])
        setEndTime("10:00")
      } catch (error) {
        console.error("Error checking permission:", error)
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [user, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!title.trim() || !description.trim() || !startDate || !startTime || !endDate || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const startDateTime = new Date(`${startDate}T${startTime}`)
    const endDateTime = new Date(`${endDate}T${endTime}`)

    if (endDateTime <= startDateTime) {
      toast({
        title: "Error",
        description: "End time must be after start time.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      // Prepare reminders if enabled
      const reminders = []
      if (addReminders) {
        const reminderTimeMs = Number.parseInt(reminderTime) * 60 * 1000 // Convert minutes to milliseconds
        const reminderDate = new Date(startDateTime.getTime() - reminderTimeMs)

        if (emailReminder) {
          reminders.push({
            reminderTime: reminderDate.toISOString(),
            reminderType: "email",
          })
        }

        if (pushReminder) {
          reminders.push({
            reminderTime: reminderDate.toISOString(),
            reminderType: "push",
          })
        }

        if (smsReminder) {
          reminders.push({
            reminderTime: reminderDate.toISOString(),
            reminderType: "sms",
          })
        }
      }

      const eventData = {
        title,
        description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: location || null,
        type: eventType,
        participants: selectedUsers.length > 0 ? [...selectedUsers, user.id] : [user.id],
        reminders: reminders,
      }

      const data = await eventService.createEvent(eventData)

      toast({
        title: "Success",
        description: "Event created successfully.",
      })

      router.push(`/dashboard/calendar/${data._id}`)
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
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

            <div className="space-y-2">
              <Label>Participants (Optional)</Label>
              <div className="max-h-[200px] overflow-y-auto rounded-lg border p-2">
                {users.length > 0 ? (
                  <div className="space-y-2">
                    {users.map((u) => (
                      <div key={u._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`user-${u._id}`}
                          checked={selectedUsers.includes(u._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers([...selectedUsers, u._id])
                            } else {
                              setSelectedUsers(selectedUsers.filter((id) => id !== u._id))
                            }
                          }}
                        />
                        <Label htmlFor={`user-${u._id}`}>
                          {u.name} ({u.email})
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No users available</p>
                )}
              </div>
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

