import axios from "axios"
import Cookies from "js-cookie"

// Create an axios instance with base URL
const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor to include auth token in requests
API.interceptors.request.use((config) => {
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
})

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
    return Promise.reject(error)
  },
)

// Auth Services
export const authService = {
  register: async (userData: any) => {
    const response = await API.post("/auth/register", userData)
    return response.data
  },

  verifyOTP: async (email: string, otp: string) => {
    const response = await API.post("/auth/verify-otp", { email, otp })
    return response.data
  },

  resetPasswordRequest: async (email: string) => {
    const response = await API.post("/auth/reset-password-request", { email })
    return response.data
  },

  resetPassword: async (resetToken: string, newPassword: string) => {
    const response = await API.post("/auth/reset-password", { resetToken, newPassword })
    return response.data
  },
}

// Announcement Services
export const announcementService = {
  createAnnouncement: async (announcementData: any) => {
    const response = await API.post("/announcements/create", announcementData)
    return response.data
  },

  getAllAnnouncements: async () => {
    const response = await API.get("/announcements")
    return response.data
  },

  getAnnouncementById: async (id: string) => {
    const response = await API.get(`/announcements/${id}`)
    return response.data
  },

  deleteAnnouncement: async (id: string) => {
    const response = await API.delete(`/announcements/${id}`)
    return response.data
  },
}

// Chat Services
export const chatService = {
  startChat: async (userId1: string, userId2: string) => {
    const response = await API.post("/chats/start", { userId1, userId2 })
    return response.data
  },

  sendMessage: async (messageData: any) => {
    const response = await API.post("/chats/send", messageData)
    return response.data
  },

  getChatMessages: async (chatId: string) => {
    const response = await API.get(`/chats/${chatId}/messages`)
    return response.data
  },

  markMessagesAsRead: async (chatId: string, userId: string) => {
    const response = await API.post("/chats/read", { chatId, userId })
    return response.data
  },

  getUserChats: async (userId: string) => {
    const response = await API.get(`/chats/user/${userId}`)
    return response.data
  },

  blockChat: async (chatId: string, userId: string) => {
    const response = await API.post("/chats/block", { chatId, userId })
    return response.data
  },
}

// Group Services
export const groupService = {
  createGroup: async (groupData: any) => {
    const response = await API.post("/groups/create", groupData)
    return response.data
  },

  sendGroupMessage: async (messageData: any) => {
    const response = await API.post("/groups/send", messageData)
    return response.data
  },

  requestToJoinGroup: async (userId: string, groupId: string) => {
    const response = await API.post("/groups/request-join", { userId, groupId })
    return response.data
  },
}

// Event Services
export const eventService = {
  createEvent: async (eventData: any) => {
    const response = await API.post("/events/create", eventData)
    return response.data
  },

  getAllEvents: async () => {
    const response = await API.get("/events")
    return response.data
  },

  getEventById: async (id: string) => {
    const response = await API.get(`/events/${id}`)
    return response.data
  },

  updateEvent: async (eventId: string, eventData: any) => {
    const response = await API.put(`/events/${eventId}`, eventData)
    return response.data
  },

  deleteEvent: async (eventId: string) => {
    const response = await API.delete(`/events/${eventId}`)
    return response.data
  },
}

// Notification Services
export const notificationService = {
  sendNotification: async (notificationData: any) => {
    const response = await API.post("/notifications/send", notificationData)
    return response.data
  },

  getNotifications: async (userId: string) => {
    const response = await API.get(`/notifications/${userId}`)
    return response.data
  },

  markAsRead: async (notificationId: string) => {
    const response = await API.put(`/notifications/read/${notificationId}`)
    return response.data
  },
}

// Message Services
export const messageService = {
  editMessage: async (messageId: string, newContent: string) => {
    const response = await API.put(`/messages/${messageId}`, { newContent })
    return response.data
  },

  deleteMessage: async (messageId: string) => {
    const response = await API.delete(`/messages/${messageId}`)
    return response.data
  },
}

// User Services
export const userService = {
  updateProfile: async (userData: any) => {
    const response = await API.put("/users/profile", userData)
    return response.data
  },

  getProfile: async () => {
    const response = await API.get("/users/profile")
    return response.data
  },

  getAllUsers: async () => {
    const response = await API.get("/users")
    return response.data
  },
}

