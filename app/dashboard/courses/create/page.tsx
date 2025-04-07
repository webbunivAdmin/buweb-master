"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { courseService } from "@/lib/course-service"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { ArrowLeft, BookOpen } from 'lucide-react'
import { toast } from "sonner"
import Link from "next/link"

export default function CreateCoursePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [department, setDepartment] = useState("")
  const [lecturer, setLecturer] = useState("")
  const [students, setStudents] = useState<string[]>([])
  const [availableLecturers, setAvailableLecturers] = useState<any[]>([])
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "faculty") {
      toast.error("You don't have permission to create courses")
      router.push("/dashboard")
    }
  }, [user, router])

  // Fetch available lecturers and students
  useEffect(() => {
    const fetchUsers = async () => {
      try {
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
        setLoading(false)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast.error("Failed to load users")
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [])

  const departments = [
    "Computer Science",
    "Engineering",
    "Business",
    "Arts",
    "Medicine",
    "Law",
    "Education"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !code || !department || !lecturer) {
      toast.error("Please fill in all required fields")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const courseData = {
        name,
        code,
        description,
        department,
        lecturer,
        students
      }
      
      const response = await courseService.createCourse(courseData)
      
      toast.success("Course created successfully")
      router.push(`/dashboard/courses/${response._id}`)
    } catch (error) {
      console.error("Error creating course:", error)
      toast.error("Failed to create course")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/courses">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Course</h1>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>Enter the details for the new course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Course Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Introduction to Computer Science"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code">Course Code *</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="CS101"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter course description..."
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={department} onValueChange={setDepartment} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
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
                  Students can also be added later
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="button" variant="outline" className="mr-2" asChild>
                <Link href="/dashboard/courses">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Course"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
