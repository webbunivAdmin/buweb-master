"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { timetableService } from "@/lib/timetable-service"
import { courseService } from "@/lib/course-service"
import { attendanceService } from "@/lib/attendance-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Calendar,
  Clock,
  Edit,
  MapPin,
  QrCode,
  Trash,
  Users,
  Clipboard,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { eventService } from "@/lib/event-service"

export default function ClassDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [timetable, setTimetable] = useState(null)
  const [course, setCourse] = useState(null)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)
  const [isManageStudentsDialogOpen, setIsManageStudentsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    classType: "",
    startTime: "",
    endTime: "",
    location: "",
    repeatsWeekly: false,
    endDate: "",
    notes: "",
    isOnline: false,
    lecturer: "",
  })
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [availableStudents, setAvailableStudents] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [selectedClassReps, setSelectedClassReps] = useState([])
  const [attendanceMethod, setAttendanceMethod] = useState("qrcode")
  const [attendanceStatus, setAttendanceStatus] = useState({})
  const [lecturerTaught, setLecturerTaught] = useState(false)
  const [teachingNotes, setTeachingNotes] = useState("")

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const timetableData = await timetableService.getTimetable(id)
      setTimetable(timetableData)

      if (timetableData.course) {
        const courseData = await courseService.getCourse(timetableData.course)
        setCourse(courseData)
      }

      // Format form data for editing
      setFormData({
        classType: timetableData.classType || "",
        startTime: timetableData.startTime ? new Date(timetableData.startTime).toISOString().slice(0, 16) : "",
        endTime: timetableData.endTime ? new Date(timetableData.endTime).toISOString().slice(0, 16) : "",
        location: timetableData.location || "",
        repeatsWeekly: timetableData.repeatsWeekly || false,
        endDate: timetableData.endDate ? new Date(timetableData.endDate).toISOString().slice(0, 10) : "",
        notes: timetableData.notes || "",
        isOnline: timetableData.isOnline || false,
        lecturer: timetableData.lecturer || "",
      })

      // Set selected students and class reps
      setSelectedStudents(timetableData.students || [])
      setSelectedClassReps(timetableData.classRepresentatives || [])

      // Set lecturer taught status
      setLecturerTaught(timetableData.lecturerTaught || false)
      setTeachingNotes(timetableData.teachingNotes || "")

      // Generate QR code URL
      setQrCodeUrl(`${window.location.origin}/attendance/${id}`)

      // Fetch attendance records if available
      if (timetableData.course) {
        try {
          const attendanceData = await attendanceService.getCourseAttendance(timetableData.course)
          // Filter for this specific timetable
          const filteredAttendance = attendanceData.filter((record) => record.timetableId === id)
          setAttendanceRecords(filteredAttendance)

          // Create a map of student IDs to attendance status
          const statusMap = {}
          filteredAttendance.forEach((record) => {
            statusMap[record.studentId] = record.status
          })
          setAttendanceStatus(statusMap)
        } catch (error) {
          console.error("Error fetching attendance records:", error)
        }
      }

      // Mock student data - in a real app, you would fetch this from your API
      const mockStudents = [
        { id: "s1", name: "John Doe", email: "john@example.com", registrationNumber: "S12345" },
        { id: "s2", name: "Jane Smith", email: "jane@example.com", registrationNumber: "S12346" },
        { id: "s3", name: "Bob Johnson", email: "bob@example.com", registrationNumber: "S12347" },
        { id: "s4", name: "Alice Williams", email: "alice@example.com", registrationNumber: "S12348" },
        { id: "s5", name: "Charlie Brown", email: "charlie@example.com", registrationNumber: "S12349" },
      ]

      setAvailableStudents(mockStudents)
    } catch (error) {
      console.error("Error fetching class details:", error)
      toast.error("Failed to load class details")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })

    // If removing a student, also remove them as class rep if they are one
    if (selectedStudents.includes(studentId) && selectedClassReps.includes(studentId)) {
      setSelectedClassReps((prev) => prev.filter((id) => id !== studentId))
    }
  }

  const toggleClassRepSelection = (studentId) => {
    setSelectedClassReps((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  const handleUpdateClass = async (e) => {
    e.preventDefault()

    if (!formData.classType || !formData.startTime || !formData.endTime || !formData.location) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const updatedTimetable = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        students: selectedStudents,
        classRepresentatives: selectedClassReps,
      }

      await timetableService.updateTimetable(id, updatedTimetable)

      // Update calendar event if it exists
      try {
        // In a real app, you would fetch the event ID associated with this timetable
        // and update it, or create a new one if it doesn't exist
        const eventData = {
          title: `${course.name} - ${formData.classType.charAt(0).toUpperCase() + formData.classType.slice(1)}`,
          description: formData.notes || `${course.code} ${formData.classType}`,
          location: formData.location,
          startTime: formData.startTime,
          endTime: formData.endTime,
          allDay: false,
          repeatsWeekly: formData.repeatsWeekly,
          endDate: formData.endDate,
          metadata: {
            timetableId: id,
            courseId: course.id,
            classType: formData.classType,
            isOnline: formData.isOnline,
          },
        }

        // This is a simplified approach - in a real app, you would update the existing event
        await eventService.updateEvent(eventData)
      } catch (error) {
        console.error("Error updating calendar event:", error)
        // Continue even if event update fails
      }

      toast.success("Class updated successfully")
      setIsEditDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error updating class:", error)
      toast.error("Failed to update class")
    }
  }

  const handleDeleteClass = async () => {
    try {
      await timetableService.deleteTimetable(id)

      // Delete associated calendar event
      try {
        // In a real app, you would fetch the event ID associated with this timetable
        // and delete it
        await eventService.deleteEvent(id)
      } catch (error) {
        console.error("Error deleting calendar event:", error)
        // Continue even if event deletion fails
      }

      toast.success("Class deleted successfully")
      router.push("/dashboard/classes")
    } catch (error) {
      console.error("Error deleting class:", error)
      toast.error("Failed to delete class")
    }
  }

  const handleMarkAttendance = async (studentId, status) => {
    try {
      await attendanceService.markAttendance({
        timetableId: id,
        studentId,
        status,
        remarks: `Marked by ${user.name} (${user.role})`,
      })

      // Update local state
      setAttendanceStatus((prev) => ({
        ...prev,
        [studentId]: status,
      }))

      toast.success(`Attendance marked as ${status} for student`)
      fetchData()
    } catch (error) {
      console.error("Error marking attendance:", error)
      toast.error("Failed to mark attendance")
    }
  }

  const handleBulkAttendance = async (status) => {
    try {
      // Create an array of promises for each student
      const promises = selectedStudents.map((studentId) =>
        attendanceService.markAttendance({
          timetableId: id,
          studentId,
          status,
          remarks: `Bulk marked by ${user.name} (${user.role})`,
        }),
      )

      await Promise.all(promises)

      // Update local state
      const newStatus = {}
      selectedStudents.forEach((studentId) => {
        newStatus[studentId] = status
      })

      setAttendanceStatus((prev) => ({
        ...prev,
        ...newStatus,
      }))

      toast.success(`Attendance marked as ${status} for all students`)
      fetchData()
    } catch (error) {
      console.error("Error marking bulk attendance:", error)
      toast.error("Failed to mark attendance")
    }
  }

  const handleUpdateStudents = async () => {
    try {
      await timetableService.updateTimetable(id, {
        students: selectedStudents,
        classRepresentatives: selectedClassReps,
      })

      toast.success("Students updated successfully")
      setIsManageStudentsDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error updating students:", error)
      toast.error("Failed to update students")
    }
  }

  const handleMarkLecturerTaught = async () => {
    try {
      await timetableService.updateTimetable(id, {
        lecturerTaught: true,
        teachingNotes: teachingNotes,
      })

      setLecturerTaught(true)
      toast.success("Class marked as taught")
      fetchData()
    } catch (error) {
      console.error("Error marking class as taught:", error)
      toast.error("Failed to mark class as taught")
    }
  }

  const isLecturer = user && (user.role === "admin" || user.role === "lecturer") && timetable?.lecturer === user.id
  const isClassRep = user && user.role === "student" && timetable?.classRepresentatives?.includes(user.id)
  const canEdit = user && (user.role === "admin" || isLecturer)
  const canTakeAttendance = canEdit || isClassRep
  const canManageStudents = user && (user.role === "admin" || isLecturer)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!timetable) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Class not found</p>
      </div>
    )
  }

  const isPast = new Date(timetable.endTime) < new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {course?.name || "Unnamed Course"} - <span className="capitalize">{timetable.classType}</span>
          </h1>
          <p className="text-muted-foreground">
            {course?.code} •{" "}
            {timetable.isOnline ? <Badge variant="outline">Online Class</Badge> : <span>In-person Class</span>}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Class
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <form onSubmit={handleUpdateClass}>
                  <DialogHeader>
                    <DialogTitle>Edit Class</DialogTitle>
                    <DialogDescription>Make changes to the class details.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="classType">Class Type*</Label>
                        <Select
                          name="classType"
                          value={formData.classType}
                          onValueChange={(value) => handleSelectChange("classType", value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select class type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lecture">Lecture</SelectItem>
                            <SelectItem value="tutorial">Tutorial</SelectItem>
                            <SelectItem value="lab">Lab</SelectItem>
                            <SelectItem value="seminar">Seminar</SelectItem>
                            <SelectItem value="workshop">Workshop</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lecturer">Lecturer*</Label>
                        <Select
                          name="lecturer"
                          value={formData.lecturer}
                          onValueChange={(value) => handleSelectChange("lecturer", value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select lecturer" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* In a real app, you would fetch lecturers from your API */}
                            <SelectItem value="l1">Dr. Smith</SelectItem>
                            <SelectItem value="l2">Prof. Johnson</SelectItem>
                            <SelectItem value="l3">Dr. Williams</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time*</Label>
                        <Input
                          id="startTime"
                          name="startTime"
                          type="datetime-local"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time*</Label>
                        <Input
                          id="endTime"
                          name="endTime"
                          type="datetime-local"
                          value={formData.endTime}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location*</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Room number or online link"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="repeatsWeekly"
                          name="repeatsWeekly"
                          checked={formData.repeatsWeekly}
                          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, repeatsWeekly: checked }))}
                        />
                        <Label htmlFor="repeatsWeekly">This class repeats weekly</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isOnline"
                          name="isOnline"
                          checked={formData.isOnline}
                          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isOnline: checked }))}
                        />
                        <Label htmlFor="isOnline">This is an online class</Label>
                      </div>
                    </div>

                    {formData.repeatsWeekly && (
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          name="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Input
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Additional information about this class"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this class and all associated attendance
                    records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteClass}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
            {course && (
              <CardDescription>
                <Link href={`/dashboard/courses/${course.id}`} className="hover:underline">
                  {course.code}
                </Link>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(timetable.startTime).toLocaleDateString()}
                {timetable.repeatsWeekly && " (Weekly)"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(timetable.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                {new Date(timetable.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{timetable.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{timetable.students?.length || 0} students enrolled</span>
            </div>
            {timetable.notes && (
              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium mb-1">Notes</h4>
                <p className="text-sm text-muted-foreground">{timetable.notes}</p>
              </div>
            )}
            {lecturerTaught && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Class taught by lecturer</span>
              </div>
            )}
          </CardContent>
          {isLecturer && !lecturerTaught && (
            <CardFooter className="flex-col space-y-2">
              <div className="w-full">
                <Label htmlFor="teachingNotes">Teaching Notes</Label>
                <Input
                  id="teachingNotes"
                  value={teachingNotes}
                  onChange={(e) => setTeachingNotes(e.target.value)}
                  placeholder="Add notes about what was covered in class"
                  className="mt-1"
                />
              </div>
              <Button className="w-full" onClick={handleMarkLecturerTaught}>
                <Clipboard className="mr-2 h-4 w-4" />
                Mark as Taught
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
            <CardDescription>{attendanceRecords.length} records for this class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-md">
                  <span className="text-2xl font-bold">
                    {attendanceRecords.filter((record) => record.status === "present").length}
                  </span>
                  <span className="text-sm text-muted-foreground">Present</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-md">
                  <span className="text-2xl font-bold">
                    {attendanceRecords.filter((record) => record.status === "late").length}
                  </span>
                  <span className="text-sm text-muted-foreground">Late</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-md">
                  <span className="text-2xl font-bold">
                    {attendanceRecords.filter((record) => record.status === "absent").length}
                  </span>
                  <span className="text-sm text-muted-foreground">Absent</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Attendance Rate</span>
                <span className="text-sm font-medium">
                  {timetable.students?.length
                    ? Math.round(
                        (attendanceRecords.filter((record) => record.status === "present" || record.status === "late")
                          .length /
                          timetable.students.length) *
                          100,
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{
                    width: `${
                      timetable.students?.length
                        ? Math.round(
                            (attendanceRecords.filter(
                              (record) => record.status === "present" || record.status === "late",
                            ).length /
                              timetable.students.length) *
                              100,
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
          {canTakeAttendance && !isPast && (
            <CardFooter>
              <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <QrCode className="mr-2 h-4 w-4" />
                    Take Attendance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Take Attendance</DialogTitle>
                    <DialogDescription>Choose a method to record attendance for this class.</DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue={attendanceMethod} onValueChange={setAttendanceMethod} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="qrcode">QR Code</TabsTrigger>
                      <TabsTrigger value="manual">Manual</TabsTrigger>
                      <TabsTrigger value="bulk">Bulk</TabsTrigger>
                    </TabsList>
                    <TabsContent value="qrcode" className="space-y-4 pt-4">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-white p-4 rounded-md">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                            alt="Attendance QR Code"
                            width={200}
                            height={200}
                          />
                        </div>
                        <p className="mt-4 text-sm text-center text-muted-foreground">
                          Students should scan this QR code to mark their attendance for this class.
                        </p>
                      </div>
                      <div className="flex justify-center">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            navigator.clipboard.writeText(qrCodeUrl)
                            toast.success("Link copied to clipboard")
                          }}
                        >
                          Copy Link
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="manual" className="space-y-4 pt-4">
                      <div className="rounded-md border max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {timetable.students?.length > 0 ? (
                              timetable.students.map((studentId) => {
                                const student = availableStudents.find((s) => s.id === studentId)
                                const status = attendanceStatus[studentId]

                                return (
                                  <TableRow key={studentId}>
                                    <TableCell className="font-medium">{student?.name || "Unknown Student"}</TableCell>
                                    <TableCell>
                                      {status ? (
                                        <span
                                          className={`capitalize ${
                                            status === "present"
                                              ? "text-green-600"
                                              : status === "late"
                                                ? "text-amber-600"
                                                : "text-red-600"
                                          }`}
                                        >
                                          {status}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">Not recorded</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Select
                                        value={status || ""}
                                        onValueChange={(value) => handleMarkAttendance(studentId, value)}
                                      >
                                        <SelectTrigger className="w-[130px]">
                                          <SelectValue placeholder="Mark" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="present">Present</SelectItem>
                                          <SelectItem value="late">Late</SelectItem>
                                          <SelectItem value="absent">Absent</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                  </TableRow>
                                )
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                  No students enrolled in this class
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    <TabsContent value="bulk" className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Mark attendance for all students at once. This is useful for quickly recording attendance.
                      </p>
                      <div className="flex justify-center space-x-4">
                        <Button
                          variant="outline"
                          className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                          onClick={() => handleBulkAttendance("present")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          All Present
                        </Button>
                        <Button
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          onClick={() => handleBulkAttendance("late")}
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          All Late
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          onClick={() => handleBulkAttendance("absent")}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          All Absent
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </CardFooter>
          )}
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Students</h2>
        {canManageStudents && (
          <Dialog open={isManageStudentsDialogOpen} onOpenChange={setIsManageStudentsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Manage Students
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Manage Students</DialogTitle>
                <DialogDescription>
                  Add or remove students from this class and designate class representatives.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                  {availableStudents.length > 0 ? (
                    availableStudents.map((student) => (
                      <div key={student.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`student-${student.id}`}
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                        <Label htmlFor={`student-${student.id}`} className="flex-1">
                          {student.name} ({student.registrationNumber})
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`rep-${student.id}`}
                            checked={selectedClassReps.includes(student.id)}
                            onCheckedChange={() => toggleClassRepSelection(student.id)}
                            disabled={!selectedStudents.includes(student.id)}
                          />
                          <Label htmlFor={`rep-${student.id}`} className="text-sm">
                            Class Rep
                          </Label>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No students available</p>
                  )}
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedStudents.length} students selected, {selectedClassReps.length} class representatives
                  </p>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setSelectedClassReps([])}>
                      Clear Reps
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedStudents([])}>
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleUpdateStudents}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
          <CardDescription>
            {timetable.students?.length || 0} students in this class, {timetable.classRepresentatives?.length || 0}{" "}
            class representatives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {timetable.students?.length > 0 ? (
              timetable.students.map((studentId) => {
                const student = availableStudents.find((s) => s.id === studentId)
                const isClassRep = timetable.classRepresentatives?.includes(studentId)
                const status = attendanceStatus[studentId]

                return (
                  <div key={studentId} className="flex items-center space-x-3 p-3 border rounded-md">
                    <Avatar>
                      <AvatarFallback>{student?.name?.charAt(0) || "S"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{student?.name || "Unknown Student"}</p>
                      <p className="text-sm text-muted-foreground truncate">{student?.registrationNumber || "No ID"}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      {isClassRep && (
                        <Badge variant="outline" className="mb-1">
                          Class Rep
                        </Badge>
                      )}
                      {status && (
                        <span
                          className={`text-xs capitalize ${
                            status === "present"
                              ? "text-green-600"
                              : status === "late"
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {status}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-6 text-muted-foreground">
                No students enrolled in this class
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {canTakeAttendance && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>Manage attendance for this class session</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All Students</TabsTrigger>
                <TabsTrigger value="present">Present</TabsTrigger>
                <TabsTrigger value="absent">Absent</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timetable.students?.length > 0 ? (
                        timetable.students.map((studentId) => {
                          const student = availableStudents.find((s) => s.id === studentId)
                          const attendanceRecord = attendanceRecords.find((record) => record.studentId === studentId)

                          return (
                            <TableRow key={studentId}>
                              <TableCell className="font-medium">{student?.name || "Unknown Student"}</TableCell>
                              <TableCell>
                                {attendanceRecord ? (
                                  <span
                                    className={`capitalize ${
                                      attendanceRecord.status === "present"
                                        ? "text-green-600"
                                        : attendanceRecord.status === "late"
                                          ? "text-amber-600"
                                          : "text-red-600"
                                    }`}
                                  >
                                    {attendanceRecord.status}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">Not recorded</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {attendanceRecord?.createdAt
                                  ? new Date(attendanceRecord.createdAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Select
                                  value={attendanceRecord?.status || ""}
                                  onValueChange={(value) => handleMarkAttendance(studentId, value)}
                                >
                                  <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Mark attendance" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="late">Late</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No students enrolled in this course
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="present">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.filter((record) => record.status === "present" || record.status === "late")
                        .length > 0 ? (
                        attendanceRecords
                          .filter((record) => record.status === "present" || record.status === "late")
                          .map((record) => {
                            const student = availableStudents.find((s) => s.id === record.studentId)

                            return (
                              <TableRow key={record.id}>
                                <TableCell className="font-medium">{student?.name || "Unknown Student"}</TableCell>
                                <TableCell>
                                  <span
                                    className={`capitalize ${
                                      record.status === "present" ? "text-green-600" : "text-amber-600"
                                    }`}
                                  >
                                    {record.status}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {record.createdAt
                                    ? new Date(record.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Select
                                    value={record.status}
                                    onValueChange={(value) => handleMarkAttendance(record.studentId, value)}
                                  >
                                    <SelectTrigger className="w-[130px]">
                                      <SelectValue placeholder="Mark attendance" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="present">Present</SelectItem>
                                      <SelectItem value="late">Late</SelectItem>
                                      <SelectItem value="absent">Absent</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            )
                          })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No present students recorded
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="absent">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.filter((record) => record.status === "absent").length > 0 ? (
                        attendanceRecords
                          .filter((record) => record.status === "absent")
                          .map((record) => {
                            const student = availableStudents.find((s) => s.id === record.studentId)

                            return (
                              <TableRow key={record.id}>
                                <TableCell className="font-medium">{student?.name || "Unknown Student"}</TableCell>
                                <TableCell>
                                  <span className="text-red-600 capitalize">{record.status}</span>
                                </TableCell>
                                <TableCell>
                                  {record.createdAt
                                    ? new Date(record.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Select
                                    value={record.status}
                                    onValueChange={(value) => handleMarkAttendance(record.studentId, value)}
                                  >
                                    <SelectTrigger className="w-[130px]">
                                      <SelectValue placeholder="Mark attendance" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="present">Present</SelectItem>
                                      <SelectItem value="late">Late</SelectItem>
                                      <SelectItem value="absent">Absent</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            )
                          })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No absent students recorded
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

