"use client"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { eventService } from "@/lib/api-service"
import { toast } from "sonner"

interface Event {
  _id: string
  title: string
  description: string
  startDate: string
  endDate: string
  location?: string
  type?: string
  participants: string[]
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<"month" | "week" | "day">("month")

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return

      setLoading(true)
      try {
        const data = await eventService.getAllEvents()
        setEvents(data)
      } catch (error) {
        console.error("Error fetching events:", error)
        toast.error("Failed to load events", {
          description: "Please try again later",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [user])

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return events.filter((event) => {
      const startDate = new Date(event.startDate).toISOString().split("T")[0]
      const endDate = new Date(event.endDate).toISOString().split("T")[0]
      return dateStr >= startDate && dateStr <= endDate
    })
  }

  const getEventTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "meeting":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "class":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "exam":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      case "deadline":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
      default:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
    }
  }

  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const days = []

    // Add empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    const weeks = []
    let week = []

    days.forEach((day, index) => {
      week.push(day)
      if ((index + 1) % 7 === 0 || index === days.length - 1) {
        weeks.push(week)
        week = []
      }
    })

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 text-sm font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              if (!day) {
                return <div key={`empty-${weekIndex}-${dayIndex}`} className="h-24 border bg-muted/20 p-1 rounded-md" />
              }

              const isToday =
                day.getDate() === new Date().getDate() &&
                day.getMonth() === new Date().getMonth() &&
                day.getFullYear() === new Date().getFullYear()

              const dayEvents = getEventsForDate(day)

              return (
                <div
                  key={`day-${day.getTime()}`}
                  className={`h-24 overflow-hidden border p-1 rounded-md transition-colors hover:border-primary/30 ${
                    isToday ? "bg-primary/10 font-bold ring-1 ring-primary" : ""
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-sm">{day.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <Link key={event._id} href={`/dashboard/calendar/${event._id}`} className="block">
                        <div
                          className={`truncate rounded px-1 py-0.5 text-xs ${getEventTypeColor(event.type)}`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      </Link>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              )
            }),
          )}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    const day = currentDate.getDay()
    startOfWeek.setDate(currentDate.getDate() - day)

    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(date)
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((date) => {
            const isToday =
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear()

            return (
              <div
                key={date.toISOString()}
                className={`p-2 text-sm font-medium ${isToday ? "bg-primary/10 rounded-md" : ""}`}
              >
                <div>{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                <div>{date.getDate()}</div>
              </div>
            )
          })}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date) => {
            const dayEvents = getEventsForDate(date)

            return (
              <div key={date.toISOString()} className="h-96 overflow-y-auto border p-2 rounded-md">
                {dayEvents.length > 0 ? (
                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <Link key={event._id} href={`/dashboard/calendar/${event._id}`} className="block">
                        <div
                          className={`rounded-md border p-2 hover:bg-muted/50 transition-colors ${getEventTypeColor(event.type)}`}
                        >
                          <div className="font-medium">{event.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(event.startDate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {event.location && ` • ${event.location}`}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No events</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate)
    const hours = []

    for (let i = 0; i < 24; i++) {
      hours.push(i)
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-lg font-medium">
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="space-y-1">
              {hours.map((hour) => {
                const hourEvents = dayEvents.filter((event) => {
                  const eventHour = new Date(event.startDate).getHours()
                  return eventHour === hour
                })

                return (
                  <div key={hour} className="flex border-t">
                    <div className="w-16 py-2 pr-2 text-right text-sm text-muted-foreground">
                      {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                    </div>
                    <div className="flex-1 p-2 min-h-[60px]">
                      {hourEvents.length > 0 ? (
                        <div className="space-y-2">
                          {hourEvents.map((event) => (
                            <Link key={event._id} href={`/dashboard/calendar/${event._id}`} className="block">
                              <div className={`rounded-md p-2 ${getEventTypeColor(event.type)}`}>
                                <div className="font-medium">{event.title}</div>
                                <div className="text-xs">
                                  {new Date(event.startDate).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {" - "}
                                  {new Date(event.endDate).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {event.location && ` • ${event.location}`}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canCreateEvent = user?.role === "admin" || user?.role === "faculty"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">Manage your schedule, events, and deadlines</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday} className="h-9">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-2 text-lg font-medium">{formatDate(currentDate)}</div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={currentView} onValueChange={(value: "month" | "week" | "day") => setCurrentView(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>

          {canCreateEvent && (
            <Button asChild>
              <Link href="/dashboard/calendar/new">
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Calendar</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex h-[600px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              {currentView === "month" && renderMonthView()}
              {currentView === "week" && renderWeekView()}
              {currentView === "day" && renderDayView()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

