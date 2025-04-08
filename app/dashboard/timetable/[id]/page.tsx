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
import { Calendar, Clock, Edit, MapPin, QrCode, Trash, Users } from "lucide-react"
import Link from "next/link"

export default function TimetableDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [timetable, setTimetable] = useState(null)
  const [course, setCourse] = useState(null)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    classType: "",
    startTime: "",
    endTime: "",
    location: "",
    repeatsWeekly: false,
    endDate: "",
  })
  const [qrCodeUrl, setQrCodeUrl] = useState("")

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
      })

      // Generate QR code URL
      setQrCodeUrl(`${window.location.origin}/attendance/${id}`)

      // Fetch attendance records if available
      if (timetableData.course) {
        try {
          const attendanceData = await attendanceService.getCourseAttendance(timetableData.course)
          // Filter for this specific timetable
          const filteredAttendance = attendanceData.filter((record) => record.timetableId === id)
          setAttendanceRecords(filteredAttendance)
        } catch (error) {
          console.error("Error fetching attendance records:", error)
        }
      }
    } catch (error) {
      console.error("Error fetching timetable details:", error)
      toast.error("Failed to load timetable details")
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

  const handleUpdateTimetable = async (e) => {
    e.preventDefault()

    if (!formData.classType || !formData.startTime || !formData.endTime || !formData.location) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      await timetableService.updateTimetable(id, {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      })

      toast.success("Class updated successfully")
      setIsEditDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error updating timetable:", error)
      toast.error("Failed to update class")
    }
  }

  const handleDeleteTimetable = async () => {
    try {
      await timetableService.deleteTimetable(id)
      toast.success("Class deleted successfully")
      router.push("/dashboard/timetables")
    } catch (error) {
      console.error("Error deleting timetable:", error)
      toast.error("Failed to delete class")
    }
  }

  const handleMarkAttendance = async (studentId, status) => {
    try {
      await attendanceService.markAttendance({
        timetableId: id,
        studentId,
        status,
      })

      toast.success("Attendance marked successfully")
      fetchData()
    } catch (error) {
      console.error("Error marking attendance:", error)
      toast.error("Failed to mark attendance")
    }
  }

  const isLecturer = user && (user.role === "Admin" || user.role === "lecturer") && timetable?.lecturer === user.id
  const isClassRep = user && user.role === "Student" && timetable?.classRepresentatives?.includes(user.id)
  const canEdit = user && (user.role === "Admin" || isLecturer)
  const canTakeAttendance = canEdit || isClassRep

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
        <p className="text-muted-foreground">Timetable not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {course?.name || "Unnamed Course"} - <span className="capitalize">{timetable.classType}</span>
        </h1>
        {canEdit && (
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleUpdateTimetable}>
                  <DialogHeader>
                    <DialogTitle>Edit Class</DialogTitle>
                    <DialogDescription>Make changes to the class details.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="classType" className="text-right">
                        Class Type*
                      </Label>
                      <Select
                        name="classType"
                        value={formData.classType}
                        onValueChange={(value) => handleSelectChange("classType", value)}
                        required
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select class type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lecture">Lecture</SelectItem>
                          <SelectItem value="tutorial">Tutorial</SelectItem>
                          <SelectItem value="lab">Lab</SelectItem>
                          <SelectItem value="seminar">Seminar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="startTime" className="text-right">
                        Start Time*
                      </Label>
                      <Input
                        id="startTime"
                        name="startTime"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="endTime" className="text-right">
                        End Time*
                      </Label>
                      <Input
                        id="endTime"
                        name="endTime"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="location" className="text-right">
                        Location*
                      </Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="col-span-3"
                        placeholder="Room number or online link"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="repeatsWeekly" className="text-right">
                        Repeats Weekly
                      </Label>
                      <div className="col-span-3 flex items-center space-x-2">
                        <input
                          id="repeatsWeekly"
                          name="repeatsWeekly"
                          type="checkbox"
                          checked={formData.repeatsWeekly}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="repeatsWeekly" className="text-sm font-normal">
                          This class repeats weekly
                        </Label>
                      </div>
                    </div>
                    {formData.repeatsWeekly && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endDate" className="text-right">
                          End Date
                        </Label>
                        <Input
                          id="endDate"
                          name="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={handleInputChange}
                          className="col-span-3"
                        />
                      </div>
                    )}
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
                  <AlertDialogAction onClick={handleDeleteTimetable}>Delete</AlertDialogAction>
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
              <span>{course?.students?.length || 0} students enrolled</span>
            </div>
          </CardContent>
          {canTakeAttendance && (
            <CardFooter>
              <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <QrCode className="mr-2 h-4 w-4" />
                    Take Attendance
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Attendance QR Code</DialogTitle>
                    <DialogDescription>Students can scan this QR code to mark their attendance.</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center justify-center p-4">
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
                  <DialogFooter className="sm:justify-center">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(qrCodeUrl)
                        toast.success("Link copied to clipboard")
                      }}
                    >
                      Copy Link
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                  {course?.students?.length
                    ? Math.round(
                        (attendanceRecords.filter((record) => record.status === "present" || record.status === "late")
                          .length /
                          course.students.length) *
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
                      course?.students?.length
                        ? Math.round(
                            (attendanceRecords.filter(
                              (record) => record.status === "present" || record.status === "late",
                            ).length /
                              course.students.length) *
                              100,
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                      {course?.students?.length > 0 ? (
                        course.students.map((student) => {
                          const attendanceRecord = attendanceRecords.find((record) => record.studentId === student.id)

                          return (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
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
                                  onValueChange={(value) => handleMarkAttendance(student.id, value)}
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
                      {attendanceRecords.filter((record) => record.status === "present").length > 0 ? (
                        attendanceRecords
                          .filter((record) => record.status === "present")
                          .map((record) => {
                            const student = course?.students?.find((s) => s.id === record.studentId)

                            return (
                              <TableRow key={record.id}>
                                <TableCell className="font-medium">{student?.name || "Unknown Student"}</TableCell>
                                <TableCell>
                                  <span className="text-green-600 capitalize">{record.status}</span>
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
                            const student = course?.students?.find((s) => s.id === record.studentId)

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

