import axios from "axios"
import Cookies from "js-cookie"

// Create an axios instance with base URL
const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
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
    enhancedError.status = error.response?.status
    enhancedError.data = error.response?.data

    return Promise.reject(enhancedError)
  },
)

// Auth Services
export const authService = {
  register: async (userData: any) => {
    const response = await API.post("/auth/register", userData)
    return response.data
  },

  login: async (email: string, password: string) => {
    const response = await API.post("/auth/login", { email, password })

    // Store token and user data
    if (response.data.token) {
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))
      Cookies.set("token", response.data.token, { expires: 7 }) // 7 days
    }

    return response.data
  },

  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    Cookies.remove("token")
    window.location.href = "/login"
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
    // Create FormData if there's a file to upload
    if (announcementData.fileData) {
      const formData = new FormData()
      formData.append("title", announcementData.title)
      formData.append("content", announcementData.content)
      formData.append("postedBy", announcementData.postedBy)

      if (announcementData.fileData.file) {
        formData.append("file", announcementData.fileData.file)
      }

      const response = await API.post("/announcements/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } else {
      // Regular JSON request if no file
      const response = await API.post("/announcements/create", announcementData)
      return response.data
    }
  },

  getAllAnnouncements: async () => {
    const response = await API.get("/announcements")
    return response.data
  },

  getAnnouncementById: async (id: string) => {
    const response = await API.get(`/announcements/${id}`)
    return response.data
  },

  updateAnnouncement: async (id: string, announcementData: any) => {
    // Create FormData if there's a file to upload
    if (announcementData.fileData) {
      const formData = new FormData()
      formData.append("title", announcementData.title)
      formData.append("content", announcementData.content)

      if (announcementData.fileData.file) {
        formData.append("file", announcementData.fileData.file)
      }

      const response = await API.put(`/announcements/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } else {
      // Regular JSON request if no file
      const response = await API.put(`/announcements/${id}`, announcementData)
      return response.data
    }
  },

  deleteAnnouncement: async (id: string) => {
    const response = await API.delete(`/announcements/${id}`)
    return response.data
  },
}


// Chat Services
export const chatService = {
  // Start a new chat between two users
  startChat: async (data: { userId1: string; userId2: string }) => {
    try {
      console.log("API startChat called with:", data)

      // Validate input
      if (!data.userId1 || !data.userId2) {
        throw new Error("Both user IDs are required")
      }

      const response = await API.post("/chats/start", data)
      return response.data
    } catch (error) {
      console.error("Error in startChat:", error)
      throw error
    }
  },

  // Send a message in a chat
  sendMessage: async (messageData: {
    chatId: string
    senderId: string
    content: string
    fileUrl?: string
    type?: string
  }) => {
    try {
      // Validate input
      if (!messageData.chatId || !messageData.senderId || !messageData.content) {
        throw new Error("Chat ID, sender ID, and content are required")
      }

      console.log("API sendMessage called with:", messageData)
      const response = await API.post("/chats/send", messageData)
      return response.data
    } catch (error) {
      console.error("Error in sendMessage:", error)
      throw error
    }
  },

  // Get messages for a chat
  getChatMessages: async (chatId: string, page = 1, limit = 50) => {
    try {
      if (!chatId) {
        throw new Error("Chat ID is required")
      }

      const response = await API.get(`/chats/${chatId}/messages`, {
        params: { page, limit },
      })
      return response.data
    } catch (error) {
      console.error("Error in getChatMessages:", error)
      throw error
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (chatId: string, userId: string) => {
    try {
      if (!chatId || !userId) {
        throw new Error("Chat ID and user ID are required")
      }

      const response = await API.post("/chats/read", { chatId, userId })
      return response.data
    } catch (error) {
      console.error("Error in markMessagesAsRead:", error)
      throw error
    }
  },

  // Get all chats for a user
  getUserChats: async (userId: string) => {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      const response = await API.get(`/chats/user/${userId}`)
      return response.data
    } catch (error) {
      console.error("Error in getUserChats:", error)
      throw error
    }
  },

  // Block a chat
  blockChat: async (chatId: string, userId: string) => {
    try {
      const response = await API.post("/chats/block", { chatId, userId })
      return response.data
    } catch (error) {
      console.error("Error in blockChat:", error)
      throw error
    }
  },

  // Unblock a chat
  unblockChat: async (chatId: string, userId: string) => {
    try {
      const response = await API.post("/chats/unblock", { chatId, userId })
      return response.data
    } catch (error) {
      console.error("Error in unblockChat:", error)
      throw error
    }
  },

  // Check if a chat is blocked
  isChatBlocked: async (chatId: string) => {
    try {
      const response = await API.get(`/chats/${chatId}/blocked`)
      return response.data
    } catch (error) {
      console.error("Error in isChatBlocked:", error)
      throw error
    }
  },

  // Upload a file for a chat
  uploadFile: async (file: File, chatId: string, senderId: string) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("chatId", chatId)
      formData.append("senderId", senderId)

      const response = await API.post("/chats/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      console.error("Error in uploadFile:", error)
      throw error
    }
  },
}

// Group Services
export const groupService = {
  // Create a new group
  createGroup: async (groupData: {
    name: string
    description?: string
    type: string
    adminId: string
    members: string[]
    initialMessage?: string
  }) => {
    try {
      console.log("API createGroup called with:", groupData)

      // Validate input
      if (!groupData.name || !groupData.adminId || !groupData.members || groupData.members.length === 0) {
        throw new Error("Group name, admin ID, and at least one member are required")
      }

      const response = await API.post("/groups/create", groupData)
      return response.data
    } catch (error) {
      console.error("Error in createGroup:", error)
      throw error
    }
  },

  // Send a message to a group
  sendGroupMessage: async (messageData: {
    groupId: string
    senderId: string
    content: string
    fileUrl?: string
    type?: string
  }) => {
    try {
      // Validate input
      if (!messageData.groupId || !messageData.senderId || !messageData.content) {
        throw new Error("Group ID, sender ID, and content are required")
      }

      const response = await API.post("/groups/send", messageData)
      return response.data
    } catch (error) {
      console.error("Error in sendGroupMessage:", error)
      throw error
    }
  },

  // Get all groups for a user
  getUserGroups: async (userId: string) => {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      const response = await API.get(`/groups/user/${userId}`)
      return response.data
    } catch (error) {
      console.error("Error in getUserGroups:", error)
      throw error
    }
  },

  // Get group details
  getGroupDetails: async (groupId: string) => {
    try {
      if (!groupId) {
        throw new Error("Group ID is required")
      }

      const response = await API.get(`/groups/${groupId}`)
      return response.data
    } catch (error) {
      console.error("Error in getGroupDetails:", error)
      throw error
    }
  },

  // Get messages for a group
  getGroupMessages: async (groupId: string, page = 1, limit = 50) => {
    try {
      if (!groupId) {
        throw new Error("Group ID is required")
      }

      const response = await API.get(`/groups/${groupId}/messages`, {
        params: { page, limit },
      })
      return response.data
    } catch (error) {
      console.error("Error in getGroupMessages:", error)
      throw error
    }
  },

  // Add members to a group
  addGroupMembers: async (groupId: string, memberIds: string[]) => {
    try {
      if (!groupId || !memberIds || memberIds.length === 0) {
        throw new Error("Group ID and at least one member ID are required")
      }

      const response = await API.post(`/groups/${groupId}/members`, { memberIds })
      return response.data
    } catch (error) {
      console.error("Error in addGroupMembers:", error)
      throw error
    }
  },

  // Remove a member from a group
  removeGroupMember: async (groupId: string, memberId: string) => {
    try {
      if (!groupId || !memberId) {
        throw new Error("Group ID and member ID are required")
      }

      const response = await API.delete(`/groups/${groupId}/members/${memberId}`)
      return response.data
    } catch (error) {
      console.error("Error in removeGroupMember:", error)
      throw error
    }
  },

  // Request to join a group
  requestToJoinGroup: async (userId: string, groupId: string) => {
    try {
      if (!userId || !groupId) {
        throw new Error("User ID and group ID are required")
      }

      const response = await API.post("/groups/request-join", { userId, groupId })
      return response.data
    } catch (error) {
      console.error("Error in requestToJoinGroup:", error)
      throw error
    }
  },

  // Get pending join requests for a group
  getGroupJoinRequests: async (groupId: string) => {
    try {
      if (!groupId) {
        throw new Error("Group ID is required")
      }

      const response = await API.get(`/groups/${groupId}/join-requests`)
      return response.data
    } catch (error) {
      console.error("Error in getGroupJoinRequests:", error)
      throw error
    }
  },

  // Approve a join request
  approveJoinRequest: async (groupId: string, userId: string, adminId: string) => {
    try {
      if (!groupId || !userId || !adminId) {
        throw new Error("Group ID, user ID, and admin ID are required")
      }

      const response = await API.post(`/groups/${groupId}/approve`, { userId, adminId })
      return response.data
    } catch (error) {
      console.error("Error in approveJoinRequest:", error)
      throw error
    }
  },

  // Reject a join request
  rejectJoinRequest: async (groupId: string, userId: string, adminId: string) => {
    try {
      if (!groupId || !userId || !adminId) {
        throw new Error("Group ID, user ID, and admin ID are required")
      }

      const response = await API.post(`/groups/${groupId}/reject`, { userId, adminId })
      return response.data
    } catch (error) {
      console.error("Error in rejectJoinRequest:", error)
      throw error
    }
  },

  // Leave a group
  leaveGroup: async (groupId: string, userId: string) => {
    try {
      if (!groupId || !userId) {
        throw new Error("Group ID and user ID are required")
      }

      const response = await API.post(`/groups/${groupId}/leave`, { userId })
      return response.data
    } catch (error) {
      console.error("Error in leaveGroup:", error)
      throw error
    }
  },

  // Update group details
  updateGroup: async (
    groupId: string,
    updateData: {
      name?: string
      description?: string
      type?: string
      isPublic?: boolean
    },
  ) => {
    try {
      if (!groupId) {
        throw new Error("Group ID is required")
      }

      const response = await API.put(`/groups/${groupId}`, updateData)
      return response.data
    } catch (error) {
      console.error("Error in updateGroup:", error)
      throw error
    }
  },

  // Make a user an admin of a group
  makeGroupAdmin: async (groupId: string, userId: string, adminId: string) => {
    try {
      if (!groupId || !userId || !adminId) {
        throw new Error("Group ID, user ID, and admin ID are required")
      }

      const response = await API.post(`/groups/${groupId}/make-admin`, { userId, adminId })
      return response.data
    } catch (error) {
      console.error("Error in makeGroupAdmin:", error)
      throw error
    }
  },

  // Remove admin status from a user
  removeGroupAdmin: async (groupId: string, userId: string, adminId: string) => {
    try {
      if (!groupId || !userId || !adminId) {
        throw new Error("Group ID, user ID, and admin ID are required")
      }

      const response = await API.post(`/groups/${groupId}/remove-admin`, { userId, adminId })
      return response.data
    } catch (error) {
      console.error("Error in removeGroupAdmin:", error)
      throw error
    }
  },

  // Pin a message in a group
  pinGroupMessage: async (groupId: string, messageId: string, userId: string) => {
    try {
      if (!groupId || !messageId || !userId) {
        throw new Error("Group ID, message ID, and user ID are required")
      }

      const response = await API.post(`/groups/${groupId}/pin-message`, { messageId, userId })
      return response.data
    } catch (error) {
      console.error("Error in pinGroupMessage:", error)
      throw error
    }
  },

  // Unpin a message in a group
  unpinGroupMessage: async (groupId: string, messageId: string, userId: string) => {
    try {
      if (!groupId || !messageId || !userId) {
        throw new Error("Group ID, message ID, and user ID are required")
      }

      const response = await API.post(`/groups/${groupId}/unpin-message`, { messageId, userId })
      return response.data
    } catch (error) {
      console.error("Error in unpinGroupMessage:", error)
      throw error
    }
  },

  // Get pinned messages in a group
  getPinnedMessages: async (groupId: string) => {
    try {
      if (!groupId) {
        throw new Error("Group ID is required")
      }

      const response = await API.get(`/groups/${groupId}/pinned-messages`)
      return response.data
    } catch (error) {
      console.error("Error in getPinnedMessages:", error)
      throw error
    }
  },

  // Upload a file for a group message
  uploadGroupFile: async (file: File, groupId: string, senderId: string) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("groupId", groupId)
      formData.append("senderId", senderId)

      const response = await API.post("/groups/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      console.error("Error in uploadGroupFile:", error)
      throw error
    }
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

  getUserById: async (userId: string) => {
    const response = await API.get(`/users/${userId}`)
    return response.data
  },

  searchUsers: async (query: string) => {
    const response = await API.get(`/users/search`, {
      params: { query },
    })
    return response.data
  },
}

