"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Users, BookOpen } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface UpcomingClassesProps {
  timetables: any[]
  courses: any[]
  loading: boolean
}

export function UpcomingClasses({ timetables, courses, loading }: UpcomingClassesProps) {
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([])

  useEffect(() => {
    if (timetables.length > 0 && courses.length > 0) {
      // Get current date and time
      const now = new Date()

      // Filter and sort upcoming classes
      const upcoming = timetables
        .filter((timetable) => {
          const startTime = new Date(timetable.startTime)

          // For recurring classes
          if (timetable.repeatsWeekly) {
            // Get the next occurrence of this class
            const nextOccurrence = getNextOccurrence(timetable, now)

            // Check if it's in the future and within the end date (if specified)  now)

            // Check if it's in the future and within the end date (if specified)
            if (nextOccurrence) {
              return !timetable.endDate || new Date(timetable.endDate) >= nextOccurrence
            }
            return false
          }
          // For non-recurring classes
          else {
            return startTime > now
          }
        })
        .sort((a, b) => {
          const aTime = a.repeatsWeekly ? getNextOccurrence(a, now) : new Date(a.startTime)
          const bTime = b.repeatsWeekly ? getNextOccurrence(b, now) : new Date(b.startTime)
          return aTime.getTime() - bTime.getTime()
        })
        .slice(0, 5) // Get only the next 5 classes

      // Enrich with course data
      const enrichedClasses = upcoming.map((timetable) => {
        const course = courses.find((c) => c._id === timetable.course)
        return {
          ...timetable,
          courseName: course?.name || "Unknown Course",
          courseCode: course?.code || "N/A",
        }
      })

      setUpcomingClasses(enrichedClasses)
    }
  }, [timetables, courses])

  // Helper function to get the next occurrence of a weekly class
  const getNextOccurrence = (timetable: any, fromDate: Date) => {
    const startTime = new Date(timetable.startTime)
    const dayOfWeek = startTime.getDay() // 0 = Sunday, 6 = Saturday

    // Clone the fromDate to avoid modifying it
    const nextDate = new Date(fromDate)

    // Set the time to match the class time
    nextDate.setHours(startTime.getHours())
    nextDate.setMinutes(startTime.getMinutes())
    nextDate.setSeconds(0)
    nextDate.setMilliseconds(0)

    // Calculate days to add to get to the next occurrence
    const currentDay = nextDate.getDay()
    let daysToAdd = dayOfWeek - currentDay

    // If the day has already passed this week, go to next week
    if (daysToAdd < 0 || (daysToAdd === 0 && nextDate < fromDate)) {
      daysToAdd += 7
    }

    // Add the days
    nextDate.setDate(nextDate.getDate() + daysToAdd)

    return nextDate
  }

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

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (upcomingClasses.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Upcoming Classes</h3>
        <p className="text-muted-foreground mb-4">You don't have any upcoming classes scheduled.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {upcomingClasses.map((timetable) => {
        const nextOccurrence = timetable.repeatsWeekly
          ? getNextOccurrence(timetable, new Date())
          : new Date(timetable.startTime)

        return (
          <Card key={timetable._id}>
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{timetable.courseName}</h3>
                    <p className="text-sm text-muted-foreground">{timetable.courseCode}</p>
                  </div>
                  <Badge variant={timetable.repeatsWeekly ? "secondary" : "outline"}>{timetable.classType}</Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatDate(nextOccurrence)} at {formatTime(nextOccurrence)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{timetable.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{timetable.students?.length || 0} Students</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/timetable/${timetable._id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

