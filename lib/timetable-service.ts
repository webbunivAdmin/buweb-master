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

export const timetableService = {
  // Create a new timetable
  createTimetable: async (timetableData: {
    course: string
    lecturer: string
    classType: string
    startTime: Date | string
    endTime: Date | string
    location: string
    classRepresentatives?: string[]
    repeatsWeekly: boolean
    endDate?: Date | string
    students?: string[]
  }) => {
    try {
      const response = await API.post("/timetables", timetableData)
      return response.data
    } catch (error) {
      console.error("Error creating timetable:", error)
      throw error
    }
  },

  // Get all timetables
  getAllTimetables: async () => {
    try {
      const response = await API.get("/timetables")
      return response.data
    } catch (error) {
      console.error("Error fetching timetables:", error)
      throw error
    }
  },

  // Get a single timetable
  getTimetable: async (id: string) => {
    try {
      const response = await API.get(`/timetables/${id}`)
      return response.data
    } catch (error) {
      console.error("Error fetching timetable:", error)
      throw error
    }
  },

  // Update a timetable
  updateTimetable: async (id: string, timetableData: any) => {
    try {
      const response = await API.put(`/timetables/${id}`, timetableData)
      return response.data
    } catch (error) {
      console.error("Error updating timetable:", error)
      throw error
    }
  },

  // Delete a timetable
  deleteTimetable: async (id: string) => {
    try {
      const response = await API.delete(`/timetables/${id}`)
      return response.data
    } catch (error) {
      console.error("Error deleting timetable:", error)
      throw error
    }
  },
}

