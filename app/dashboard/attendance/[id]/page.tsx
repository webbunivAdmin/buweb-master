"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { timetableService } from "@/lib/timetable-service"
import { courseService } from "@/lib/course-service"
import { attendanceService } from "@/lib/attendance-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Calendar, Check, Clock, MapPin, Camera } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AttendanceMarkPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [timetable, setTimetable] = useState(null)
  const [course, setCourse] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attendanceStatus, setAttendanceStatus] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [attendanceMethod, setAttendanceMethod] = useState("qrcode")
  const [verificationCode, setVerificationCode] = useState("")
  const [isCameraActive, setIsCameraActive] = useState(false)

  useEffect(() => {
    if (!user) {
      toast.error("You must be logged in to mark attendance")
      router.push("/login")
      return
    }

    if (user.role !== "student") {
      toast.error("Only students can mark attendance")
      router.push("/dashboard")
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const timetableData = await timetableService.getTimetable(id)
        setTimetable(timetableData)

        if (timetableData.course) {
          const courseData = await courseService.getCourse(timetableData.course)
          setCourse(courseData)

          // Check if student is enrolled in this course
          if (!courseData.students?.includes(user.id)) {
            toast.error("You are not enrolled in this course")
            router.push("/dashboard")
            return
          }
        }

        // Check if attendance already marked
        try {
          const attendanceData = await attendanceService.getAttendanceByTimetable(id, user.id)
          if (attendanceData) {
            setAttendanceStatus(attendanceData.status)
          }
        } catch (error) {
          // Attendance not marked yet, which is fine
          console.log("Attendance not marked yet")
        }

        // Get user's location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              })
            },
            (error) => {
              console.error("Error getting location:", error)
              setLocationError("Unable to get your location. Please enable location services.")
            },
          )
        } else {
          setLocationError("Geolocation is not supported by your browser")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load class details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, user, router])

  const handleMarkAttendance = async (method = "qrcode") => {
    if (!user || !timetable) return

    try {
      setIsSubmitting(true)

      // Determine status based on class start time
      const now = new Date()
      const classStartTime = new Date(timetable.startTime)
      const fifteenMinutesAfterStart = new Date(classStartTime.getTime() + 15 * 60000)

      let status = "present"
      if (now > fifteenMinutesAfterStart) {
        status = "late"
      }

      // Add method-specific remarks
      let remarks = `Marked via ${method}.`

      if (method === "geolocation" && userLocation) {
        remarks += ` Location: ${userLocation.latitude}, ${userLocation.longitude}`
      } else if (method === "code") {
        remarks += ` Verification code: ${verificationCode}`
      }

      await attendanceService.markAttendance({
        timetableId: id,
        studentId: user.id,
        status,
        remarks,
      })

      setAttendanceStatus(status)
      toast.success(`Attendance marked as ${status}`)
    } catch (error) {
      console.error("Error marking attendance:", error)
      toast.error("Failed to mark attendance")
    } finally {
      setIsSubmitting(false)
      setIsCameraActive(false)
    }
  }

  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      toast.error("Please enter a verification code")
      return
    }

    // In a real app, you would verify this code with your backend
    handleMarkAttendance("code")
  }

  const handleFacialRecognition = () => {
    setIsCameraActive(true)

    // Simulate facial recognition process
    setTimeout(() => {
      handleMarkAttendance("facial")
    }, 2000)
  }

  const handleBiometricAuth = () => {
    // Simulate biometric authentication
    setTimeout(() => {
      handleMarkAttendance("biometric")
    }, 1000)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Loading...</CardTitle>
            <CardDescription className="text-center">Please wait while we load the class details</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!timetable || !course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Class Not Found</CardTitle>
            <CardDescription className="text-center">
              The class you are looking for does not exist or has been removed
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{course.name}</CardTitle>
          <CardDescription className="text-center capitalize">
            {timetable.classType} - {course.code}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(timetable.startTime).toLocaleDateString()}</span>
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

          {attendanceStatus ? (
            <div className="mt-6 rounded-md bg-green-50 p-4 text-center">
              <Check className="mx-auto h-8 w-8 text-green-500" />
              <p className="mt-2 text-lg font-medium text-green-800">Attendance Marked</p>
              <p className="text-sm text-green-600 capitalize">You are marked as {attendanceStatus} for this class</p>
            </div>
          ) : (
            <div className="mt-4">
              <Tabs defaultValue={attendanceMethod} onValueChange={setAttendanceMethod}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="qrcode">QR Code</TabsTrigger>
                  <TabsTrigger value="geolocation">Location</TabsTrigger>
                  <TabsTrigger value="facial">Facial</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                </TabsList>
                <TabsContent value="qrcode" className="mt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Your attendance will be recorded using the QR code method.
                    </p>
                    <Button className="w-full" onClick={() => handleMarkAttendance("qrcode")} disabled={isSubmitting}>
                      {isSubmitting ? "Marking..." : "Mark Attendance"}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="geolocation" className="mt-4">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">Your location will be used to verify your presence.</p>
                    {userLocation ? (
                      <div className="rounded-md bg-muted p-2 text-xs">
                        Location captured: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                      </div>
                    ) : locationError ? (
                      <div className="rounded-md bg-red-50 p-2 text-xs text-red-600">{locationError}</div>
                    ) : (
                      <div className="rounded-md bg-muted p-2 text-xs">Acquiring location...</div>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => handleMarkAttendance("geolocation")}
                      disabled={isSubmitting || !userLocation}
                    >
                      {isSubmitting ? "Marking..." : "Mark Attendance"}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="facial" className="mt-4">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Facial recognition will be used to verify your identity.
                    </p>
                    {isCameraActive ? (
                      <div className="rounded-md bg-muted p-4 text-center">
                        <Camera className="mx-auto h-8 w-8 text-muted-foreground animate-pulse" />
                        <p className="mt-2 text-sm">Processing...</p>
                      </div>
                    ) : (
                      <Button className="w-full" onClick={handleFacialRecognition} disabled={isSubmitting}>
                        <Camera className="mr-2 h-4 w-4" />
                        Start Facial Recognition
                      </Button>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="code" className="mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Verification Code</Label>
                      <Input
                        id="code"
                        placeholder="Enter the code provided by your lecturer"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={handleVerifyCode} disabled={isSubmitting}>
                      {isSubmitting ? "Verifying..." : "Verify Code"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

