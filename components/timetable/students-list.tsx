"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Search, MoreVertical, Check, Clock, X } from "lucide-react"

interface StudentsListProps {
  timetable: any
  attendanceRecords: any[]
  onUpdateAttendance: (attendanceId: string, status: "present" | "absent" | "late", remarks?: string) => void
}

export function StudentsList({ timetable, attendanceRecords, onUpdateAttendance }: StudentsListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // In a real app, you would get the actual student list from the timetable
  // For now, we'll generate a mock list based on the attendance records
  const students = attendanceRecords.map((record) => ({
    id: record.student,
    name: record.studentName,
    attendanceId: record._id,
    status: record.status,
  }))

  const filteredStudents = students.filter((student) => student.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500">Present</Badge>
      case "late":
        return <Badge className="bg-yellow-500">Late</Badge>
      case "absent":
        return <Badge className="bg-red-500">Absent</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <Check className="h-4 w-4 text-green-500" />
      case "late":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "absent":
        return <X className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Students</CardTitle>
        <CardDescription>Manage student attendance for this class.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onUpdateAttendance(student.attendanceId, "present")}>
                            <Check className="mr-2 h-4 w-4" />
                            Mark Present
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateAttendance(student.attendanceId, "late")}>
                            <Clock className="mr-2 h-4 w-4" />
                            Mark Late
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateAttendance(student.attendanceId, "absent")}>
                            <X className="mr-2 h-4 w-4" />
                            Mark Absent
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

