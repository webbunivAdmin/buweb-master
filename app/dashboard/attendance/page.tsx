"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { attendanceService } from "@/lib/attendance-service"
import { courseService } from "@/lib/course-service"
import { timetableService } from "@/lib/timetable-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, User, BookOpen, CheckCircle, XCircle, BarChart3, Users, Layers } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"

export default function AttendancePage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [timetables, setTimetables] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClasses: 0,
    attendedClasses: 0,
    attendanceRate: 0,
  })

  // Helper function to normalize IDs (handles both _id and id)
  const getId = (obj) => obj?._id || obj?.id

  // Helper function to get student ID (handles both object and string references)
  const getStudentId = (student) => {
    if (typeof student === "string") return student
    return getId(student)
  }

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [coursesData, timetablesData] = await Promise.all([
        courseService.getAllCourses(),
        timetableService.getAllTimetables(),
      ])

      // Normalize courses data
      const normalizedCourses = coursesData.map((course) => ({
        ...course,
        id: getId(course),
        students: Array.isArray(course.students)
          ? course.students.map((student) => (typeof student === "string" ? student : getId(student)))
          : [],
      }))

      // Normalize timetables data
      const normalizedTimetables = timetablesData.map((timetable) => ({
        ...timetable,
        id: getId(timetable),
        course: typeof timetable.course === "string" ? timetable.course : getId(timetable.course),
        students: Array.isArray(timetable.students)
          ? timetable.students.map((student) => (typeof student === "string" ? student : getId(student)))
          : [],
      }))

      setCourses(normalizedCourses)
      setTimetables(normalizedTimetables)

      // If user is a student, fetch their attendance records
      if (user && user.role === "student") {
        const attendanceData = []

        // For each course the student is enrolled in, fetch attendance
        for (const course of normalizedCourses.filter(
          (c) =>
            c.students?.includes(user.id) ||
            normalizedTimetables.some(
              (t) =>
                (t.course === c.id || t.course === getId(c)) && t.students?.some((s) => getStudentId(s) === user.id),
            ),
        )) {
          try {
            const courseAttendance = await attendanceService.getCourseAttendance(course.id)
            // Filter for this student
            const studentAttendance = courseAttendance.filter((record) => record.studentId === user.id)
            attendanceData.push(...studentAttendance)
          } catch (error) {
            console.error(`Error fetching attendance for course ${course.id}:`, error)
          }
        }

        setAttendanceRecords(attendanceData)

        // Calculate stats
        const totalClasses = normalizedTimetables.filter((t) =>
          normalizedCourses.some(
            (c) =>
              (c.id === t.course || getId(c) === t.course) &&
              (c.students?.includes(user.id) || t.students?.some((s) => getStudentId(s) === user.id)),
          ),
        ).length

        const attendedClasses = attendanceData.filter(
          (record) => record.status === "present" || record.status === "late",
        ).length

        setStats({
          totalClasses,
          attendedClasses,
          attendanceRate: totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0,
        })
      }

      // If user is a lecturer or admin, don't auto-select a course
      if (user && (user.role === "Staff" || user.role === "Admin")) {
        setSelectedCourse("")
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchCourseAttendance = async (courseId) => {
    if (!courseId) return

    try {
      setIsLoading(true)
      const attendanceData = await attendanceService.getCourseAttendance(courseId)
      setAttendanceRecords(attendanceData)

      // Calculate stats for this course
      const courseTimetables = timetables.filter((t) => t.course === courseId || getId(t.course) === courseId)
      const totalClasses = courseTimetables.length

      // Get unique students in this course
      const course = courses.find((c) => c.id === courseId || getId(c) === courseId)
      const students = course?.students || []

      // Calculate attendance rate
      let totalAttendances = 0
      let presentAttendances = 0

      students.forEach((studentId) => {
        courseTimetables.forEach((timetable) => {
          totalAttendances++
          const record = attendanceData.find(
            (r) =>
              r.timetableId === timetable.id && (r.studentId === studentId || r.studentId === getStudentId(studentId)),
          )
          if (record && (record.status === "present" || record.status === "late")) {
            presentAttendances++
          }
        })
      })

      setStats({
        totalClasses,
        attendedClasses: 0, // Not applicable for lecturer view
        attendanceRate: totalAttendances > 0 ? Math.round((presentAttendances / totalAttendances) * 100) : 0,
      })
    } catch (error) {
      console.error("Error fetching course attendance:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCourse && (user?.role === "Staff" || user?.role === "Admin")) {
      fetchCourseAttendance(selectedCourse)
    }
  }, [selectedCourse, user?.role])

  // Helper function to format date and time
  const formatDateTime = (dateString) => {
    try {
      const date = parseISO(dateString)
      return {
        date: format(date, "MMM d, yyyy"),
        time: format(date, "h:mm a"),
      }
    } catch (error) {
      return {
        date: new Date(dateString).toLocaleDateString(),
        time: new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    }
  }

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">Present</Badge>
      case "late":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300">Late</Badge>
      case "absent":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">Absent</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Helper function to get course name
  const getCourseName = (courseId) => {
    const course = courses.find((c) => c.id === courseId || getId(c) === courseId)
    return course ? `${course.name} (${course.code || ""})` : "Unknown Course"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Attendance Tracker</h1>
        {user?.role === "student" && (
          <Badge variant="outline" className="px-3 py-1 text-sm">
            Overall: {stats.attendanceRate}% Attendance Rate
          </Badge>
        )}
      </div>

      {user?.role === "student" ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="overflow-hidden">
              <div className="h-1 bg-blue-500"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-500" />
                  Total Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stats.totalClasses}</div>
                )}
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-1 bg-green-500"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Classes Attended
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stats.attendedClasses}</div>
                )}
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-1 bg-purple-500"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  Attendance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {stats.attendanceRate}%
                    <div className="w-full h-2 bg-gray-100 rounded-full mt-2">
                      <div
                        className="h-2 bg-purple-500 rounded-full"
                        style={{ width: `${stats.attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Classes</TabsTrigger>
              <TabsTrigger value="present">Present</TabsTrigger>
              <TabsTrigger value="absent">Absent</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    Attendance Records
                  </CardTitle>
                  <CardDescription>Your attendance for all classes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <TableRow key={i}>
                                <TableCell>
                                  <Skeleton className="h-4 w-32" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-24" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-40" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-16" />
                                </TableCell>
                              </TableRow>
                            ))
                        ) : attendanceRecords.length > 0 ? (
                          attendanceRecords.map((record) => {
                            const timetable = timetables.find(
                              (t) => t.id === record.timetableId || getId(t) === record.timetableId,
                            )
                            const courseId = timetable?.course
                            const course = courses.find((c) => c.id === courseId || getId(c) === courseId)
                            const { date, time } = timetable
                              ? formatDateTime(timetable.startTime)
                              : { date: "-", time: "-" }

                            return (
                              <TableRow key={record.id || getId(record)}>
                                <TableCell className="font-medium">
                                  {course ? (
                                    <Link
                                      href={`/dashboard/courses/${course.id || getId(course)}`}
                                      className="hover:underline flex items-center gap-1"
                                    >
                                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                      {course.name}
                                    </Link>
                                  ) : (
                                    "Unknown Course"
                                  )}
                                </TableCell>
                                <TableCell className="capitalize">
                                  {timetable ? (
                                    <Link
                                      href={`/dashboard/timetables/${timetable.id || getId(timetable)}`}
                                      className="hover:underline"
                                    >
                                      {timetable.classType}
                                    </Link>
                                  ) : (
                                    "Unknown Class"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-sm">{date}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">{time}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(record.status)}</TableCell>
                              </TableRow>
                            )
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                              No attendance records found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="present">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Present Records
                  </CardTitle>
                  <CardDescription>Classes where you were present</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          Array(3)
                            .fill(0)
                            .map((_, i) => (
                              <TableRow key={i}>
                                <TableCell>
                                  <Skeleton className="h-4 w-32" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-24" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-40" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-16" />
                                </TableCell>
                              </TableRow>
                            ))
                        ) : attendanceRecords.filter((r) => r.status === "present" || r.status === "late").length >
                          0 ? (
                          attendanceRecords
                            .filter((r) => r.status === "present" || r.status === "late")
                            .map((record) => {
                              const timetable = timetables.find(
                                (t) => t.id === record.timetableId || getId(t) === record.timetableId,
                              )
                              const courseId = timetable?.course
                              const course = courses.find((c) => c.id === courseId || getId(c) === courseId)
                              const { date, time } = timetable
                                ? formatDateTime(timetable.startTime)
                                : { date: "-", time: "-" }

                              return (
                                <TableRow key={record.id || getId(record)}>
                                  <TableCell className="font-medium">
                                    {course ? (
                                      <Link
                                        href={`/dashboard/courses/${course.id || getId(course)}`}
                                        className="hover:underline flex items-center gap-1"
                                      >
                                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                        {course.name}
                                      </Link>
                                    ) : (
                                      "Unknown Course"
                                    )}
                                  </TableCell>
                                  <TableCell className="capitalize">
                                    {timetable ? (
                                      <Link
                                        href={`/dashboard/timetables/${timetable.id || getId(timetable)}`}
                                        className="hover:underline"
                                      >
                                        {timetable.classType}
                                      </Link>
                                    ) : (
                                      "Unknown Class"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-sm">{date}</span>
                                      </div>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">{time}</span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                                </TableRow>
                              )
                            })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                              No present records found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="absent">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Absent Records
                  </CardTitle>
                  <CardDescription>Classes where you were absent</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          Array(3)
                            .fill(0)
                            .map((_, i) => (
                              <TableRow key={i}>
                                <TableCell>
                                  <Skeleton className="h-4 w-32" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-24" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-40" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-16" />
                                </TableCell>
                              </TableRow>
                            ))
                        ) : attendanceRecords.filter((r) => r.status === "absent").length > 0 ? (
                          attendanceRecords
                            .filter((r) => r.status === "absent")
                            .map((record) => {
                              const timetable = timetables.find(
                                (t) => t.id === record.timetableId || getId(t) === record.timetableId,
                              )
                              const courseId = timetable?.course
                              const course = courses.find((c) => c.id === courseId || getId(c) === courseId)
                              const { date, time } = timetable
                                ? formatDateTime(timetable.startTime)
                                : { date: "-", time: "-" }

                              return (
                                <TableRow key={record.id || getId(record)}>
                                  <TableCell className="font-medium">
                                    {course ? (
                                      <Link
                                        href={`/dashboard/courses/${course.id || getId(course)}`}
                                        className="hover:underline flex items-center gap-1"
                                      >
                                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                        {course.name}
                                      </Link>
                                    ) : (
                                      "Unknown Course"
                                    )}
                                  </TableCell>
                                  <TableCell className="capitalize">
                                    {timetable ? (
                                      <Link
                                        href={`/dashboard/timetables/${timetable.id || getId(timetable)}`}
                                        className="hover:underline"
                                      >
                                        {timetable.classType}
                                      </Link>
                                    ) : (
                                      "Unknown Class"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-sm">{date}</span>
                                      </div>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">{time}</span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                                </TableRow>
                              )
                            })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                              No absent records found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        // Lecturer or Admin view
        <>
          <div className="flex items-center space-x-4 mb-6 bg-muted/20 p-4 rounded-lg border">
            <Label htmlFor="courseSelect" className="whitespace-nowrap font-medium">
              Select Course:
            </Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger id="courseSelect" className="w-[300px]">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses
                  .filter(
                    (course) =>
                      user?.role === "Admin" || course.lecturer === user?.id || getId(course.lecturer) === user?.id,
                  )
                  .map((course) => (
                    <SelectItem key={course.id || getId(course)} value={course.id || getId(course)}>
                      {course.name} ({course.code || ""})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedCourse && !isLoading && (
            <div className="text-center p-8 bg-muted/10 rounded-lg border border-dashed">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Course</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Please select a course from the dropdown above to view attendance records and statistics.
              </p>
            </div>
          )}

          {selectedCourse && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="overflow-hidden">
                  <div className="h-1 bg-blue-500"></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-500" />
                      Total Classes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-7 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">{stats.totalClasses}</div>
                    )}
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <div className="h-1 bg-green-500"></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      Total Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-7 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">
                        {courses.find((c) => c.id === selectedCourse || getId(c) === selectedCourse)?.students
                          ?.length || 0}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <div className="h-1 bg-purple-500"></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                      Attendance Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-7 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">
                        {stats.attendanceRate}%
                        <div className="w-full h-2 bg-gray-100 rounded-full mt-2">
                          <div
                            className="h-2 bg-purple-500 rounded-full"
                            style={{ width: `${stats.attendanceRate}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <div className="h-1 bg-cyan-500"></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-cyan-500" />
                      Lecturer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-7 w-16" />
                    ) : (
                      <div className="text-sm">
                        {(() => {
                          const course = courses.find((c) => c.id === selectedCourse || getId(c) === selectedCourse)
                          const lecturer = course?.lecturer
                          if (!lecturer) return "Not assigned"

                          // Handle both string ID and object reference
                          if (typeof lecturer === "string") {
                            // Try to find lecturer info in timetables
                            const timetable = timetables.find(
                              (t) => (t.course === selectedCourse || getId(t.course) === selectedCourse) && t.lecturer,
                            )
                            if (timetable?.lecturer) {
                              const lecturerObj = timetable.lecturer
                              return (
                                <div className="flex flex-col">
                                  <span className="font-medium">{lecturerObj.name}</span>
                                  <span className="text-xs text-muted-foreground">{lecturerObj.email}</span>
                                  {lecturerObj.registrationNumber && (
                                    <span className="text-xs text-muted-foreground mt-1">
                                      ID: {lecturerObj.registrationNumber}
                                    </span>
                                  )}
                                </div>
                              )
                            }
                            return lecturer
                          } else {
                            // Lecturer is an object
                            return (
                              <div className="flex flex-col">
                                <span className="font-medium">{lecturer.name}</span>
                                <span className="text-xs text-muted-foreground">{lecturer.email}</span>
                                {lecturer.registrationNumber && (
                                  <span className="text-xs text-muted-foreground mt-1">
                                    ID: {lecturer.registrationNumber}
                                  </span>
                                )}
                              </div>
                            )
                          }
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6 shadow-sm">
                <CardHeader className="bg-muted/10">
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    Class Attendance Summary
                  </CardTitle>
                  <CardDescription>Attendance records for {getCourseName(selectedCourse)}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="rounded-md border shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/5">
                          <TableHead>Class</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Present</TableHead>
                          <TableHead>Late</TableHead>
                          <TableHead>Absent</TableHead>
                          <TableHead>Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading
                          ? Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <TableRow key={i}>
                                  <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-40" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                  </TableCell>
                                </TableRow>
                              ))
                          : timetables
                              .filter((t) => t.course === selectedCourse || getId(t.course) === selectedCourse)
                              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                              .map((timetable) => {
                                const timetableAttendance = attendanceRecords.filter(
                                  (r) => r.timetableId === timetable.id || r.timetableId === getId(timetable),
                                )
                                const presentCount = timetableAttendance.filter((r) => r.status === "present").length
                                const lateCount = timetableAttendance.filter((r) => r.status === "late").length
                                const absentCount = timetableAttendance.filter((r) => r.status === "absent").length
                                const totalStudents =
                                  timetable.students?.length ||
                                  courses.find((c) => c.id === selectedCourse || getId(c) === selectedCourse)?.students
                                    ?.length ||
                                  0
                                const attendanceRate =
                                  totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0
                                const { date, time } = formatDateTime(timetable.startTime)

                                return (
                                  <TableRow key={timetable.id || getId(timetable)} className="hover:bg-muted/50">
                                    <TableCell className="font-medium capitalize">
                                      <Link
                                        href={`/dashboard/timetables/${timetable.id || getId(timetable)}`}
                                        className="hover:underline flex items-center gap-1"
                                      >
                                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                        {timetable.classType}
                                      </Link>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-sm">{date}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">{time}</span>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className="bg-green-100 text-green-800 border-green-300">
                                        {presentCount}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                        {lateCount}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className="bg-red-100 text-red-800 border-red-300">{absentCount}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{attendanceRate}%</span>
                                        <div className="w-16 h-2 bg-gray-100 rounded-full">
                                          <div
                                            className={`h-2 rounded-full ${
                                              attendanceRate > 75
                                                ? "bg-green-500"
                                                : attendanceRate > 50
                                                  ? "bg-amber-500"
                                                  : "bg-red-500"
                                            }`}
                                            style={{ width: `${attendanceRate}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6 shadow-sm">
                <CardHeader className="bg-muted/10">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    Student Attendance Summary
                  </CardTitle>
                  <CardDescription>Individual student attendance for {getCourseName(selectedCourse)}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="rounded-md border shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/5">
                          <TableHead>Student</TableHead>
                          <TableHead>Present</TableHead>
                          <TableHead>Late</TableHead>
                          <TableHead>Absent</TableHead>
                          <TableHead>Attendance Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading
                          ? Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <TableRow key={i}>
                                  <TableCell>
                                    <Skeleton className="h-4 w-32" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                  </TableCell>
                                </TableRow>
                              ))
                          : (() => {
                              // Get students from course or timetable
                              const course = courses.find((c) => c.id === selectedCourse || getId(c) === selectedCourse)
                              let students = []

                              if (course?.students?.length) {
                                // If course has students array with objects
                                students = course.students.map((student) => {
                                  if (typeof student === "string") {
                                    // Try to find student info in timetables
                                    const timetable = timetables.find(
                                      (t) =>
                                        (t.course === selectedCourse || getId(t.course) === selectedCourse) &&
                                        t.students?.some((s) => getStudentId(s) === student),
                                    )
                                    if (timetable) {
                                      const studentObj = timetable.students.find((s) => getStudentId(s) === student)
                                      if (studentObj && typeof studentObj !== "string") {
                                        return studentObj
                                      }
                                    }
                                    return { id: student, name: `Student ${student.slice(-4)}` }
                                  }
                                  return student
                                })
                              } else {
                                // Try to get students from timetable
                                const timetable = timetables.find(
                                  (t) => t.course === selectedCourse || getId(t.course) === selectedCourse,
                                )
                                if (timetable?.students?.length) {
                                  students = timetable.students
                                }
                              }

                              return students.map((student) => {
                                const studentId = getStudentId(student)
                                const studentAttendance = attendanceRecords.filter((r) => r.studentId === studentId)
                                const presentCount = studentAttendance.filter((r) => r.status === "present").length
                                const lateCount = studentAttendance.filter((r) => r.status === "late").length
                                const absentCount = studentAttendance.filter((r) => r.status === "absent").length
                                const totalClasses = timetables.filter(
                                  (t) => t.course === selectedCourse || getId(t.course) === selectedCourse,
                                ).length
                                const attendanceRate =
                                  totalClasses > 0 ? Math.round(((presentCount + lateCount) / totalClasses) * 100) : 0

                                return (
                                  <TableRow key={studentId} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <div>{student.name}</div>
                                          {student.email && (
                                            <div className="text-xs text-muted-foreground">{student.email}</div>
                                          )}
                                          {student.registrationNumber && (
                                            <div className="text-xs text-muted-foreground">
                                              {student.registrationNumber}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className="bg-green-100 text-green-800 border-green-300">
                                        {presentCount}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                        {lateCount}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className="bg-red-100 text-red-800 border-red-300">{absentCount}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{attendanceRate}%</span>
                                        <div className="w-16 h-2 bg-gray-100 rounded-full">
                                          <div
                                            className={`h-2 rounded-full ${
                                              attendanceRate > 75
                                                ? "bg-green-500"
                                                : attendanceRate > 50
                                                  ? "bg-amber-500"
                                                  : "bg-red-500"
                                            }`}
                                            style={{ width: `${attendanceRate}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              })
                            })()}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
