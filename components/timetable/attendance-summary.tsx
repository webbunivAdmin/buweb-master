"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AttendanceSummaryProps {
  courses: any[]
  loading: boolean
}

export function AttendanceSummary({ courses, loading }: AttendanceSummaryProps) {
  const [attendanceData, setAttendanceData] = useState<any[]>([])

  useEffect(() => {
    if (courses.length > 0) {
      // In a real app, you would fetch actual attendance data from the API
      // For now, we'll generate mock data
      const mockAttendance = courses.map((course) => {
        const total = Math.floor(Math.random() * 20) + 5 // 5-25 classes
        const attended = Math.floor(Math.random() * total) // 0-total classes attended
        const percentage = Math.round((attended / total) * 100)

        return {
          courseId: course._id,
          courseName: course.name,
          courseCode: course.code,
          total,
          attended,
          percentage,
        }
      })

      // Sort by attendance percentage (ascending)
      mockAttendance.sort((a, b) => a.percentage - b.percentage)

      setAttendanceData(mockAttendance)
    }
  }, [courses])

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (attendanceData.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No attendance data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {attendanceData.map((item) => (
        <div key={item.courseId} className="space-y-2">
          <div className="flex justify-between">
            <div className="font-medium">{item.courseCode}</div>
            <div className="text-sm">
              {item.attended}/{item.total} classes
            </div>
          </div>
          <Progress value={item.percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{item.courseName}</span>
            <span>{item.percentage}%</span>
          </div>
        </div>
      ))}

      <Button variant="outline" className="w-full" asChild>
        <Link href="/dashboard/timetable/attendance">View Full Attendance</Link>
      </Button>
    </div>
  )
}

