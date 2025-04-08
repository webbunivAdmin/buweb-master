"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartLegend, ChartTitle } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface CourseComparisonChartProps {
  data: {
    name: string
    attendanceRate: number
    studentCount: number
  }[]
}

export function CourseComparisonChart({ data }: CourseComparisonChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Comparison</CardTitle>
        <CardDescription>Attendance rates across different courses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer>
            <ChartTitle>Attendance Rate by Course</ChartTitle>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<ChartLegend />} />
                <Bar dataKey="attendanceRate" name="Attendance Rate (%)" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

