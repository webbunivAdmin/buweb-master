"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface CalendarProps {
  events: any[]
  currentDate: Date
  onEventClick: (event: any) => void
  isLoading: boolean
}

export function Calendar({ events, currentDate, onEventClick, isLoading }: CalendarProps) {
  const [calendarDays, setCalendarDays] = useState<Date[]>([])

  useEffect(() => {
    const days = generateCalendarDays(currentDate)
    setCalendarDays(days)
  }, [currentDate])

  // Generate days for the current month view
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()

    // Get the first day of the month
    const firstDay = new Date(year, month, 1)
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0)

    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay()

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek

    // Calculate total days to show (42 = 6 rows of 7 days)
    const totalDays = 42

    const days: Date[] = []

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = new Date(year, month, -i)
      days.push(day)
    }

    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i)
      days.push(day)
    }

    // Add days from next month
    const remainingDays = totalDays - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i)
      days.push(day)
    }

    return days
  }

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Check if a date is in the current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startTime)
      return (
        eventStart.getDate() === date.getDate() &&
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getFullYear() === date.getFullYear()
      )
    })
  }

  // Format time (e.g., "10:00 AM")
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2 border-b font-medium text-sm">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[120px] p-1 border">
                <Skeleton className="h-5 w-5 rounded-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 border-b font-medium text-sm">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentDay = isToday(day)
            const inCurrentMonth = isCurrentMonth(day)

            return (
              <div
                key={index}
                className={`min-h-[120px] p-1 border relative ${!inCurrentMonth ? "bg-muted/30" : ""} ${
                  isCurrentDay ? "bg-primary/5" : ""
                }`}
              >
                <div
                  className={`text-right mb-1 ${!inCurrentMonth ? "text-muted-foreground" : ""} ${
                    isCurrentDay ? "font-bold" : ""
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[90px]">
                  {dayEvents.map((event) => (
                    <div
                      key={event._id}
                      onClick={() => onEventClick(event)}
                      className={`text-xs p-1 rounded truncate cursor-pointer ${
                        event.isGeneral
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                          : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      }`}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div>{formatTime(new Date(event.startTime))}</div>
                    </div>
                  ))}
                </div>
                {dayEvents.length > 0 && (
                  <div className="absolute top-1 left-1">
                    <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {dayEvents.length}
                    </Badge>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

