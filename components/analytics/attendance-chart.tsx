"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartLegend, ChartTitle } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts"

interface AttendanceChartProps {
  data: {
    courseId: string
    courseName: string
    attendanceData: {
      date: string
      present: number
      late: number
      absent: number
      total: number
    }[]
  }[]
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  const [selectedCourse, setSelectedCourse] = useState(data[0]?.courseId || "")
  const [chartType, setChartType] = useState("bar")

  const courseData = data.find((course) => course.courseId === selectedCourse)?.attendanceData || []

  // Calculate attendance rate for line chart
  const rateData = courseData.map((item) => ({
    date: item.date,
    rate: Math.round(((item.present + item.late) / item.total) * 100),
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Attendance Analytics</CardTitle>
            <CardDescription>Attendance statistics by course and date</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
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
            <Tabs value={chartType} onValueChange={setChartType} className="w-[180px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bar">Bar</TabsTrigger>
                <TabsTrigger value="line">Line</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartType === "bar" ? (
            <ChartContainer>
              <ChartTitle>Attendance by Date</ChartTitle>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={courseData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend content={<ChartLegend />} />
                  <Bar dataKey="present" name="Present" fill="#22c55e" />
                  <Bar dataKey="late" name="Late" fill="#f59e0b" />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <ChartContainer>
              <ChartTitle>Attendance Rate Trend</ChartTitle>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={rateData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend content={<ChartLegend />} />
                  <Line type="monotone" dataKey="rate" name="Attendance Rate (%)" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

