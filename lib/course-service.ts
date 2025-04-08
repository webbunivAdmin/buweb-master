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

export const courseService = {
  // Create a new course
  createCourse: async (courseData: {
    name: string
    code: string
    description?: string
    department: string
    students?: string[]
  }) => {
    try {
      const response = await API.post("/courses", courseData)
      return response.data
    } catch (error) {
      console.error("Error creating course:", error)
      throw error
    }
  },

  // Get all courses
  getAllCourses: async () => {
    try {
      const response = await API.get("/courses")
      return response.data
    } catch (error) {
      console.error("Error fetching courses:", error)
      throw error
    }
  },

  // Get a single course
  getCourse: async (id: string) => {
    try {
      const response = await API.get(`/courses/${id}`)
      return response.data
    } catch (error) {
      console.error("Error fetching course:", error)
      throw error
    }
  },

  // Update a course
  updateCourse: async (id: string, courseData: any) => {
    try {
      const response = await API.put(`/courses/${id}`, courseData)
      return response.data
    } catch (error) {
      console.error("Error updating course:", error)
      throw error
    }
  },

  // Delete a course
  deleteCourse: async (id: string) => {
    try {
      const response = await API.delete(`/courses/${id}`)
      return response.data
    } catch (error) {
      console.error("Error deleting course:", error)
      throw error
    }
  },
}

