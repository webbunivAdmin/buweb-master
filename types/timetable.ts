import { Course } from './courses'

export interface Timetable {
    _id: string
    course: string
    classType: string
    startTime: string
    endTime: string
    location: string
    lecturer: User[]
    students: User[]
    classRepresentative: User[]
    endDate: string
    repeatsWeekly: boolean
    isOnline: boolean
}

interface User {
    id: string
    name: string
    email: string
    role: string
    avatar?: string
    registrationNumber?: string
    isVerified: boolean
    department: string
    
}
  