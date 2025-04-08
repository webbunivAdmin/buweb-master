"use client"

import { Label } from "@/components/ui/label"

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
import { Calendar, Clock, User } from "lucide-react"
import Link from "next/link"

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

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [coursesData, timetablesData] = await Promise.all([
        courseService.getAllCourses(),
        timetableService.getAllTimetables(),
      ])

      setCourses(coursesData)
      setTimetables(timetablesData)

      // If user is a student, fetch their attendance records
      if (user && user.role === "student") {
        const attendanceData = []

        // For each course the student is enrolled in, fetch attendance
        for (const course of coursesData.filter((c) => c.students?.includes(user.id))) {
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
        const totalClasses = timetablesData.filter((t) =>
          coursesData.some((c) => c.id === t.course && c.students?.includes(user.id)),
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

      // If user is a lecturer, set default selected course if they have any
      if (user && (user.role === "lecturer" || user.role === "Admin")) {
        const lecturerCourses = coursesData.filter((c) => c.lecturer === user.id)
        if (lecturerCourses.length > 0) {
          setSelectedCourse(lecturerCourses[0].id)
        }
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
      const courseTimetables = timetables.filter((t) => t.course === courseId)
      const totalClasses = courseTimetables.length

      // Get unique students in this course
      const course = courses.find((c) => c.id === courseId)
      const students = course?.students || []

      // Calculate attendance rate
      let totalAttendances = 0
      let presentAttendances = 0

      students.forEach((studentId) => {
        courseTimetables.forEach((timetable) => {
          totalAttendances++
          const record = attendanceData.find((r) => r.timetableId === timetable.id && r.studentId === studentId)
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
    if (selectedCourse && (user.role === "lecturer" || user.role === "Admin")) {
      fetchCourseAttendance(selectedCourse)
    }
  }, [selectedCourse])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>

      {user.role === "student" ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stats.totalClasses}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stats.attendedClasses}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Classes</TabsTrigger>
              <TabsTrigger value="present">Present</TabsTrigger>
              <TabsTrigger value="absent">Absent</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Records</CardTitle>
                  <CardDescription>Your attendance for all classes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
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
                            const timetable = timetables.find((t) => t.id === record.timetableId)
                            const course = courses.find((c) => c.id === timetable?.course)

                            return (
                              <TableRow key={record.id}>
                                <TableCell className="font-medium">
                                  {course ? (
                                    <Link href={`/dashboard/courses/${course.id}`} className="hover:underline">
                                      {course.name}
                                    </Link>
                                  ) : (
                                    "Unknown Course"
                                  )}
                                </TableCell>
                                <TableCell className="capitalize">
                                  {timetable ? (
                                    <Link href={`/dashboard/timetables/${timetable.id}`} className="hover:underline">
                                      {timetable.classType}
                                    </Link>
                                  ) : (
                                    "Unknown Class"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {timetable ? (
                                    <div className="flex flex-col">
                                      <span className="text-sm">
                                        {new Date(timetable.startTime).toLocaleDateString()}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(timetable.startTime).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`capitalize ${
                                      record.status === "present"
                                        ? "text-green-600"
                                        : record.status === "late"
                                          ? "text-amber-600"
                                          : "text-red-600"
                                    }`}
                                  >
                                    {record.status}
                                  </span>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
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
                  <CardTitle>Present Records</CardTitle>
                  <CardDescription>Classes where you were present</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
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
                              const timetable = timetables.find((t) => t.id === record.timetableId)
                              const course = courses.find((c) => c.id === timetable?.course)

                              return (
                                <TableRow key={record.id}>
                                  <TableCell className="font-medium">
                                    {course ? (
                                      <Link href={`/dashboard/courses/${course.id}`} className="hover:underline">
                                        {course.name}
                                      </Link>
                                    ) : (
                                      "Unknown Course"
                                    )}
                                  </TableCell>
                                  <TableCell className="capitalize">
                                    {timetable ? (
                                      <Link href={`/dashboard/timetables/${timetable.id}`} className="hover:underline">
                                        {timetable.classType}
                                      </Link>
                                    ) : (
                                      "Unknown Class"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {timetable ? (
                                      <div className="flex flex-col">
                                        <span className="text-sm">
                                          {new Date(timetable.startTime).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(timetable.startTime).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                    ) : (
                                      "-"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`capitalize ${
                                        record.status === "present" ? "text-green-600" : "text-amber-600"
                                      }`}
                                    >
                                      {record.status}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              )
                            })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
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
                  <CardTitle>Absent Records</CardTitle>
                  <CardDescription>Classes where you were absent</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
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
                              const timetable = timetables.find((t) => t.id === record.timetableId)
                              const course = courses.find((c) => c.id === timetable?.course)

                              return (
                                <TableRow key={record.id}>
                                  <TableCell className="font-medium">
                                    {course ? (
                                      <Link href={`/dashboard/courses/${course.id}`} className="hover:underline">
                                        {course.name}
                                      </Link>
                                    ) : (
                                      "Unknown Course"
                                    )}
                                  </TableCell>
                                  <TableCell className="capitalize">
                                    {timetable ? (
                                      <Link href={`/dashboard/timetables/${timetable.id}`} className="hover:underline">
                                        {timetable.classType}
                                      </Link>
                                    ) : (
                                      "Unknown Class"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {timetable ? (
                                      <div className="flex flex-col">
                                        <span className="text-sm">
                                          {new Date(timetable.startTime).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(timetable.startTime).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                    ) : (
                                      "-"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-red-600 capitalize">{record.status}</span>
                                  </TableCell>
                                </TableRow>
                              )
                            })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
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
          <div className="flex items-center space-x-4 mb-6">
            <Label htmlFor="courseSelect" className="whitespace-nowrap">
              Select Course:
            </Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger id="courseSelect" className="w-[250px]">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses
                  .filter((course) => user.role === "Admin" || course.lecturer === user.id)
                  .map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourse && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-7 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">{stats.totalClasses}</div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-7 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">
                        {courses.find((c) => c.id === selectedCourse)?.students?.length || 0}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-7 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Class Attendance Summary</CardTitle>
                  <CardDescription>
                    Attendance records for {courses.find((c) => c.id === selectedCourse)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
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
                              .filter((t) => t.course === selectedCourse)
                              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                              .map((timetable) => {
                                const timetableAttendance = attendanceRecords.filter(
                                  (r) => r.timetableId === timetable.id,
                                )
                                const presentCount = timetableAttendance.filter((r) => r.status === "present").length
                                const lateCount = timetableAttendance.filter((r) => r.status === "late").length
                                const absentCount = timetableAttendance.filter((r) => r.status === "absent").length
                                const totalStudents =
                                  courses.find((c) => c.id === selectedCourse)?.students?.length || 0
                                const attendanceRate =
                                  totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0

                                return (
                                  <TableRow key={timetable.id}>
                                    <TableCell className="font-medium capitalize">
                                      <Link href={`/dashboard/timetables/${timetable.id}`} className="hover:underline">
                                        {timetable.classType}
                                      </Link>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <div className="flex items-center">
                                          <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                                          <span className="text-sm">
                                            {new Date(timetable.startTime).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <div className="flex items-center">
                                          <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(timetable.startTime).toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-green-600">{presentCount}</TableCell>
                                    <TableCell className="text-amber-600">{lateCount}</TableCell>
                                    <TableCell className="text-red-600">{absentCount}</TableCell>
                                    <TableCell>{attendanceRate}%</TableCell>
                                  </TableRow>
                                )
                              })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Student Attendance Summary</CardTitle>
                  <CardDescription>
                    Individual student attendance for {courses.find((c) => c.id === selectedCourse)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
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
                          : courses
                              .find((c) => c.id === selectedCourse)
                              ?.students?.map((student) => {
                                const studentAttendance = attendanceRecords.filter((r) => r.studentId === student.id)
                                const presentCount = studentAttendance.filter((r) => r.status === "present").length
                                const lateCount = studentAttendance.filter((r) => r.status === "late").length
                                const absentCount = studentAttendance.filter((r) => r.status === "absent").length
                                const totalClasses = timetables.filter((t) => t.course === selectedCourse).length
                                const attendanceRate =
                                  totalClasses > 0 ? Math.round(((presentCount + lateCount) / totalClasses) * 100) : 0

                                return (
                                  <TableRow key={student.id}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center">
                                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {student.name}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-green-600">{presentCount}</TableCell>
                                    <TableCell className="text-amber-600">{lateCount}</TableCell>
                                    <TableCell className="text-red-600">{absentCount}</TableCell>
                                    <TableCell>{attendanceRate}%</TableCell>
                                  </TableRow>
                                )
                              })}
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

