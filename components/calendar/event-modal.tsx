"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (eventData: any) => void
  event: any | null
  isAdmin: boolean
}

export function EventModal({ isOpen, onClose, onSave, event, isAdmin }: EventModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isGeneral, setIsGeneral] = useState(false)
  const [department, setDepartment] = useState("")
  const [hasReminder, setHasReminder] = useState(false)
  const [reminderTimes, setReminderTimes] = useState<number[]>([60]) // Default 1 hour before

  // Reset form when modal opens/closes or event changes
  useEffect(() => {
    if (isOpen && event) {
      // Edit mode - populate form with event data
      setTitle(event.title || "")
      setDescription(event.description || "")

      const startDateTime = new Date(event.startTime)
      setStartDate(startDateTime.toISOString().split("T")[0])
      setStartTime(startDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }))

      const endDateTime = new Date(event.endTime)
      setEndDate(endDateTime.toISOString().split("T")[0])
      setEndTime(endDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }))

      setIsGeneral(event.isGeneral || false)
      setDepartment(event.department || "")
      setHasReminder(event.reminderTimes && event.reminderTimes.length > 0)
      setReminderTimes(event.reminderTimes || [60])
    } else {
      // Create mode - reset form
      const now = new Date()
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

      setTitle("")
      setDescription("")
      setStartDate(now.toISOString().split("T")[0])
      setStartTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }))
      setEndDate(now.toISOString().split("T")[0])
      setEndTime(oneHourLater.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }))
      setIsGeneral(false)
      setDepartment("")
      setHasReminder(false)
      setReminderTimes([60])
    }
  }, [isOpen, event])

  const handleSubmit = () => {
    // Validate form
    if (!title.trim()) {
      alert("Please enter a title")
      return
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      alert("Please enter start and end date/time")
      return
    }

    // Create start and end date objects
    const startDateTime = new Date(`${startDate}T${startTime}`)
    const endDateTime = new Date(`${endDate}T${endTime}`)

    // Validate dates
    if (endDateTime <= startDateTime) {
      alert("End time must be after start time")
      return
    }

    // Prepare event data
    const eventData = {
      title,
      description,
      startTime: startDateTime,
      endTime: endDateTime,
      isGeneral,
      department: isGeneral ? department : undefined,
      reminderTimes: hasReminder ? reminderTimes : [],
    }

    onSave(eventData)
  }

  const handleReminderChange = (time: number, checked: boolean) => {
    if (checked) {
      setReminderTimes((prev) => [...prev, time])
    } else {
      setReminderTimes((prev) => prev.filter((t) => t !== time))
    }
  }

  const departments = ["Computer Science", "Engineering", "Business", "Arts", "Medicine", "Law", "Education"]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          {isAdmin && (
            <>
              <div className="flex items-center space-x-2">
                <Switch id="is-general" checked={isGeneral} onCheckedChange={setIsGeneral} />
                <Label htmlFor="is-general">General Event (visible to all users)</Label>
              </div>

              {isGeneral && (
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <div className="flex items-center space-x-2">
            <Switch id="has-reminder" checked={hasReminder} onCheckedChange={setHasReminder} />
            <Label htmlFor="has-reminder">Set Reminder</Label>
          </div>

          {hasReminder && (
            <div className="grid gap-2 pl-6">
              <Label>Remind me:</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder-15"
                    checked={reminderTimes.includes(15)}
                    onCheckedChange={(checked) => handleReminderChange(15, checked as boolean)}
                  />
                  <Label htmlFor="reminder-15">15 minutes before</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder-60"
                    checked={reminderTimes.includes(60)}
                    onCheckedChange={(checked) => handleReminderChange(60, checked as boolean)}
                  />
                  <Label htmlFor="reminder-60">1 hour before</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder-1440"
                    checked={reminderTimes.includes(1440)}
                    onCheckedChange={(checked) => handleReminderChange(1440, checked as boolean)}
                  />
                  <Label htmlFor="reminder-1440">1 day before</Label>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{event ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

