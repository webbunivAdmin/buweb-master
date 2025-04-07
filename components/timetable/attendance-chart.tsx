"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useTheme } from "next-themes"

interface AttendanceChartProps {
  data: Record<string, any>
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  
  useEffect(() => {
    if (!chartRef.current || Object.keys(data).length === 0) return
    
    // Import Chart.js dynamically to avoid SSR issues
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables)
      
      // Prepare data for the chart
      const labels = Object.values(data).map((student: any) => student.studentName)
      const presentData = Object.values(data).map((student: any) => student.presentPercentage)
      const lateData = Object.values(data).map((student: any) => student.latePercentage)
      const absentData = Object.values(data).map((student: any) => student.absentPercentage)
      
      // Set colors based on theme
      const isDark = theme === 'dark'
      const textColor = isDark ? '#e5e7eb' : '#374151'
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
      
      // Create the chart
      const ctx = chartRef.current.getContext('2d')
      
      // Destroy previous chart if it exists
      const prevChart = Chart.getChart(chartRef.current)
      if (prevChart) {
        prevChart.destroy()
      }
      
      new Chart(ctx!, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Present',
              data: presentData,
              backgroundColor: 'rgba(34, 197, 94, 0.7)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 1
            },
            {
              label: 'Late',
              data: lateData,
              backgroundColor: 'rgba(234, 179, 8, 0.7)',
              borderColor: 'rgba(234, 179, 8, 1)',
              borderWidth: 1
            },
            {
              label: 'Absent',
              data: absentData,
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
              borderColor: 'rgba(239, 68, 68, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
              grid: {
                color: gridColor
              },
              ticks: {
                color: textColor
              }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              max: 100,
              grid: {
                color: gridColor
              },
              ticks: {
                color: textColor,
                callback: function(value) {
                  return value + '%'
                }
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: textColor
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + context.parsed.y + '%'
                }
              }
            }
          }
        }
      })
    })
  }, [data, theme])
  
  return (
    <div className="w-full h-[400px]">
      <canvas ref={chartRef}></canvas>
    </div>
  )
}
