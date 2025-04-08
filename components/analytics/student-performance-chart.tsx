"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartLegend, ChartTitle } from "@/components/ui/chart"
import { useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface StudentPerformanceChartProps {
  data: {
    courseId: string
    courseName: string
    students: {
      id: string
      name: string
      attendanceRate: number
    }[]
  }[]
}

export function StudentPerformanceChart({ data }: StudentPerformanceChartProps) {
  const [selectedCourse, setSelectedCourse] = useState(data[0]?.courseId || "")

  const courseData = data.find((course) => course.courseId === selectedCourse)

  // Group students by attendance rate ranges
  const groupedData = [
    { name: "90-100%", value: 0, color: "#22c55e" },
    { name: "75-89%", value: 0, color: "#84cc16" },
    { name: "60-74%", value: 0, color: "#eab308" },
    { name: "40-59%", value: 0, color: "#f97316" },
    { name: "0-39%", value: 0, color: "#ef4444" },
  ]

  courseData?.students.forEach((student) => {
    const rate = student.attendanceRate
    if (rate >= 90) groupedData[0].value++
    else if (rate >= 75) groupedData[1].value++
    else if (rate >= 60) groupedData[2].value++
    else if (rate >= 40) groupedData[3].value++
    else groupedData[4].value++
  })

  // Filter out empty groups
  const chartData = groupedData.filter((group) => group.value > 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Student Performance</CardTitle>
            <CardDescription>Student attendance distribution by course</CardDescription>
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {data.map((course) => (
                <SelectItem key={course.courseId} value={course.courseId}>
                  {course.courseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer>
            <ChartTitle>Student Attendance Distribution</ChartTitle>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<ChartLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

