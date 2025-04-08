"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { courseService } from "@/lib/course-service"
import { timetableService } from "@/lib/timetable-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Calendar, Clock, Filter, Plus, Search, Users } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { eventService } from "@/lib/event-service"
import { Timetable } from "@/types/timetable"
import { Course as BaseCourse, User } from "@/types/courses"
import { authService } from "@/lib/api-service"

interface Course extends BaseCourse {
  lecturer?: string; // Add lecturer property to the Course type
}

interface TimetableData {
    course: string;
    lecturer?: string;
    classType: string;
    startTime: string;
    endTime: string;
    location: string;
    repeatsWeekly: boolean;
    endDate?: string;
    students: User[];
    classRepresentatives: string[];
    notes: string;
    isOnline: boolean;
}

interface EventData {
    title: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
    allDay: boolean;
    repeatsWeekly: boolean;
    endDate?: string;
    metadata: {
        timetableId: string;
        courseId: string;
        classType: string;
        isOnline: boolean;
    };
}

interface ToggleClassRepSelectionParams {
    studentId: string;
}

interface ToggleStudentSelectionParams {
    studentId: string;
}


export default function ClassesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [filteredTimetables, setFilteredTimetables] = useState<Timetable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filters, setFilters] = useState({
    courseId: "",
    classType: "",
    dateRange: "all",
  })
  const [formData, setFormData] = useState({
    course: "",
    classType: "online",
    startTime: "",
    endTime: "",
    location: "",
    repeatsWeekly: false,
    endDate: "",
    classRepresentatives: [],
    students: [],
    lecturer: "",
    notes: "",
    isOnline: false,
  })
  const [availableStudents, setAvailableStudents] = useState<User[]>([])
  const [selectedStudents, setSelectedStudents] = useState<User[]>([])
  const [selectedClassReps, setSelectedClassReps] = useState<string[]>([])
  const [studentSearchQuery, setStudentSearchQuery] = useState("")
  const [originalStudentsList, setOriginalStudentsList] = useState<User[]>([])
  const [availableLecturers, setAvailableLecturers] = useState<User[]>([])
  const [originalLecturersList, setOriginalLecturersList] = useState<User[]>([])
  const [lecturerSearchQuery, setLecturerSearchQuery] = useState("")

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [coursesData, timetablesData, userData] = await Promise.all([
        courseService.getAllCourses(),
        timetableService.getAllTimetables(),
        authService.getUsers(),
      ])

      setCourses(coursesData)
      setTimetables(timetablesData)
      setFilteredTimetables(timetablesData)

      setAvailableStudents(userData)
      setOriginalStudentsList(userData)
      setAvailableLecturers(userData)
      setOriginalLecturersList(userData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load class data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, filters, timetables])

  const applyFilters = () => {
    let filtered = [...timetables]

    // Apply search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((timetable) => {
        const course = courses.find((c) => c._id === timetable.course)
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

    // Apply date range filter
    const now = new Date()
    if (filters.dateRange === "upcoming") {
      filtered = filtered.filter((timetable) => new Date(timetable.startTime) > now)
    } else if (filters.dateRange === "past") {
      filtered = filtered.filter((timetable) => new Date(timetable.startTime) < now)
    } else if (filters.dateRange === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      filtered = filtered.filter((timetable) => {
        const classDate = new Date(timetable.startTime)
        return classDate >= today && classDate < tomorrow
      })
    } else if (filters.dateRange === "thisWeek") {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 7) // End of current week

      filtered = filtered.filter((timetable) => {
        const classDate = new Date(timetable.startTime)
        return classDate >= startOfWeek && classDate < endOfWeek
      })
    }

    setFilteredTimetables(filtered)
  }

type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;

const handleInputChange = (e: InputChangeEvent) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
    }))
}

