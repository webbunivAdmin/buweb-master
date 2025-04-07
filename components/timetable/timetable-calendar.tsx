"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface TimetableCalendarProps {
  timetables: any[]
  currentDate: Date
  onDateChange: (date: Date) => void
  view: "week" | "month"
  loading: boolean
}

export function TimetableCalendar({ timetables, currentDate, onDateChange, view, loading }: TimetableCalendarProps) {
  const [calendarDays, setCalendarDays] = useState<Date[]>([])
  const router = useRouter()

  useEffect(() => {
    const days = view === "week" ? generateWeekDays(currentDate) : generateMonthDays(currentDate)
    setCalendarDays(days)
  }, [currentDate, view])

  // Generate days for the current week view
  const generateWeekDays = (date: Date) => {
    const days: Date[] = []
    const currentDay = new Date(date)
    const day = currentDay.getDay() // 0 = Sunday, 6 = Saturday

    // Set to the beginning of the week (Sunday)
    currentDay.setDate(currentDay.getDate() - day)

    // Generate 7 days (full week)
    for (let i = 0; i < 7; i++) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return days
  }

  // Generate days for the current month view
  const generateMonthDays = (date: Date) => {
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

  // Get timetables for a specific day
  const getTimetablesForDay = (date: Date) => {
    return timetables.filter((timetable) => {
      const timetableStart = new Date(timetable.startTime)

      // Check if it's a recurring weekly class
      if (timetable.repeatsWeekly) {
        // Check if the day of the week matches
        const isSameDay = timetableStart.getDay() === date.getDay()

        // Check if the date is within the class period (start date to end date)
        const isWithinPeriod =
          date >= new Date(timetable.startTime) && (!timetable.endDate || date <= new Date(timetable.endDate))

        return isSameDay && isWithinPeriod
      } else {
        // For non-recurring classes, check if the date matches exactly
        return (
          timetableStart.getDate() === date.getDate() &&
          timetableStart.getMonth() === date.getMonth() &&
          timetableStart.getFullYear() === date.getFullYear()
        )
      }
    })
  }

  // Format time (e.g., "10:00 AM")
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Navigate to previous week/month
  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    if (view === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    onDateChange(newDate)
  }

  // Navigate to next week/month
  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (view === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    onDateChange(newDate)
  }

  // Navigate to today
  const handleToday = () => {
    onDateChange(new Date())
  }

  // Format the header based on view
  const formatHeader = () => {
    if (view === "week") {
      const firstDay = calendarDays[0]
      const lastDay = calendarDays[6]

      const formatOptions: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: firstDay.getFullYear() !== lastDay.getFullYear() ? "numeric" : undefined,
      }

      return `${firstDay.toLocaleDateString(undefined, formatOptions)} - ${lastDay.toLocaleDateString(undefined, formatOptions)}, ${lastDay.getFullYear()}`
    } else {
      return currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    }
  }

  // Handle click on a timetable item
  const handleTimetableClick = (timetable: any) => {
    router.push(`/dashboard/timetable/${timetable._id}`)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid grid-cols-7 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 border-b font-medium text-sm">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: view === "week" ? 7 : 35 }).map((_, i) => (
            <div key={i} className="min-h-[120px] p-1 border">
              <Skeleton className="h-5 w-5 rounded-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{formatHeader()}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2 border-b font-medium text-sm">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayTimetables = getTimetablesForDay(day)
          const isCurrentDay = isToday(day)
          const inCurrentMonth = view === "week" ? true : isCurrentMonth(day)

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
                {dayTimetables.map((timetable) => (
                  <div
                    key={timetable._id}
                    onClick={() => handleTimetableClick(timetable)}
                    className="text-xs p-1 rounded truncate cursor-pointer bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                  >
                    <div className="font-medium">{timetable.classType}</div>
                    <div>{formatTime(new Date(timetable.startTime))}</div>
                  </div>
                ))}
              </div>
              {dayTimetables.length > 0 && (
                <div className="absolute top-1 left-1">
                  <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {dayTimetables.length}
                  </Badge>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

