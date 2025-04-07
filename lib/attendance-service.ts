import axios from "axios"

// Create an axios instance with the API base URL
const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds timeout
})

// Add a request interceptor to include authentication token
API.interceptors.request.use(
  (config) => {
    // Get token from localStorage or wherever you store it
    const token = localStorage.getItem("token")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export const attendanceService = {
  // Mark attendance for a student
  markAttendance: async (data: {
    timetableId: string
    studentId: string
    status: "present" | "absent" | "late"
    remarks?: string
  }) => {
    try {
      const response = await API.post("/attendance", data)
      return response.data
    } catch (error) {
      console.error("Error marking attendance:", error)
      throw error
    }
  },

  // Get attendance for a student in a specific timetable
  getAttendanceByTimetable: async (timetableId: string, studentId: string) => {
    try {
      const response = await API.get(`/attendance/${timetableId}/${studentId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching attendance records:", error)
      throw error
    }
  },

  // Get attendance for a specific course
  getCourseAttendance: async (courseId: string) => {
    try {
      const response = await API.get(`/attendance/course/${courseId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching course attendance:", error)
      throw error
    }
  },

  // Update attendance status
  updateAttendance: async (id: string, data: { status: "present" | "absent" | "late"; remarks?: string }) => {
    try {
      const response = await API.put(`/attendance/${id}`, data)
      return response.data
    } catch (error) {
      console.error("Error updating attendance record:", error)
      throw error
    }
  },
}

