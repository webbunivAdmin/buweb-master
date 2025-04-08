"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { courseService } from "@/lib/course-service"
import { timetableService } from "@/lib/timetable-service"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Calendar, Clock, Edit, Plus, Trash, Users } from "lucide-react"
import Link from "next/link"
import { Timetable } from "@/types/timetable"

interface InputChangeEvent extends React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> {}

interface SelectChangeHandler {
    (name: string, value: string): void;
}

interface ClassSelectChangeHandler {
    (name: string, value: string): void;
}

interface UpdateCourseFormData {
    name: string;
    code: string;
    description: string;
    department: string;
}

interface UpdateCourseEvent extends React.FormEvent<HTMLFormElement> {}

interface AddClassFormData {
    classType: string;
    startTime: string;
    endTime: string;
    location: string;
    repeatsWeekly: boolean;
    endDate?: string;
}

interface AddClassEvent extends React.FormEvent<HTMLFormElement> {}



export default function CourseDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [course, setCourse] = useState<{ name?: string; lecturer?: string; students?: string[]; code?: string; description?: string; department?: string } | null>(null)
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddClassDialogOpen, setIsAddClassDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    department: "",
  })
  const [classFormData, setClassFormData] = useState({
    classType: "lecture",
    startTime: "",
    endTime: "",
    location: "",
    repeatsWeekly: false,
    endDate: "",
  })

  const fetchCourseData = async () => {
    try {
      setIsLoading(true)
      if (typeof id !== "string") {
        throw new Error("Invalid course ID");
      }
      const courseData = await courseService.getCourse(id);
      setCourse(courseData)
      setFormData({
        name: courseData.name,
        code: courseData.code,
        description: courseData.description || "",
        department: courseData.department,
      })

      // Fetch timetables for this course
      const timetablesData = await timetableService.getAllTimetables()
    const courseTimetables = timetablesData.filter((t: Timetable) => t.course === id)
      setTimetables(courseTimetables)
    } catch (error) {
      console.error("Error fetching course details:", error)
      toast.error("Failed to load course details")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchCourseData()
    }
  }, [id])


const handleInputChange = (e: InputChangeEvent) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
}

  const handleClassInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setClassFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }


const handleSelectChange: SelectChangeHandler = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
}


const handleClassSelectChange: ClassSelectChangeHandler = (name, value) => {
    setClassFormData((prev) => ({ ...prev, [name]: value }));
};

const handleUpdateCourse = async (e: UpdateCourseEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.code || !formData.department) {
        toast.error("Please fill in all required fields")
        return
    }

    try {
        if (typeof id === "string") {
          await courseService.updateCourse(id, formData as UpdateCourseFormData)
        } else {
          throw new Error("Invalid course ID");
        }
        toast.success("Course updated successfully")
        setIsEditDialogOpen(false)
        fetchCourseData()
    } catch (error) {
        console.error("Error updating course:", error)
        toast.error("Failed to update course")
    }
}

  const handleDeleteCourse = async () => {
    try {
      if (typeof id === "string") {
        await courseService.deleteCourse(id)
      } else {
        throw new Error("Invalid course ID");
      }
      toast.success("Course deleted successfully")
      router.push("/dashboard/courses")
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error("Failed to delete course")
    }
  }


const handleAddClass = async (e: AddClassEvent) => {
    e.preventDefault();

    if (!classFormData.startTime || !classFormData.endTime || !classFormData.location) {
        toast.error("Please fill in all required fields");
        return;
    }

    try {
        await timetableService.createTimetable({
            course: id as string,
            lecturer: course?.lecturer as string,
            classType: classFormData.classType,
            startTime: new Date(classFormData.startTime).toISOString(),
            endTime: new Date(classFormData.endTime).toISOString(),
            location: classFormData.location,
            repeatsWeekly: classFormData.repeatsWeekly,
            endDate: classFormData.endDate ? new Date(classFormData.endDate).toISOString() : undefined,
            students: course?.students || [],
        });

        toast.success("Class added successfully");
        setIsAddClassDialogOpen(false);
        setClassFormData({
            classType: "lecture",
            startTime: "",
            endTime: "",
            location: "",
            repeatsWeekly: false,
            endDate: "",
        });
        fetchCourseData();
    } catch (error) {
        console.error("Error adding class:", error);
        toast.error("Failed to add class");
    }
};

  const isAdmin = user && user.role === "admin"
  const isLecturer = user && (user.role === "lecturer" || user.role === "admin") && course?.lecturer === user.id
  const canEdit = isAdmin || isLecturer

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

  if (!course) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
        {canEdit && (
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Course
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleUpdateCourse}>
                  <DialogHeader>
                    <DialogTitle>Edit Course</DialogTitle>
                    <DialogDescription>Make changes to the course details.</DialogDescription>
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
                    This action cannot be undone. This will permanently delete the course and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteCourse}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>Course code: {course.code}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Description</h3>
            <p className="text-sm text-muted-foreground mt-1">{course.description || "No description available"}</p>
          </div>
          <div>
            <h3 className="font-medium">Department</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {course.department
                ? course.department.charAt(0).toUpperCase() + course.department.slice(1).replace("_", " ")
                : "Not specified"}
            </p>
          </div>
          <div>
            <h3 className="font-medium">Students</h3>
            <p className="text-sm text-muted-foreground mt-1 flex items-center">
              <Users className="mr-1 h-4 w-4" />
              {course.students?.length || 0} enrolled
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Class Schedule</h2>
        {canEdit && (
          <Dialog open={isAddClassDialogOpen} onOpenChange={setIsAddClassDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddClass}>
                <DialogHeader>
                  <DialogTitle>Add New Class</DialogTitle>
                  <DialogDescription>Schedule a new class for this course.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="classType" className="text-right">
                      Class Type*
                    </Label>
                    <Select
                      name="classType"
                      value={classFormData.classType}
                      onValueChange={(value) => handleClassSelectChange("classType", value)}
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
                      value={classFormData.startTime}
                      onChange={handleClassInputChange}
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
                      value={classFormData.endTime}
                      onChange={handleClassInputChange}
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
                      value={classFormData.location}
                      onChange={handleClassInputChange}
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
                        checked={classFormData.repeatsWeekly}
                        onChange={handleClassInputChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="repeatsWeekly" className="text-sm font-normal">
                        This class repeats weekly
                      </Label>
                    </div>
                  </div>
                  {classFormData.repeatsWeekly && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="endDate" className="text-right">
                        End Date
                      </Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={classFormData.endDate}
                        onChange={handleClassInputChange}
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
          <TabsTrigger value="all">All Classes</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {timetables
              .filter((t) => new Date(t.startTime) > new Date())
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .map((timetable) => (
                <Link href={`/dashboard/timetables/${timetable._id}`} key={timetable._id}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="capitalize">{timetable.classType}</CardTitle>
                      <CardDescription>{timetable.location}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(timetable.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(timetable.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                          -{new Date(timetable.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            {timetables.filter((t) => new Date(t.startTime) > new Date()).length === 0 && (
              <div className="col-span-full text-center py-6 text-muted-foreground">No upcoming classes scheduled</div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {timetables
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .map((timetable) => (
                <Link href={`/dashboard/timetables/${timetable._id}`} key={timetable._id}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="capitalize">{timetable.classType}</CardTitle>
                      <CardDescription>{timetable.location}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(timetable.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(timetable.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                          -{new Date(timetable.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            {timetables.length === 0 && (
              <div className="col-span-full text-center py-6 text-muted-foreground">No classes scheduled</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
