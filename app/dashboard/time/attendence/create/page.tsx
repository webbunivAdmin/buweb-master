"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { timetableService } from "@/lib/timetable-service"
import { courseService } from "@/lib/course-service"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { MultiSelect } from "@/components/ui/multi-select"
import { ArrowLeft, Calendar } from 'lucide-react'
import { toast } from "sonner"
import Link from "next/link"

export default function CreateClassPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [course, setCourse] = useState("")
  const [lecturer, setLecturer] = useState("")
  const [classType, setClassType] = useState("lecture")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")
  const [repeatsWeekly, setRepeatsWeekly] = useState(true)
  const [endDate, setEndDate] = useState("")
  const [classRepresentatives, setClassRepresentatives] = useState<string[]>([])
  const [students, setStudents] = useState<string[]>([])
  const [availableCourses, setAvailableCourses] = useState<any[]>([])
  const [availableLecturers, setAvailableLecturers] = useState<any[]>([])
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if user is admin or faculty
  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "faculty") {
      toast.error("You don't have permission to create classes")
      router.push("/dashboard/timetable")
    }
  }, [user, router])

  // Fetch available courses, lecturers, and students
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses
        const coursesData = await courseService.getAllCourses()
        setAvailableCourses(coursesData)
        
        // In a real app, you would fetch users from your API
        // For now, we'll use mock data
        const mockLecturers = Array.from({ length: 5 }).map((_, i) => ({
          id: `lecturer-${i + 1}`,
          name: `Dr. Lecturer ${i + 1}`,
          role: "faculty"
        }))
        
        const mockStudents = Array.from({ length: 20 }).map((_, i) => ({
          id: `student-${i + 1}`,
          name: `Student ${i + 1}`,
          role: "student"
        }))
        
        setAvailableLecturers(mockLecturers)
        setAvailableStudents(mockStudents)
        
        // Set default dates and times
        const now = new Date()
        setStartDate(now.toISOString().split("T")[0])
        
        // Default start time: 9:00 AM
        setStartTime("09:00")
        
        // Default end time: 10:30 AM
        setEndTime("10:30")
        
        // Default end date: 3 months from now
        const threeMonthsLater = new Date(now)
        threeMonthsLater.setMonth(now.getMonth() + 3)
        setEndDate(threeMonthsLater.toISOString().split("T")[0])
        
        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load data")
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Update students when course changes
  useEffect(() => {
    if (course) {
      const selectedCourse = availableCourses.find(c => c._id === course)
      if (selectedCourse && selectedCourse.students) {
        setStudents(selectedCourse.students)
      }
    }
  }, [course, availableCourses])

  const classTypes = [
    "lecture",
    "lab",
    "tutorial",
    "seminar",
    "workshop",
    "exam"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!course || !lecturer || !classType || !startDate || !startTime || !endTime || !location) {
      toast.error("Please fill in all required fields")
      return
    }
    
    // Create start and end datetime objects
    const startDateTime = new Date(`${startDate}T${startTime}`)
    const endDateTime = new Date(`${startDate}T${endTime}`)
    
    // Validate times
    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const timetableData = {
        course,
        lecturer,
        classType,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location,
        repeatsWeekly,
        endDate: repeatsWeekly ? new Date(endDate).toISOString() : undefined,
        classRepresentatives,
        students
      }
      
      const response = await timetableService.createTimetable(timetableData)
      
      toast.success("Class created successfully")
      router.push(`/dashboard/timetable/${response._id}`)
    } catch (error) {
      console.error("Error creating class:", error)
      toast.error("Failed to create class")
    } finally {
      setIsSubmitting(false)
    }
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
          <h1 className="text-2xl font-bold">Create New Class</h1>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Class Details</CardTitle>
              <CardDescription>Schedule a new class for a course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course">Course *</Label>
                <Select value={course} onValueChange={setCourse} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lecturer">Lecturer *</Label>
                <Select value={lecturer} onValueChange={setLecturer} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lecturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLecturers.map((lecturer) => (
                      <SelectItem key={lecturer.id} value={lecturer.id}>
                        {lecturer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="classType">Class Type *</Label>
                <Select value={classType} onValueChange={setClassType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class type" />
                  </SelectTrigger>
                  <SelectContent>
                    {classTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Room 101, Building A"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="repeatsWeekly"
                  checked={repeatsWeekly}
                  onCheckedChange={setRepeatsWeekly}
                />
                <Label htmlFor="repeatsWeekly">Repeats Weekly</Label>
              </div>
              
              {repeatsWeekly && (
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required={repeatsWeekly}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Class Representatives</Label>
                <MultiSelect
                  options={availableStudents.map(student => ({
                    value: student.id,
                    label: student.name
                  }))}
                  selected={classRepresentatives}
                  onChange={setClassRepresentatives}
                  placeholder="Select class representatives"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Students</Label>
                <MultiSelect
                  options={availableStudents.map(student => ({
                    value: student.id,
                    label: student.name
                  }))}
                  selected={students}
                  onChange={setStudents}
                  placeholder="Select students to enroll"
                />
                <p className="text-xs text-muted-foreground">
                  By default, all students enrolled in the course will be included
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="button" variant="outline" className="mr-2" asChild>
                <Link href="/dashboard/timetable">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Class"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
