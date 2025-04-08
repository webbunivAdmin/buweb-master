"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Smartphone, MapPin, Camera, Fingerprint } from "lucide-react"
import { toast } from "sonner"

interface AttendanceMethodsProps {
  timetableId: string
  onAttendanceMarked: (method: string) => void
}

export function AttendanceMethods({ timetableId, onAttendanceMarked }: AttendanceMethodsProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState(`${window.location.origin}/attendance/${timetableId}`)
  const [isCapturing, setIsCapturing] = useState(false)
  const [location, setLocation] = useState<GeolocationPosition | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState("")

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position)
          setLocationError(null)
          toast.success("Location captured successfully")
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationError("Unable to get your location. Please enable location services.")
          toast.error("Failed to capture location")
        },
      )
    } else {
      setLocationError("Geolocation is not supported by your browser")
      toast.error("Geolocation not supported")
    }
  }

  const handleStartCamera = () => {
    setIsCapturing(true)
    // In a real app, you would implement facial recognition or QR code scanning here
    setTimeout(() => {
      setIsCapturing(false)
      toast.success("Facial recognition completed")
      onAttendanceMarked("facial")
    }, 2000)
  }

  const handleVerifyCode = () => {
    if (verificationCode.trim() === "") {
      toast.error("Please enter a verification code")
      return
    }

    // In a real app, you would verify the code with your backend
    toast.success("Verification code accepted")
    onAttendanceMarked("code")
  }

  const handleBiometricAuth = () => {
    // In a real app, you would implement biometric authentication here
    toast.success("Biometric authentication successful")
    onAttendanceMarked("biometric")
  }

  return (
    <Tabs defaultValue="qrcode" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="qrcode">QR Code</TabsTrigger>
        <TabsTrigger value="geolocation">Geolocation</TabsTrigger>
        <TabsTrigger value="facial">Facial</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
        <TabsTrigger value="biometric">Biometric</TabsTrigger>
      </TabsList>

      <TabsContent value="qrcode" className="space-y-4 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>QR Code Attendance</CardTitle>
            <CardDescription>Students can scan this QR code to mark their attendance</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                alt="Attendance QR Code"
                width={200}
                height={200}
              />
            </div>
            <p className="mt-4 text-sm text-center text-muted-foreground">
              Display this QR code for students to scan with their mobile devices
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(qrCodeUrl)
                toast.success("Link copied to clipboard")
              }}
            >
              Copy Link
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="geolocation" className="space-y-4 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Geolocation Attendance</CardTitle>
            <CardDescription>Mark attendance based on student's physical location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <MapPin className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Students must be physically present within the designated area to mark attendance
              </p>
              {location && (
                <div className="mt-4 p-3 border rounded-md bg-muted">
                  <p className="text-sm font-medium">Location captured:</p>
                  <p className="text-xs text-muted-foreground">
                    Latitude: {location.coords.latitude.toFixed(6)}, Longitude: {location.coords.longitude.toFixed(6)}
                  </p>
                </div>
              )}
              {locationError && (
                <div className="mt-4 p-3 border rounded-md bg-red-50 text-red-700">
                  <p className="text-sm">{locationError}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleGetLocation}>
              <MapPin className="mr-2 h-4 w-4" />
              Capture Location
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="facial" className="space-y-4 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Facial Recognition</CardTitle>
            <CardDescription>Mark attendance using facial recognition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <Camera className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Students can verify their identity using facial recognition technology
              </p>
              {isCapturing && (
                <div className="mt-4 p-3 border rounded-md bg-muted">
                  <p className="text-sm font-medium">Camera active...</p>
                  <p className="text-xs text-muted-foreground">Please look directly at the camera</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleStartCamera} disabled={isCapturing}>
              <Camera className="mr-2 h-4 w-4" />
              {isCapturing ? "Processing..." : "Start Camera"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="code" className="space-y-4 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Verification Code</CardTitle>
            <CardDescription>Mark attendance using a time-based verification code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <Smartphone className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Enter verification code</Label>
              <Input
                id="verificationCode"
                placeholder="Enter the code displayed in class"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The lecturer will provide a verification code during class
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleVerifyCode}>Verify Code</Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="biometric" className="space-y-4 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Biometric Authentication</CardTitle>
            <CardDescription>Mark attendance using fingerprint or other biometric data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <Fingerprint className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Use your device's biometric authentication to verify your identity
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleBiometricAuth}>
              <Fingerprint className="mr-2 h-4 w-4" />
              Authenticate
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

