"use client"

import React from "react"

import { useState, useEffect, useMemo } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, Filter, Plus, Search } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
} from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  const [calendarView, setCalendarView] = useState("week") // day, week, month
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    courseId: "",
    classType: "",
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

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
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

  // Filter timetables based on search and filters
  const filteredTimetables = useMemo(() => {
    let filtered = [...timetables]

    // Apply search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((timetable) => {
        const course = courses.find((c) => c.id === timetable.course)
        return (
          (course && course.name.toLowerCase().includes(query)) ||
          (course && course.code.toLowerCase().includes(query)) ||
          timetable.classType.toLowerCase().includes(query) ||
          timetable.location.toLowerCase().includes(query)
        )
      })
    }

    // Apply course filter
    if (filters.courseId) {
      filtered = filtered.filter((timetable) => timetable.course === filters.courseId)
    }

    // Apply class type filter
    if (filters.classType) {
      filtered = filtered.filter((timetable) => timetable.classType === filters.classType)
    }

    return filtered
  }, [timetables, searchQuery, filters, courses])

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

  const weeklyTimetable = groupByDay(filteredTimetables)

  // Calendar navigation functions
  const nextPeriod = () => {
    if (calendarView === "day") {
      setCurrentDate(addDays(currentDate, 1))
    } else if (calendarView === "week") {
      setCurrentDate(addWeeks(currentDate, 1))
    } else if (calendarView === "month") {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }

  const prevPeriod = () => {
    if (calendarView === "day") {
      setCurrentDate(addDays(currentDate, -1))
    } else if (calendarView === "week") {
      setCurrentDate(subWeeks(currentDate, 1))
    } else if (calendarView === "month") {
      setCurrentDate(subMonths(currentDate, 1))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Calendar date ranges
  const getDayViewDates = () => {
    return [currentDate]
  }

  const getWeekViewDates = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }) // Start on Monday
    const dates = []
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(start, i))
    }
    return dates
  }

  const getMonthViewDates = () => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const startDate = startOfWeek(start, { weekStartsOn: 1 })
    const endDate = endOfWeek(end, { weekStartsOn: 1 })

    const dates = []
    let day = startDate
    while (day <= endDate) {
      dates.push(day)
      day = addDays(day, 1)
    }
    return dates
  }

  // Get timetables for a specific date
  const getTimetablesForDate = (date) => {
    return filteredTimetables.filter((timetable) => {
      const timetableDate = parseISO(timetable.startTime)
      return isSameDay(timetableDate, date)
    })
  }

  // Get timetables for a specific time slot in day view
  const getTimetablesForTimeSlot = (date, hour) => {
    const startTime = setHours(setMinutes(date, 0), hour)
    const endTime = setHours(setMinutes(date, 59), hour)

    return filteredTimetables.filter((timetable) => {
      const timetableStart = parseISO(timetable.startTime)
      const timetableEnd = parseISO(timetable.endTime)

      return (
        isSameDay(timetableStart, date) &&
        (getHours(timetableStart) === hour ||
          (getHours(timetableStart) < hour && getHours(timetableEnd) > hour) ||
          (getHours(timetableStart) < hour && getHours(timetableEnd) === hour && getMinutes(timetableEnd) > 0))
      )
    })
  }

  // Calculate the height of a timetable event based on its duration
  const calculateEventHeight = (timetable) => {
    const start = parseISO(timetable.startTime)
    const end = parseISO(timetable.endTime)
    const durationInMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    return Math.max((durationInMinutes / 60) * 4, 1) + "rem" // 4rem per hour
  }

  // Calculate the top position of a timetable event based on its start time
  const calculateEventTop = (timetable) => {
    const start = parseISO(timetable.startTime)
    const hour = getHours(start)
    const minutes = getMinutes(start)
    return hour * 4 + (minutes / 60) * 4 + "rem" // 4rem per hour
  }

  // Calculate the width and left position of a timetable event in week view
  const calculateEventWidth = (timetable, date) => {
    // For simplicity, we'll make all events the same width
    return "90%"
  }

  const calculateEventLeft = (timetable, date) => {
    // For simplicity, we'll center all events
    return "5%"
  }

  // Generate time slots for day and week views
  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8) // 8 AM to 9 PM

  // Format the calendar header based on the current view
  const formatCalendarHeader = () => {
    if (calendarView === "day") {
      return format(currentDate, "EEEE, MMMM d, yyyy")
    } else if (calendarView === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
    } else if (calendarView === "month") {
      return format(currentDate, "MMMM yyyy")
    }
  }

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
                      <Checkbox
                        id="repeatsWeekly"
                        name="repeatsWeekly"
                        checked={formData.repeatsWeekly}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, repeatsWeekly: checked }))}
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

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {(filters.courseId || filters.classType) && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(filters).filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Filter Classes</h4>

              <div className="space-y-2">
                <Label htmlFor="courseFilter">Course</Label>
                <Select value={filters.courseId} onValueChange={(value) => handleFilterChange("courseId", value)}>
                  <SelectTrigger id="courseFilter">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classTypeFilter">Class Type</Label>
                <Select value={filters.classType} onValueChange={(value) => handleFilterChange("classType", value)}>
                  <SelectTrigger id="classTypeFilter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="lecture">Lectures</SelectItem>
                    <SelectItem value="tutorial">Tutorials</SelectItem>
                    <SelectItem value="lab">Labs</SelectItem>
                    <SelectItem value="seminar">Seminars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="w-full" onClick={() => setFilters({ courseId: "", classType: "" })}>
                Clear Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Classes</TabsTrigger>
          <TabsTrigger value="weekly">Weekly List</TabsTrigger>
          <TabsTrigger value="all">All Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" onClick={prevPeriod}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextPeriod}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <h3 className="text-lg font-semibold">{formatCalendarHeader()}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={calendarView === "day" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCalendarView("day")}
                  >
                    Day
                  </Button>
                  <Button
                    variant={calendarView === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCalendarView("week")}
                  >
                    Week
                  </Button>
                  <Button
                    variant={calendarView === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCalendarView("month")}
                  >
                    Month
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[600px] flex items-center justify-center">
                  <Skeleton className="h-[500px] w-full" />
                </div>
              ) : (
                <>
                  {/* Day View */}
                  {calendarView === "day" && (
                    <div className="h-[600px] overflow-y-auto">
                      <div className="relative grid grid-cols-1 border-l">
                        {timeSlots.map((hour) => (
                          <div key={hour} className="relative h-16 border-b">
                            <div className="absolute -left-14 top-0 w-12 pr-2 text-right text-sm text-muted-foreground">
                              {hour}:00
                            </div>
                            <div className="absolute top-0 left-0 w-full h-full">
                              {getTimetablesForTimeSlot(currentDate, hour).map((timetable) => {
                                const course = courses.find((c) => c.id === timetable.course)
                                return (
                                  <Link href={`/dashboard/timetables/${timetable.id}`} key={timetable.id}>
                                    <div
                                      className="absolute rounded-md p-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors overflow-hidden"
                                      style={{
                                        top: calculateEventTop(timetable),
                                        height: calculateEventHeight(timetable),
                                        width: "95%",
                                        left: "2.5%",
                                        zIndex: 10,
                                      }}
                                    >
                                      <div className="font-medium text-sm truncate">
                                        {course?.name || "Unnamed Course"}
                                      </div>
                                      <div className="text-xs capitalize truncate">
                                        {timetable.classType} • {timetable.location}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {format(parseISO(timetable.startTime), "h:mm a")} -
                                        {format(parseISO(timetable.endTime), "h:mm a")}
                                      </div>
                                    </div>
                                  </Link>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Week View */}
                  {calendarView === "week" && (
                    <div className="h-[600px] overflow-y-auto">
                      <div className="grid grid-cols-7 border-b">
                        {getWeekViewDates().map((date, index) => (
                          <div
                            key={index}
                            className={`text-center py-2 font-medium ${
                              isSameDay(date, new Date()) ? "bg-primary/10" : ""
                            }`}
                          >
                            <div className="text-sm">{format(date, "EEE")}</div>
                            <div className={`text-lg ${isSameDay(date, new Date()) ? "text-primary" : ""}`}>
                              {format(date, "d")}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="relative grid grid-cols-7 border-l">
                        {timeSlots.map((hour) => (
                          <React.Fragment key={hour}>
                            {getWeekViewDates().map((date, dateIndex) => (
                              <div key={`${hour}-${dateIndex}`} className="relative h-16 border-r border-b">
                                {dateIndex === 0 && (
                                  <div className="absolute -left-14 top-0 w-12 pr-2 text-right text-sm text-muted-foreground">
                                    {hour}:00
                                  </div>
                                )}
                                <div className="absolute top-0 left-0 w-full h-full">
                                  {getTimetablesForTimeSlot(date, hour).map((timetable) => {
                                    const course = courses.find((c) => c.id === timetable.course)
                                    return (
                                      <Link href={`/dashboard/timetables/${timetable.id}`} key={timetable.id}>
                                        <div
                                          className="absolute rounded-md p-1 bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors overflow-hidden"
                                          style={{
                                            top: calculateEventTop(timetable),
                                            height: calculateEventHeight(timetable),
                                            width: calculateEventWidth(timetable, date),
                                            left: calculateEventLeft(timetable, date),
                                            zIndex: 10,
                                          }}
                                        >
                                          <div className="font-medium text-xs truncate">
                                            {course?.name || "Unnamed Course"}
                                          </div>
                                          <div className="text-xs capitalize truncate">{timetable.classType}</div>
                                        </div>
                                      </Link>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Month View */}
                  {calendarView === "month" && (
                    <div className="h-[600px] overflow-y-auto">
                      <div className="grid grid-cols-7 border-b">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                          <div key={day} className="text-center py-2 font-medium text-sm">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 auto-rows-fr border-l">
                        {getMonthViewDates().map((date, index) => {
                          const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                          const isToday = isSameDay(date, new Date())
                          const dayTimetables = getTimetablesForDate(date)

                          return (
                            <div
                              key={index}
                              className={`min-h-24 p-1 border-r border-b relative ${
                                !isCurrentMonth ? "bg-muted/30 text-muted-foreground" : ""
                              } ${isToday ? "bg-primary/10" : ""}`}
                            >
                              <div className={`text-right p-1 ${isToday ? "font-bold text-primary" : ""}`}>
                                {format(date, "d")}
                              </div>
                              <div className="space-y-1 max-h-20 overflow-y-auto">
                                {dayTimetables.slice(0, 3).map((timetable) => {
                                  const course = courses.find((c) => c.id === timetable.course)
                                  return (
                                    <Link href={`/dashboard/timetables/${timetable.id}`} key={timetable.id}>
                                      <div className="text-xs p-1 rounded bg-primary/10 border border-primary/20 truncate hover:bg-primary/20 transition-colors">
                                        <div className="font-medium truncate">{course?.name || "Unnamed Course"}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {format(parseISO(timetable.startTime), "h:mm a")}
                                        </div>
                                      </div>
                                    </Link>
                                  )
                                })}
                                {dayTimetables.length > 3 && (
                                  <div className="text-xs text-muted-foreground text-center mt-1">
                                    +{dayTimetables.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
              : filteredTimetables
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
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(parseISO(timetable.startTime), "EEEE, MMMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(parseISO(timetable.startTime), "h:mm a")} -
                              {format(parseISO(timetable.endTime), "h:mm a")}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
            {!isLoading && filteredTimetables.filter((t) => new Date(t.startTime) > new Date()).length === 0 && (
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
                                  {format(parseISO(timetable.startTime), "h:mm a")} -
                                  {format(parseISO(timetable.endTime), "h:mm a")}
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
              : filteredTimetables
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
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(parseISO(timetable.startTime), "EEEE, MMMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(parseISO(timetable.startTime), "h:mm a")} -
                              {format(parseISO(timetable.endTime), "h:mm a")}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
            {!isLoading && filteredTimetables.length === 0 && (
              <div className="col-span-full text-center py-6 text-muted-foreground">No classes scheduled</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
