"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { timetableService } from "@/lib/timetable-service"
import { courseService } from "@/lib/course-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { toast } from "sonner"
import { Calendar, Clock, Plus } from "lucide-react"
import Link from "next/link"

export default function TimetablesPage() {
  const { user } = useAuth()
  const [timetables, setTimetables] = useState([])
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    course: "",
    classType: "lecture",
    startTime: "",
    endTime: "",
    location: "",
    repeatsWeekly: false,
    endDate: "",
  })

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [timetablesData, coursesData] = await Promise.all([
        timetableService.getAllTimetables(),
        courseService.getAllCourses(),
      ])

      setTimetables(timetablesData)
      setCourses(coursesData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load timetable data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.course || !formData.startTime || !formData.endTime || !formData.location) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const selectedCourse = courses.find((c) => c.id === formData.course)

      await timetableService.createTimetable({
        course: formData.course,
        lecturer: selectedCourse.lecturer,
        classType: formData.classType,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        location: formData.location,
        repeatsWeekly: formData.repeatsWeekly,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        students: selectedCourse.students,
      })

      toast.success("Class added successfully")
      setIsDialogOpen(false)
      setFormData({
        course: "",
        classType: "lecture",
        startTime: "",
        endTime: "",
        location: "",
        repeatsWeekly: false,
        endDate: "",
      })
      fetchData()
    } catch (error) {
      console.error("Error creating class:", error)
      toast.error("Failed to create class")
    }
  }

  const canCreateClass = user && (user.role === "Admin" || user.role === "lecturer")

  // Group timetables by day for weekly view
  const groupByDay = (timetables) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const grouped = {}

    days.forEach((day) => {
      grouped[day] = []
    })

    timetables.forEach((timetable) => {
      const date = new Date(timetable.startTime)
      const day = days[date.getDay()]
      grouped[day].push(timetable)
    })

    return grouped
  }

  const weeklyTimetable = groupByDay(timetables)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
        {canCreateClass && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add New Class</DialogTitle>
                  <DialogDescription>Schedule a new class for a course.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="course" className="text-right">
                      Course*
                    </Label>
                    <Select
                      name="course"
                      value={formData.course}
                      onValueChange={(value) => handleSelectChange("course", value)}
                      required
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} ({course.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  <Button type="submit">Add Class</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Classes</TabsTrigger>
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          <TabsTrigger value="all">All Classes</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="mt-2 h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))
              : timetables
                  .filter((t) => new Date(t.startTime) > new Date())
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .slice(0, 9)
                  .map((timetable) => (
                    <Link href={`/dashboard/timetables/${timetable.id}`} key={timetable.id}>
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader>
                          <CardTitle>
                            {courses.find((c) => c.id === timetable.course)?.name || "Unnamed Course"}
                          </CardTitle>
                          <CardDescription className="capitalize">{timetable.classType}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{new Date(timetable.startTime).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(timetable.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -
                              {new Date(timetable.endTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
            {!isLoading && timetables.filter((t) => new Date(t.startTime) > new Date()).length === 0 && (
              <div className="col-span-full text-center py-6 text-muted-foreground">No upcoming classes scheduled</div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="weekly" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
              <Card key={day}>
                <CardHeader>
                  <CardTitle>{day}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : weeklyTimetable[day].length > 0 ? (
                    <div className="space-y-2">
                      {weeklyTimetable[day]
                        .sort((a, b) => {
                          const timeA = new Date(a.startTime).getHours() * 60 + new Date(a.startTime).getMinutes()
                          const timeB = new Date(b.startTime).getHours() * 60 + new Date(b.startTime).getMinutes()
                          return timeA - timeB
                        })
                        .map((timetable) => (
                          <Link href={`/dashboard/timetables/${timetable.id}`} key={timetable.id}>
                            <div className="flex items-center p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer">
                              <div className="flex-1">
                                <p className="font-medium">
                                  {courses.find((c) => c.id === timetable.course)?.name || "Unnamed Course"}
                                </p>
                                <p className="text-sm text-muted-foreground capitalize">{timetable.classType}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm">
                                  {new Date(timetable.startTime).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  -
                                  {new Date(timetable.endTime).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                                <p className="text-xs text-muted-foreground">{timetable.location}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No classes scheduled</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="mt-2 h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))
              : timetables
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map((timetable) => (
                    <Link href={`/dashboard/timetables/${timetable.id}`} key={timetable.id}>
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader>
                          <CardTitle>
                            {courses.find((c) => c.id === timetable.course)?.name || "Unnamed Course"}
                          </CardTitle>
                          <CardDescription className="capitalize">{timetable.classType}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{new Date(timetable.startTime).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(timetable.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -
                              {new Date(timetable.endTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
            {!isLoading && timetables.length === 0 && (
              <div className="col-span-full text-center py-6 text-muted-foreground">No classes scheduled</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

