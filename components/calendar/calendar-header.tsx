"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CalendarHeaderProps {
  currentDate: Date
  onDateChange: (date: Date) => void
}

export function CalendarHeader({ currentDate, onDateChange }: CalendarHeaderProps) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const handlePrevMonth = () => {
    const prevMonth = new Date(currentDate)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    onDateChange(prevMonth)
  }

  const handleNextMonth = () => {
    const nextMonth = new Date(currentDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    onDateChange(nextMonth)
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const handleMonthChange = (value: string) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(Number.parseInt(value))
    onDateChange(newDate)
  }

  const handleYearChange = (value: string) => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(Number.parseInt(value))
    onDateChange(newDate)
  }

  // Generate years for select (current year ± 10 years)
  const currentYear = currentDate.getFullYear()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="mx-1" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select value={currentDate.getMonth().toString()} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {monthNames.map((month, index) => (
              <SelectItem key={month} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentDate.getFullYear().toString()} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[90px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