interface HandleSelectChangeParams {
    name: keyof typeof formData;
    value: string;
}

    const handleSelectChange = ({ name, value }: HandleSelectChangeParams) => {
        setFormData((prev) => ({ ...prev, [name]: value }));

        // If course is selected, populate students from that course
        if (name === "course") {
            const selectedCourse = courses.find((c) => c._id === value);
            if (selectedCourse && selectedCourse.students) {
                setSelectedStudents(selectedCourse.students);
            } else {
                if (selectedCourse?.lecturer) {
                }

            // Set lecturer from course
                if (selectedCourse && selectedCourse.lecturer) {
                    setFormData((prev) => ({ ...prev, lecturer: selectedCourse.lecturer || "" }));
                }
            }
        };
    }

interface FilterChangeParams {
    name: keyof typeof filters;
    value: string;
}

    const handleFilterChange = ({ name, value }: FilterChangeParams) => {
        setFilters((prev) => ({ ...prev, [name]: value }))
    }

    const toggleStudentSelection = ({ studentId }: ToggleStudentSelectionParams) => {
        setSelectedStudents((prev: User[]) => {
            if (prev.some((student) => student._id === studentId)) {
                return prev.filter((student) => student._id !== studentId);
            } else {
                const studentToAdd = availableStudents.find((student) => student._id === studentId);
                return studentToAdd ? [...prev, studentToAdd] : prev;
            }
        });
    };


    const toggleClassRepSelection = ({ studentId }: ToggleClassRepSelectionParams) => {
        setSelectedClassReps((prev: string[]) => {
            if (prev.includes(studentId)) {
                return prev.filter((_id) => _id !== studentId);
            } else {
                return [...prev, studentId];
            }
        });
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.course || !formData.startTime || !formData.endTime || !formData.location) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            const selectedCourse = courses.find((c) => c._id === formData.course);

            // Create timetable entry
            const timetableData: TimetableData = {
                course: formData.course,
                lecturer: formData.lecturer || selectedCourse?.lecturer,
                classType: formData.classType,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
                location: formData.location,
                repeatsWeekly: formData.repeatsWeekly,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
                students: selectedStudents, // Ensure students is of type User[]
                classRepresentatives: selectedClassReps,
                notes: formData.notes,
                isOnline: formData.isOnline,
            };

            const newTimetable = await timetableService.createTimetable(timetableData);

            // Create calendar event
            try {
                const eventData: EventData = {
                    title: `${selectedCourse?.name} - ${formData.classType.charAt(0).toUpperCase() + formData.classType.slice(1)}`,
                    description: formData.notes || `${selectedCourse?.code} ${formData.classType}`,
                    location: formData.location,
                    startTime: formData.startTime,
                    endTime: formData.endTime,
                    allDay: false,
                    repeatsWeekly: formData.repeatsWeekly,
                    endDate: formData.endDate,
                    metadata: {
                        timetableId: newTimetable.id,
                        courseId: formData.course,
                        classType: formData.classType,
                        isOnline: formData.isOnline,
                    },
                };

                await eventService.createEvent(eventData);
            } catch (error) {
                console.error("Error creating calendar event:", error);
                // Continue even if event creation fails
            }

            toast.success("Class created successfully");
            setIsDialogOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error creating class:", error);
            toast.error("Failed to create class");
        }
    };

  const resetForm = () => {
    setFormData({
      course: "",
      classType: "online",
      startTime: "",
      endTime: "",
      location: "",
      repeatsWeekly: false,
      endDate: "",
      classRepresentatives: [],
      students: [],
      lecturer: "",
      notes: "",
      isOnline: false,
    })
    setSelectedStudents([])
    setSelectedClassReps([])
    setStudentSearchQuery("")
    setLecturerSearchQuery("")
    setAvailableStudents(originalStudentsList)
    setAvailableLecturers(originalLecturersList)
  }

  const canCreateClass = user && (user.role === "Admin" || user.role === "lecturer")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
        {canCreateClass && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                  <DialogDescription>
                    Schedule a new class for a course. Fill in all the required information.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="course">Course*</Label>
                      <Select
                        name="course"
                        value={formData.course}
                        onValueChange={(value) => handleSelectChange({ name: "course", value: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course._id} value={course._id}>
                              {course.name} ({course.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="classType">Class Type*</Label>
                      <Select
                        name="classType"
                        value={formData.classType}
                        onValueChange={(value) => handleSelectChange({ name: "classType", value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                      <Label htmlFor="lecturer">Lecturer*</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search lecturers..."
                            value={lecturerSearchQuery}
                            onChange={(e) => {
                              const query = e.target.value.toLowerCase()
                              setLecturerSearchQuery(query)

                              if (query) {
                                const filtered = originalLecturersList.filter(
                                  (lecturer) =>
                                    lecturer.name.toLowerCase().includes(query) ||
                                    lecturer.department.toLowerCase().includes(query) ||
                                    lecturer.email.toLowerCase().includes(query),
                                )
                                setAvailableLecturers(filtered)
                              } else {
                                setAvailableLecturers(originalLecturersList)
                              }
                            }}
                          />
                        </div>
                        <div className="border rounded-md max-h-40 overflow-y-auto">
                          {availableLecturers.length > 0 ? (
                            <div className="p-1">
                              {availableLecturers.map((lecturer) => (
                                <div
                                  key={lecturer._id}
                                  className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-muted ${
                                    formData.lecturer === lecturer._id ? "bg-muted" : ""
                                  }`}
                                  onClick={() => handleSelectChange({ name: "lecturer", value: lecturer._id })}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium">{lecturer.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {lecturer.department} • {lecturer.email}
                                    </p>
                                  </div>
                                  <div className="ml-2">
                                    {formData.lecturer === lecturer._id && (
                                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No lecturers found</p>
                          )}
                        </div>
                      </div>
                    </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="repeatsWeekly"
                        name="repeatsWeekly"
                        checked={formData.repeatsWeekly}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, repeatsWeekly: Boolean(checked) }))}
                      />
                      <Label htmlFor="repeatsWeekly">This class repeats weekly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isOnline"
                        name="isOnline"
                        checked={formData.isOnline}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isOnline: Boolean(checked) }))}
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

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Students</Label>
                      <div className="text-sm text-muted-foreground">{selectedStudents.length} selected</div>
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        value={studentSearchQuery}
                        onChange={(e) => {
                          const query = e.target.value.toLowerCase()
                          setStudentSearchQuery(query)

                          if (query) {
                            const filtered = originalStudentsList.filter(
                              (student) =>
                                student.name.toLowerCase().includes(query) ||
                                student.registrationNumber?.toLowerCase().includes(query) ||
                                student.email.toLowerCase().includes(query),
                            )
                            setAvailableStudents(filtered)
                          } else {
                            setAvailableStudents(originalStudentsList)
                          }
                        }}
                      />
                    </div>

                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                      {availableStudents.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const allIds = availableStudents.map((s) => s._id)
                                if (selectedStudents.length === allIds.length) {
                                  setSelectedStudents([])
                                  setSelectedClassReps([])
                                } else {
                                  setSelectedStudents(allIds.map((id) => availableStudents.find((student) => student._id === id)!).filter(Boolean) as User[])
                                }
                              }}
                            >
                              {selectedStudents.length === availableStudents.length ? "Deselect All" : "Select All"}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedClassReps([])}>
                              Clear Reps
                            </Button>
                          </div>

                          {availableStudents.map((student) => (
                            <div
                              key={student._id}
                              className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b last:border-0"
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <Checkbox
                                  id={`student-${student._id}`}
                                  checked={selectedStudents.some((selectedStudent) => selectedStudent._id === student._id)}
                                  onCheckedChange={() => toggleStudentSelection({ studentId: student._id })}
                                  className="mr-2"
                                />
                                <div className="truncate">
                                  <Label htmlFor={`student-${student._id}`} className="font-medium cursor-pointer">
                                    {student.name}
                                  </Label>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {student.registrationNumber} • {student.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-7 sm:ml-0">
                                <Checkbox
                                  id={`rep-${student._id}`}
                                  checked={selectedClassReps.includes(student._id)}
                                  onCheckedChange={() => toggleClassRepSelection({ studentId: student._id })}
                                  disabled={!selectedStudents.some((selectedStudent) => selectedStudent._id === student._id)}
                                />
                                <Label htmlFor={`rep-${student._id}`} className="text-sm whitespace-nowrap">
                                  Class Rep
                                </Label>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select students to enroll in this class. You can also designate class representatives.
                    </p>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Reset
                  </Button>
                  <Button type="submit">Create Class</Button>
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
              {(filters.courseId || filters.classType || filters.dateRange !== "all") && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(filters).filter((v) => v && v !== "all").length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Filter Classes</h4>

              <div className="space-y-2">
                <Label htmlFor="courseFilter">Course</Label>
                <Select value={filters.courseId} onValueChange={(value) => handleFilterChange({ name: "courseId", value })}>
                  <SelectTrigger id="courseFilter">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classTypeFilter">Class Type</Label>
                <Select value={filters.classType} onValueChange={(value) => handleFilterChange({ name: "classType", value })}>
                  <SelectTrigger id="classTypeFilter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="lecture">Lectures</SelectItem>
                    <SelectItem value="tutorial">Tutorials</SelectItem>
                    <SelectItem value="lab">Labs</SelectItem>
                    <SelectItem value="seminar">Seminars</SelectItem>
                    <SelectItem value="workshop">Workshops</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateRangeFilter">Date Range</Label>
                <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange({ name: "dateRange", value })}>
                  <SelectTrigger id="dateRangeFilter">
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  setFilters({
                    courseId: "",
                    classType: "",
                    dateRange: "all",
                  })
                }
              >
                Clear Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array(6)
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
                    <CardFooter>
                      <Skeleton className="h-9 w-full" />
                    </CardFooter>
                  </Card>
                ))
            ) : filteredTimetables.length > 0 ? (
              filteredTimetables
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((timetable) => {
                  const course = courses.find((c) => c._id === timetable.course)
                  const isPast = new Date(timetable.endTime) < new Date()

                  return (
                    <Link href={`/dashboard/classes/${timetable._id}`} key={timetable._id}>
                      <Card
                        className={`hover:bg-muted/50 transition-colors cursor-pointer ${isPast ? "opacity-70" : ""}`}
                      >
                        <CardHeader>
                          <CardTitle>{course?.name || "Unnamed Course"}</CardTitle>
                          <CardDescription className="flex items-center justify-between">
                            <span className="capitalize">{timetable.classType}</span>
                            {timetable.isOnline && <Badge variant="outline">Online</Badge>}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(timetable.startTime).toLocaleDateString()}
                              {timetable.repeatsWeekly && " (Weekly)"}
                            </span>
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
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{timetable.students?.length || 0} students</span>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    </Link>
                  )
                })
            ) : (
              <div className="col-span-full text-center py-6 text-muted-foreground">
                No classes found matching your criteria
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Classes</CardTitle>
              <CardDescription>{filteredTimetables.length} classes found</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex items-center p-3 rounded-md border">
                        <div className="flex-1">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-32 mt-1" />
                        </div>
                        <div className="text-right">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16 mt-1" />
                        </div>
                      </div>
                    ))}
                </div>
              ) : filteredTimetables.length > 0 ? (
                <div className="space-y-2">
                  {filteredTimetables
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((timetable) => {
                      const course = courses.find((c) => c._id === timetable.course)
                      const isPast = new Date(timetable.endTime) < new Date()

                      return (
                        <Link href={`/dashboard/classes/${timetable._id}`} key={timetable._id}>
                          <div
                            className={`flex items-center p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer ${isPast ? "opacity-70" : ""}`}
                          >
                            <div className="flex-1">
                              <p className="font-medium">
                                {course?.name || "Unnamed Course"}
                                {timetable.isOnline && (
                                  <Badge variant="outline" className="ml-2">
                                    Online
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {timetable.classType} • {timetable.location}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">
                                {new Date(timetable.startTime).toLocaleDateString()}
                                {timetable.repeatsWeekly && " (Weekly)"}
                              </p>
                              <p className="text-xs text-muted-foreground">
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
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">No classes found matching your criteria</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>View your classes in a calendar format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] border rounded-md p-4">
                <p className="text-center text-muted-foreground">
                  Calendar view is integrated with your existing calendar system. Please use the main calendar interface
                  to view all scheduled classes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

