"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users } from "lucide-react"

interface ClassDetailsProps {
  timetable: any
  course: any
}

export function ClassDetails({ timetable, course }: ClassDetailsProps) {
  // Format date (e.g., "Monday, April 5, 2023")
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  // Format time (e.g., "10:00 AM - 11:30 AM")
  const formatTimeRange = (start: Date, end: Date) => {
    const startTime = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const endTime = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    return `${startTime} - ${endTime}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{course?.name || "Class"}</CardTitle>
              <CardDescription>{course?.code || ""}</CardDescription>
            </div>
            <Badge>{timetable.classType}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-muted-foreground">
                  {timetable.repeatsWeekly
                    ? `Weekly on ${new Date(timetable.startTime).toLocaleDateString(undefined, { weekday: "long" })}`
                    : formatDate(new Date(timetable.startTime))}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-muted-foreground">
                  {formatTimeRange(new Date(timetable.startTime), new Date(timetable.endTime))}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">{timetable.location}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Students</p>
                <p className="text-muted-foreground">{timetable.students?.length || 0} Enrolled</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {course && (
        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="text-muted-foreground">{course.description || "No description available."}</p>
              </div>

              <div>
                <h3 className="font-medium">Department</h3>
                <p className="text-muted-foreground">{course.department}</p>
              </div>

              <div>
                <h3 className="font-medium">Lecturer</h3>
                <p className="text-muted-foreground">
                  {course.lecturer?.name || timetable.lecturer?.name || "Not assigned"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

