"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { courseService } from "@/lib/course-service"
import { timetableService } from "@/lib/timetable-service"
import { attendanceService } from "@/lib/attendance-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AttendanceChart } from "@/components/analytics/attendance-chart"
import { CourseComparisonChart } from "@/components/analytics/course-comparison-chart"
import { StudentPerformanceChart } from "@/components/analytics/student-performance-chart"
import { Calendar, GraduationCap, Users } from "lucide-react"

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [timetables, setTimetables] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalClasses: 0,
    overallAttendanceRate: 0,
  })

  // Prepare data for charts
  const [attendanceChartData, setAttendanceChartData] = useState([])
  const [courseComparisonData, setCourseComparisonData] = useState([])
  const [studentPerformanceData, setStudentPerformanceData] = useState([])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [coursesData, timetablesData] = await Promise.all([
        courseService.getAllCourses(),
        timetableService.getAllTimetables(),
      ])

      setCourses(coursesData)
      setTimetables(timetablesData)

      // Fetch attendance data for all courses
      const allAttendanceData = []
      for (const course of coursesData) {
        try {
          const courseAttendance = await attendanceService.getCourseAttendance(course.id)
          allAttendanceData.push(...courseAttendance)
        } catch (error) {
          console.error(`Error fetching attendance for course ${course.id}:`, error)
        }
      }

      setAttendanceRecords(allAttendanceData)

      // Calculate overall stats
      const uniqueStudents = new Set()
      coursesData.forEach((course) => {
        if (course.students) {
          course.students.forEach((student) => uniqueStudents.add(student))
        }
      })

      let totalAttendances = 0
      let presentAttendances = 0

      allAttendanceData.forEach((record) => {
        totalAttendances++
        if (record.status === "present" || record.status === "late") {
          presentAttendances++
        }
      })

      setStats({
        totalCourses: coursesData.length,
        totalStudents: uniqueStudents.size,
        totalClasses: timetablesData.length,
        overallAttendanceRate: totalAttendances > 0 ? Math.round((presentAttendances / totalAttendances) * 100) : 0,
      })

      // Prepare data for attendance chart
      const attendanceByDate = []

      for (const course of coursesData) {
        const courseAttendance = allAttendanceData.filter((record) => {
          const timetable = timetablesData.find((t) => t.id === record.timetableId)
          return timetable && timetable.course === course.id
        })

        // Group by date
        const dateGroups = {}

        courseAttendance.forEach((record) => {
          const timetable = timetablesData.find((t) => t.id === record.timetableId)
          if (!timetable) return

          const date = new Date(timetable.startTime).toLocaleDateString()

          if (!dateGroups[date]) {
            dateGroups[date] = {
              present: 0,
              late: 0,
              absent: 0,
              total: 0,
            }
          }

          dateGroups[date].total++
          if (record.status === "present") dateGroups[date].present++
          else if (record.status === "late") dateGroups[date].late++
          else if (record.status === "absent") dateGroups[date].absent++
        })

        const courseData = {
          courseId: course.id,
          courseName: course.name,
          attendanceData: Object.entries(dateGroups).map(([date, data]) => ({
            date,
            ...data,
          })),
        }

        attendanceByDate.push(courseData)
      }

      setAttendanceChartData(attendanceByDate)

      // Prepare data for course comparison chart
      const courseComparison = coursesData.map((course) => {
        const courseAttendance = allAttendanceData.filter((record) => {
          const timetable = timetablesData.find((t) => t.id === record.timetableId)
          return timetable && timetable.course === course.id
        })

        const totalAttendances = courseAttendance.length
        const presentAttendances = courseAttendance.filter(
          (record) => record.status === "present" || record.status === "late",
        ).length

        return {
          name: course.name,
          attendanceRate: totalAttendances > 0 ? Math.round((presentAttendances / totalAttendances) * 100) : 0,
          studentCount: course.students?.length || 0,
        }
      })

      setCourseComparisonData(courseComparison)

      // Prepare data for student performance chart
      const studentPerformance = []

      for (const course of coursesData) {
        const courseTimetables = timetablesData.filter((t) => t.course === course.id)
        const students = course.students || []

        const studentData = students.map((student) => {
          let totalClasses = 0
          let attendedClasses = 0

          courseTimetables.forEach((timetable) => {
            totalClasses++
            const record = allAttendanceData.find((r) => r.timetableId === timetable.id && r.studentId === student.id)

            if (record && (record.status === "present" || record.status === "late")) {
              attendedClasses++
            }
          })

          return {
            id: student.id,
            name: student.name,
            attendanceRate: totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0,
          }
        })

        studentPerformance.push({
          courseId: course.id,
          courseName: course.name,
          students: studentData,
        })
      }

      setStudentPerformanceData(studentPerformance)
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user && (user.role === "Admin" || user.role === "lecturer")) {
      fetchData()
    }
  }, [user])

  if (!user || (user.role !== "Admin" && user.role !== "lecturer")) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">You don't have permission to view analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.overallAttendanceRate}%</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance">Attendance Trends</TabsTrigger>
          <TabsTrigger value="courses">Course Comparison</TabsTrigger>
          <TabsTrigger value="students">Student Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ) : attendanceChartData.length > 0 ? (
            <AttendanceChart data={attendanceChartData} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No attendance data available
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="courses" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ) : courseComparisonData.length > 0 ? (
            <CourseComparisonChart data={courseComparisonData} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No course comparison data available
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="students" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ) : studentPerformanceData.length > 0 ? (
            <StudentPerformanceChart data={studentPerformanceData} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No student performance data available
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

