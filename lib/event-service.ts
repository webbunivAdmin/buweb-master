import axios from "axios"
import Cookies from "js-cookie"
import { useAuth } from "./auth-provider"

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds timeout
})

// Add a request interceptor to include auth token in requests
API.interceptors.request.use(
  (config) => {
    let token

    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // Try to get token from localStorage first, then from cookies
      token = localStorage.getItem("token") || Cookies.get("token")
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Check if we're in a browser environment
      if (typeof window !== "undefined") {
        // Clear auth data
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        Cookies.remove("token")

        // Redirect to login page
        window.location.href = "/login"
      }
    }

    // Create a more informative error
    const enhancedError = new Error(error.response?.data?.error || error.message || "An unknown error occurred") as any
    (enhancedError as any).status = error.response?.status
    enhancedError.data = error.response?.data

    return Promise.reject(enhancedError)
  },
)

export const eventService = {
  createEvent: async (eventData: any) => {
    let user;
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user") || Cookies.get("user");
      user = typeof storedUser === "string" ? JSON.parse(storedUser) : storedUser;
    }
    try {
      const response = await API.post(`/events/${user.id}`, eventData )
      return response.data
    } catch (error) {
      throw error
    }
  },

  getAllEvents: async () => {
    let user;
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user") || Cookies.get("user");
      user = typeof storedUser === "string" ? JSON.parse(storedUser) : storedUser;
    }
  
    try {
      const response = await API.get(`/events?creatorId=${user.id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEventById: async (eventId: string) => {
    try {
      const response = await API.get(`/events/${eventId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  updateEvent: async (eventData: any) => {
    try {
      const response = await API.put("/events", eventData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  deleteEvent: async (eventId: string) => {
    try {
      const response = await API.delete(`/events/${eventId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

