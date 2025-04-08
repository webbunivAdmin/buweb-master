export interface Course {
    _id: string
    name: string
    code: string
    department: string
    description: string
    startDate: string
    endDate: string
    attendanceRate: number
    students: User[]
}

export interface User {
    _id: string
    name: string
    email: string
    role: string
    avatar?: string
    registrationNumber?: string
    isVerified: boolean
}
  