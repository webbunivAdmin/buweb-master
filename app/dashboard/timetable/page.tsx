"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { timetableService } from "@/lib/timetable-service"
import { courseService } from "@/lib/course-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, Users, BookOpen, Plus, Bell } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { TimetableCalendar } from "@/components/timetable/timetable-calendar"
import { UpcomingClasses } from "@/components/timetable/upcoming-classes"
import { AttendanceSummary } from "@/components/timetable/attendance-summary"

export default function TimetableDashboard() {
  const { user } = useAuth()
  const [timetables, setTimetables] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"week" | "month">("week")

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Fetch timetables
        const timetablesData = await timetableService.getAllTimetables()
        setTimetables(timetablesData)

        // Fetch courses
        const coursesData = await courseService.getAllCourses()
        setCourses(coursesData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load timetable data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const isAdmin = user?.role === "Admin" || user?.role === "Faculty"

  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Timetable Dashboard</h1>

          {isAdmin && (
            <Button asChild>
              <Link href="/dashboard/timetable/create">
                <Plus className="mr-2 h-4 w-4" /> Add Class
              </Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Class Timetable</CardTitle>
                  <Tabs value={view} onValueChange={(v) => setView(v as "week" | "month")}>
                    <TabsList>
                      <TabsTrigger value="week">Week</TabsTrigger>
                      <TabsTrigger value="month">Month</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>Your scheduled classes and events</CardDescription>
              </CardHeader>
              <CardContent>
                <TimetableCalendar
                  timetables={timetables}
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                  view={view}
                  loading={loading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Classes</CardTitle>
                <CardDescription>Your next scheduled classes</CardDescription>
              </CardHeader>
              <CardContent>
                <UpcomingClasses timetables={timetables} courses={courses} loading={loading} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
                <CardDescription>Your attendance for this semester</CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceSummary courses={courses} loading={loading} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col" asChild>
                    <Link href="/dashboard/timetable/attendance">
                      <Users className="mb-2 h-5 w-5" />
                      <span>Attendance</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" asChild>
                    <Link href="/dashboard/calendar">
                      <Calendar className="mb-2 h-5 w-5" />
                      <span>Events</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" asChild>
                    <Link href="/dashboard/timetable/courses">
                      <BookOpen className="mb-2 h-5 w-5" />
                      <span>Courses</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" asChild>
                    <Link href="/dashboard/notifications">
                      <Bell className="mb-2 h-5 w-5" />
                      <span>Notifications</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

