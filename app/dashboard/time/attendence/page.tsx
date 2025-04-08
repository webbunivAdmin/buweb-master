"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { attendanceService } from "@/lib/attendance-service"
import { courseService } from "@/lib/course-service"
import { timetableService } from "@/lib/timetable-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Calendar, Check, Clock, X } from 'lucide-react'
import { toast } from "sonner"
import Link from "next/link"
import { AttendanceChart } from "@/components/timetable/attendance-chart"

export default function AttendancePage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [timetables, setTimetables] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedTimetable, setSelectedTimetable] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("summary")
  const [attendanceSummary, setAttendanceSummary] = useState<any>({})

  const isAdmin = user?.role === "admin" || user?.role === "faculty"
  const isStudent = user?.role === "student"

  // Fetch courses and timetables
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Fetch courses
        const coursesData = await courseService.getAllCourses()
        setCourses(coursesData)

        // Fetch timetables
        const timetablesData = await timetableService.getAllTimetables()
        setTimetables(timetablesData)

        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load data")
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Fetch attendance records when course or timetable changes
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user) return

      if (selectedCourse) {
        setLoading(true)
        try {
          // Fetch attendance for the selected course
          const attendanceData = await attendanceService.getCourseAttendance(selectedCourse)
          setAttendanceRecords(attendanceData)

          // Calculate attendance summary
          calculateAttendanceSummary(attendanceData)
        } catch (error) {
          console.error("Error fetching attendance:", error)
          toast.error("Failed to load attendance data")
        } finally {
          setLoading(false)
        }
      } else if (selectedTimetable) {
        setLoading(true)
        try {
          // For students, fetch their own attendance for the timetable
          if (isStudent) {
            const attendanceData = await attendanceService.getAttendanceByTimetable(selectedTimetable, user.id)
            setAttendanceRecords([attendanceData])
          } else {
            // For admin/faculty, fetch all attendance records for the timetable
            // This would typically be a different API endpoint, but we'll simulate it
            const timetable = timetables.find(t => t._id === selectedTimetable)
            if (timetable && timetable.students) {
              // Fetch attendance for each student
              const promises = timetable.students.map((studentId: string) => 
                attendanceService.getAttendanceByTimetable(selectedTimetable, studentId)
              )
              const results = await Promise.all(promises)
              setAttendanceRecords(results.flat())
            }
          }
        } catch (error) {
          console.error("Error fetching attendance:", error)
          toast.error("Failed to load attendance data")
        } finally {
          setLoading(false)
        }
      }
    }

    if (selectedCourse || selectedTimetable) {
      fetchAttendance()
    }
  }, [user, selectedCourse, selectedTimetable, isStudent, timetables])

  // Calculate attendance summary from records
  const calculateAttendanceSummary = (records: any[]) => {
    // Group records by student
    const studentRecords: Record<string, any[]> = {}
    
    records.forEach(record => {
      if (!studentRecords[record.student]) {
        studentRecords[record.student] = []
      }
      studentRecords[record.student].push(record)
    })
    
    // Calculate summary for each student
    const summary: Record<string, any> = {}
    
    Object.entries(studentRecords).forEach(([studentId, records]) => {
      const total = records.length
      const present = records.filter(r => r.status === 'present').length
      const late = records.filter(r => r.status === 'late').length
      const absent = records.filter(r => r.status === 'absent').length
      
      const presentPercentage = Math.round((present / total) * 100)
      const latePercentage = Math.round((late / total) * 100)
      const absentPercentage = Math.round((absent / total) * 100)
      
      summary[studentId] = {
        total,
        present,
        late,
        absent,
        presentPercentage,
        latePercentage,
        absentPercentage,
        studentName: records[0]?.studentName || 'Unknown Student'
      }
    })
    
    setAttendanceSummary(summary)
  }

  // Filter records based on search query
  const filteredRecords = searchQuery
    ? attendanceRecords.filter(record => 
        record.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.timetableName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : attendanceRecords

  // Format date (e.g., "Mon, Apr 5, 2023")
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500">Present</Badge>
      case 'late':
        return <Badge className="bg-yellow-500">Late</Badge>
      case 'absent':
        return <Badge className="bg-red-500">Absent</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <Check className="h-4 w-4 text-green-500" />
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'absent':
        return <X className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  // Export attendance data as CSV
  const exportAttendance = () => {
    if (attendanceRecords.length === 0) {
      toast.error("No attendance data to export")
      return
    }
    
    // Create CSV content
    let csvContent = "Student,Date,Status,Remarks\n"
    
    attendanceRecords.forEach(record => {
      const row = [
        record.studentName || 'Unknown',
        new Date(record.date).toLocaleDateString(),
        record.status,
        record.remarks || ''
      ]
      
      // Escape commas and quotes in fields
      const escapedRow = row.map(field => {
        const escaped = field.toString().replace(/"/g, '""')
        return `"${escaped}"`
      })
      
      csvContent += escapedRow.join(',') + '\n'
    })
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success("Attendance data exported successfully")
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Attendance</h1>
        
        {attendanceRecords.length > 0 && (
          <Button variant="outline" onClick={exportAttendance}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="course">Course</Label>
                  <Select 
                    value={selectedCourse} 
                    onValueChange={(value) => {
                      setSelectedCourse(value)
                      setSelectedTimetable("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timetable">Class</Label>
                  <Select 
                    value={selectedTimetable} 
                    onValueChange={(value) => {
                      setSelectedTimetable(value)
                      setSelectedCourse("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {timetables.map((timetable) => {
                        const course = courses.find(c => c._id === timetable.course)
                        return (
                          <SelectItem key={timetable._id} value={timetable._id}>
                            {course?.code || 'Unknown'} - {timetable.classType} ({formatDate(timetable.startTime)})
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                  <CardDescription>Overview of attendance for all students</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : Object.keys(attendanceSummary).length > 0 ? (
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
                          {Object.entries(attendanceSummary).map(([studentId, data]: [string, any]) => (
                            <TableRow key={studentId}>
                              <TableCell className="font-medium">{data.studentName}</TableCell>
                              <TableCell>{data.present} ({data.presentPercentage}%)</TableCell>
                              <TableCell>{data.late} ({data.latePercentage}%)</TableCell>
                              <TableCell>{data.absent} ({data.absentPercentage}%)</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={data.presentPercentage + data.latePercentage} className="h-2 w-full" />
                                  <span className="text-sm">{data.presentPercentage + data.latePercentage}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Attendance Data</h3>
                      <p className="text-muted-foreground mb-4">
                        Select a course or class to view attendance data
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="records">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Records</CardTitle>
                  <CardDescription>Detailed attendance records for all classes</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredRecords.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRecords.map((record) => (
                            <TableRow key={record._id}>
                              <TableCell className="font-medium">{record.studentName}</TableCell>
                              <TableCell>{formatDate(record.date)}</TableCell>
                              <TableCell>{record.timetableName || 'Unknown Class'}</TableCell>
                              <TableCell>{getStatusBadge(record.status)}</TableCell>
                              <TableCell>{record.remarks || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Attendance Records</h3>
                      <p className="text-muted-foreground mb-4">
                        No attendance records found for the selected filters
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="chart">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Chart</CardTitle>
                  <CardDescription>Visual representation of attendance data</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : Object.keys(attendanceSummary).length > 0 ? (
                    <AttendanceChart data={attendanceSummary} />
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Chart Data</h3>
                      <p className="text-muted-foreground mb-4">
                        Select a course or class to view attendance charts
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Label component for the page
function Label({ htmlFor, children }: { htmlFor?: string, children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block"
    >
      {children}
    </label>
  )
}
