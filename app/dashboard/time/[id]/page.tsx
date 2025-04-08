"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { timetableService } from "@/lib/timetable-service"
import { courseService } from "@/lib/course-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, BookOpen, ArrowLeft, Check } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AttendanceMarking } from "@/components/timetable/attendance-marking"
import { ClassDetails } from "@/components/timetable/class-details"
import { StudentsList } from "@/components/timetable/students-list"

export default function TimetableDetailsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const [timetable, setTimetable] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("details")
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !params.id) return

      setLoading(true)
      try {
        // Fetch timetable details
        const timetableData = await timetableService.getTimetable(params.id)
        setTimetable(timetableData)

        // Fetch course details
        if (timetableData.course) {
          const courseData = await courseService.getCourse(timetableData.course)
          setCourse(courseData)
        }

        // Fetch attendance records if user is a lecturer or admin
        if (user.role === "admin" || user.role === "faculty") {
          // In a real app, you would fetch actual attendance data
          // For now, we'll generate mock data
          const mockAttendance = Array.from({ length: 10 }).map((_, index) => ({
            _id: `attendance-${index}`,
            timetable: params.id,
            student: `student-${index}`,
            studentName: `Student ${index + 1}`,
            status: ["present", "absent", "late"][Math.floor(Math.random() * 3)],
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            remarks: "",
          }))

          setAttendanceRecords(mockAttendance)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load class details")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, params.id])

  const handleMarkAttendance = async (status: "present" | "absent" | "late", remarks?: string) => {
    if (!user || !timetable) return

    try {
      // In a real app, you would call the API to mark attendance
      // For now, we'll just show a success message
      toast.success(`Attendance marked as ${status}`)

      // Simulate API call
      // await attendanceService.markAttendance({
      //   timetableId: timetable._id,
      //   studentId: user.id,
      //   status,
      //   remarks
      // })
    } catch (error) {
      console.error("Error marking attendance:", error)
      toast.error("Failed to mark attendance")
    }
  }

  const handleUpdateAttendance = async (
    attendanceId: string,
    status: "present" | "absent" | "late",
    remarks?: string,
  ) => {
    try {
      // In a real app, you would call the API to update attendance
      // For now, we'll just update the local state
      setAttendanceRecords((prev) =>
        prev.map((record) => (record._id === attendanceId ? { ...record, status, remarks } : record)),
      )

      toast.success(`Attendance updated to ${status}`)

      // Simulate API call
      // await attendanceService.updateAttendance(attendanceId, { status, remarks })
    } catch (error) {
      console.error("Error updating attendance:", error)
      toast.error("Failed to update attendance")
    }
  }

  const isLecturer = user?.role === "admin" || user?.role === "faculty"
  const isStudent = user?.role === "student"

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-2">
            <div className="h-7 w-40 bg-muted rounded animate-pulse" />
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-muted rounded-full" />
                      <div className="h-4 w-full bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 w-full bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!timetable) {
    return (
      <div className="container py-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Class Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The class you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button asChild>
            <Link href="/dashboard/timetable">Back to Timetable</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/timetable">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{course?.name || "Class Details"}</h1>
          <p className="text-muted-foreground">{course?.code || ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              {isLecturer && <TabsTrigger value="students">Students</TabsTrigger>}
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <ClassDetails timetable={timetable} course={course} />
            </TabsContent>

            {isLecturer && (
              <TabsContent value="students">
                <StudentsList
                  timetable={timetable}
                  attendanceRecords={attendanceRecords}
                  onUpdateAttendance={handleUpdateAttendance}
                />
              </TabsContent>
            )}

            <TabsContent value="attendance">
              <AttendanceMarking
                timetable={timetable}
                isLecturer={isLecturer}
                onMarkAttendance={handleMarkAttendance}
                attendanceRecords={attendanceRecords}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isStudent && (
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("attendance")}>
                    <Check className="mr-2 h-4 w-4" />
                    Mark Attendance
                  </Button>
                )}

                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/dashboard/calendar?course=${course?._id}`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    View in Calendar
                  </Link>
                </Button>

                {isLecturer && (
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("students")}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Students
                  </Button>
                )}

                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/dashboard/courses/${course?._id}`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Course Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Class Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(timetable.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                      {new Date(timetable.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{timetable.location}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Schedule</p>
                    <p className="text-sm text-muted-foreground">
                      {timetable.repeatsWeekly
                        ? `Weekly on ${new Date(timetable.startTime).toLocaleDateString(undefined, { weekday: "long" })}`
                        : `One-time on ${new Date(timetable.startTime).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Students</p>
                    <p className="text-sm text-muted-foreground">{timetable.students?.length || 0} Enrolled</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

