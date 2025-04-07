"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Check, MapPin, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface AttendanceMarkingProps {
  timetable: any
  isLecturer: boolean
  onMarkAttendance: (status: "present" | "absent" | "late", remarks?: string) => void
  attendanceRecords: any[]
}

export function AttendanceMarking({
  timetable,
  isLecturer,
  onMarkAttendance,
  attendanceRecords,
}: AttendanceMarkingProps) {
  const [status, setStatus] = useState<"present" | "absent" | "late">("present")
  const [remarks, setRemarks] = useState("")
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isWithinRange, setIsWithinRange] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasMarkedAttendance, setHasMarkedAttendance] = useState(false)

  // Check if the user has already marked attendance for this class
  useEffect(() => {
    // In a real app, you would check if the user has already marked attendance
    // For now, we'll just set it to false
    setHasMarkedAttendance(false)
  }, [timetable])

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position.coords)

          // Check if user is within range of the class location
          // In a real app, you would compare with the actual class location
          // For now, we'll just randomly determine if they're in range
          setIsWithinRange(Math.random() > 0.3) // 70% chance of being in range
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationError(
            error.code === 1
              ? "Location permission denied. Please enable location services."
              : "Could not get your location. Please try again.",
          )
        },
      )
    } else {
      setLocationError("Geolocation is not supported by your browser.")
    }
  }, [])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Check if user is within range of the class location
      if (!isWithinRange && status === "present") {
        // Allow the user to override with confirmation
        if (
          !confirm("You don't appear to be at the class location. Are you sure you want to mark yourself as present?")
        ) {
          return
        }
      }

      await onMarkAttendance(status, remarks)
      setHasMarkedAttendance(true)
      toast.success(`Attendance marked as ${status}`)
    } catch (error) {
      console.error("Error marking attendance:", error)
      toast.error("Failed to mark attendance")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasMarkedAttendance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Marked</CardTitle>
          <CardDescription>You have already marked your attendance for this class.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
        <CardDescription>
          {isLecturer
            ? "Mark attendance for students or review attendance records."
            : "Mark your attendance for this class."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {locationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Location Error</AlertTitle>
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        {location && isWithinRange === false && (
          <Alert className="mb-4">
            <MapPin className="h-4 w-4" />
            <AlertTitle>Location Warning</AlertTitle>
            <AlertDescription>
              You don't appear to be at the class location. You can still mark your attendance, but it will be noted
              that you were not physically present.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">Attendance Status</h3>
            <RadioGroup value={status} onValueChange={(value) => setStatus(value as "present" | "absent" | "late")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="present" id="present" />
                <Label htmlFor="present">Present</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="late" id="late" />
                <Label htmlFor="late">Late</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="absent" id="absent" />
                <Label htmlFor="absent">Absent</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Add any additional information..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting || !location}>
            {isSubmitting ? "Submitting..." : "Mark Attendance"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

