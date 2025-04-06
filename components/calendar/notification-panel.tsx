"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Calendar, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface NotificationPanelProps {
  events: any[]
  userId: string
}

export function NotificationPanel({ events, userId }: NotificationPanelProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])

  useEffect(() => {
    // Filter events to get upcoming events (next 7 days)
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const upcoming = events.filter((event) => {
      const eventDate = new Date(event.startTime)
      return eventDate >= now && eventDate <= nextWeek
    })

    // Sort by start time
    upcoming.sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    })

    setUpcomingEvents(upcoming)

    // Generate reminders based on event reminder times
    const eventReminders: any[] = []

    events.forEach((event) => {
      if (!event.reminderTimes || event.reminderTimes.length === 0) return

      // Only include personal events or general events
      if (!event.isGeneral && event.creatorId !== userId) return

      const eventStart = new Date(event.startTime)

      event.reminderTimes.forEach((minutes: number) => {
        const reminderTime = new Date(eventStart.getTime() - minutes * 60 * 1000)

        // Only include reminders that are in the future but within the next 7 days
        if (reminderTime >= now && reminderTime <= nextWeek) {
          eventReminders.push({
            id: `${event._id}-${minutes}`,
            eventId: event._id,
            title: event.title,
            reminderTime,
            eventTime: eventStart,
            minutesBefore: minutes,
            isGeneral: event.isGeneral,
          })
        }
      })
    })

    // Sort reminders by time
    eventReminders.sort((a, b) => {
      return a.reminderTime.getTime() - b.reminderTime.getTime()
    })

    setReminders(eventReminders)
  }, [events, userId])

  // Format date (e.g., "Mon, Apr 5")
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  // Format time (e.g., "10:00 AM")
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Format reminder time (e.g., "1 hour before")
  const formatReminderTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes before`
    } else if (minutes === 60) {
      return "1 hour before"
    } else if (minutes < 1440) {
      return `${minutes / 60} hours before`
    } else if (minutes === 1440) {
      return "1 day before"
    } else {
      return `${minutes / 1440} days before`
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.slice(0, 5).map((event) => (
                <div key={event._id} className="flex items-start gap-3">
                  <div
                    className={`rounded-full p-2 ${
                      event.isGeneral ? "bg-blue-100 dark:bg-blue-900/30" : "bg-green-100 dark:bg-green-900/30"
                    }`}
                  >
                    <Calendar
                      className={`h-4 w-4 ${
                        event.isGeneral ? "text-blue-800 dark:text-blue-300" : "text-green-800 dark:text-green-300"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(new Date(event.startTime))} at {formatTime(new Date(event.startTime))}
                    </div>
                    <Badge variant="outline" className="mt-1">
                      {event.isGeneral ? "General" : "Personal"}
                    </Badge>
                  </div>
                </div>
              ))}

              {upcomingEvents.length > 5 && (
                <div className="text-sm text-center text-muted-foreground">
                  +{upcomingEvents.length - 5} more events
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No upcoming events in the next 7 days</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reminders.length > 0 ? (
            <div className="space-y-4">
              {reminders.slice(0, 5).map((reminder) => (
                <div key={reminder.id} className="flex items-start gap-3">
                  <div
                    className={`rounded-full p-2 ${
                      reminder.isGeneral ? "bg-blue-100 dark:bg-blue-900/30" : "bg-green-100 dark:bg-green-900/30"
                    }`}
                  >
                    <Clock
                      className={`h-4 w-4 ${
                        reminder.isGeneral ? "text-blue-800 dark:text-blue-300" : "text-green-800 dark:text-green-300"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{reminder.title}</div>
                    <div className="text-sm text-muted-foreground">{formatReminderTime(reminder.minutesBefore)}</div>
                    <div className="text-sm text-muted-foreground">
                      Event at {formatTime(reminder.eventTime)} on {formatDate(reminder.eventTime)}
                    </div>
                  </div>
                </div>
              ))}

              {reminders.length > 5 && (
                <div className="text-sm text-center text-muted-foreground">+{reminders.length - 5} more reminders</div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No upcoming reminders</div>
          )}
        </CardContent>
      </Card>

      {/* Mini Calendar Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Today's Agenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const today = new Date()
            const todayEvents = events.filter((event) => {
              const eventDate = new Date(event.startTime)
              return (
                eventDate.getDate() === today.getDate() &&
                eventDate.getMonth() === today.getMonth() &&
                eventDate.getFullYear() === today.getFullYear()
              )
            })

            // Sort by start time
            todayEvents.sort((a, b) => {
              return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            })

            if (todayEvents.length === 0) {
              return <div className="text-center py-4 text-muted-foreground">No events scheduled for today</div>
            }

            return (
              <div className="space-y-2">
                {todayEvents.map((event) => (
                  <div key={event._id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">{formatTime(new Date(event.startTime))}</div>
                    </div>
                    <Badge variant={event.isGeneral ? "secondary" : "outline"}>
                      {event.isGeneral ? "General" : "Personal"}
                    </Badge>
                  </div>
                ))}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </>
  )
}

