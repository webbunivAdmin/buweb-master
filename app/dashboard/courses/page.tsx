"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { courseService } from "@/lib/course-service"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { BookOpen, Plus, Search, Users } from "lucide-react"
import Link from "next/link"
import { Course } from "@/types/courses"

interface InputChangeEvent extends React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> {}

interface SelectChangeHandler {
    (name: string, value: string): void;
}

interface FormData {
    name: string;
    code: string;
    description: string;
    department: string;
    lecturer: string;
}

interface SubmitEvent extends React.FormEvent<HTMLFormElement> {}

export default function CoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    department: "",
  })

  const fetchCourses = async () => {
    try {
      setIsLoading(true)
      const data = await courseService.getAllCourses()
      setCourses(data)
      setFilteredCourses(data)
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to load courses")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCourses(courses)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = courses.filter(
        (course: Course) =>
          course.name.toLowerCase().includes(query) ||
          course.code.toLowerCase().includes(query) ||
          (course.description && course.description.toLowerCase().includes(query)),
      )
      setFilteredCourses(filtered)
    }
  }, [searchQuery, courses])


const handleInputChange = (e: InputChangeEvent) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
}


const handleSelectChange: SelectChangeHandler = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
};


const handleSubmit = async (e: SubmitEvent): Promise<void> => {
    e.preventDefault();

    if (!user) {
        toast.error("User is not authenticated");
        return;
    }

    if (!formData.name || !formData.code || !formData.department) {
        toast.error("Please fill in all required fields");
        return;
    }

    try {
        await courseService.createCourse(formData);

        toast.success("Course created successfully");
        setIsDialogOpen(false);
        setFormData({
            name: "",
            code: "",
            description: "",
            department: "",
        });
        fetchCourses();
    } catch (error) {
        console.error("Error creating course:", error);
        toast.error("Failed to create course");
    }
};

  const canCreateCourse = user && (user.role === "Admin" || user.role === "lecturer")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
        {canCreateCourse && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create New Course</DialogTitle>
                  <DialogDescription>
                    Add a new course to the system. Fill in all the required information.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Course Name*
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="code" className="text-right">
                      Course Code*
                    </Label>
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="department" className="text-right">
                      Department*
                    </Label>
                    <Select
                      name="department"
                      value={formData.department}
                      onValueChange={(value) => handleSelectChange("department", value)}
                      required
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="computer_science">Computer Science</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="arts">Arts & Humanities</SelectItem>
                        <SelectItem value="science">Science</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="col-span-3"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Course</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Courses</TabsTrigger>
          <TabsTrigger value="teaching">Teaching</TabsTrigger>
          <TabsTrigger value="enrolled">Enrolled</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
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
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <Card key={course._id}>
                  <CardHeader>
                    <CardTitle>{course.name}</CardTitle>
                    <CardDescription>{course.code}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description || "No description available"}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-1 h-4 w-4" />
                        <span>{course.students?.length || 0} students</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/dashboard/courses/${course._id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-6 text-muted-foreground">No courses found</div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="teaching" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                      <CardFooter>
                        <Skeleton className="h-9 w-full" />
                      </CardFooter>
                    </Card>
                  ))
              : filteredCourses
                  .map((course) => (
                    <Card key={course._id}>
                      <CardHeader>
                        <CardTitle>{course.name}</CardTitle>
                        <CardDescription>{course.code}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.description || "No description available"}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="mr-1 h-4 w-4" />
                            <span>{course.students?.length || 0} students</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/dashboard/courses/${course._id}`}>View Details</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
          </div>
        </TabsContent>
        <TabsContent value="enrolled" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                      <CardFooter>
                        <Skeleton className="h-9 w-full" />
                      </CardFooter>
                    </Card>
                  ))
              : filteredCourses
                  .filter((course) => user && course.students?.some((student) => student.id === user.id))
                  .map((course) => (
                    <Card key={course._id}>
                      <CardHeader>
                        <CardTitle>{course.name}</CardTitle>
                        <CardDescription>{course.code}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.description || "No description available"}
                          </p>
                          {/* <div className="flex items-center text-sm text-muted-foreground">
                            <BookOpen className="mr-1 h-4 w-4" />
                            <span>Taught by {course.lecturerName || "Unknown"}</span>
                          </div> */}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/dashboard/courses/${course._id}`}>View Details</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
