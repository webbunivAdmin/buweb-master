"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "./auth-provider"
import { toast } from "sonner"

// Define types for our context
interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  onlineUsers: string[]
  typingUsers: Map<string, string[]>
  joinChat: (chatId: string) => void
  leaveChat: (chatId: string) => void
  sendMessage: (message: any) => void
  setTyping: (chatId: string, isTyping: boolean) => void
  markMessageAsRead: (messageId: string, chatId: string) => void
}

// Create context with default values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
  typingUsers: new Map(),
  joinChat: () => {},
  leaveChat: () => {},
  sendMessage: () => {},
  setTyping: () => {},
  markMessageAsRead: () => {},
})

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<Map<string, string[]>>(new Map())
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // Initialize socket connection
  useEffect(() => {
    // Only initialize socket if user is authenticated
    if (!user || !token) return

    console.log("Initializing socket connection...")

    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      auth: {
        token,
      },
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })

    // Set socket instance
    setSocket(socketInstance)

    // Socket connection events
    socketInstance.on("connect", () => {
      console.log("Socket connected with ID:", socketInstance.id)
      setIsConnected(true)
      reconnectAttempts.current = 0

      // Authenticate user
      socketInstance.emit("authenticate", {
        userId: user.id,
        userName: user.name,
      })
    })

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      reconnectAttempts.current += 1

      if (reconnectAttempts.current >= maxReconnectAttempts) {
        toast.error("Connection lost", {
          description: "Unable to connect to messaging service. Please refresh the page.",
        })
      }
    })

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason)
      setIsConnected(false)

      if (reason === "io server disconnect") {
        // The server has forcefully disconnected the socket
        toast.error("Disconnected from server", {
          description: "You were disconnected from the messaging service.",
        })
      }
    })

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts")
      toast.success("Reconnected", {
        description: "You are back online.",
      })
    })

    socketInstance.on("onlineUsers", (users: string[]) => {
      console.log("Online users updated:", users)
      setOnlineUsers(users)
    })

    socketInstance.on("userTyping", ({ chatId, users }: { chatId: string; users: string[] }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev)
        newMap.set(chatId, users)
        return newMap
      })
    })

    // Cleanup function
    return () => {
      console.log("Cleaning up socket connection...")
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, [user, token])

  // Join a chat room
  const joinChat = useCallback(
    (chatId: string) => {
      if (!socket || !isConnected) return

      console.log("Joining chat room:", chatId)
      socket.emit("joinChat", { chatId, userId: user?.id })
    },
    [socket, isConnected, user],
  )

  // Leave a chat room
  const leaveChat = useCallback(
    (chatId: string) => {
      if (!socket || !isConnected) return

      console.log("Leaving chat room:", chatId)
      socket.emit("leaveChat", { chatId, userId: user?.id })
    },
    [socket, isConnected, user],
  )

  // Send a message
  const sendMessage = useCallback(
    (message: any) => {
      if (!socket || !isConnected) return

      console.log("Sending message:", message)
      socket.emit("sendMessage", message)
    },
    [socket, isConnected],
  )

  // Set typing status
  const setTyping = useCallback(
    (chatId: string, isTyping: boolean) => {
      if (!socket || !isConnected || !user) return

      console.log("Setting typing status:", { chatId, isTyping, userId: user.id })
      socket.emit("typing", { chatId, isTyping, userId: user.id })
    },
    [socket, isConnected, user],
  )

  // Mark message as read
  const markMessageAsRead = useCallback(
    (messageId: string, chatId: string) => {
      if (!socket || !isConnected || !user) return

      console.log("Marking message as read:", { messageId, chatId, userId: user.id })
      socket.emit("messageRead", { messageId, chatId, userId: user.id })
    },
    [socket, isConnected, user],
  )

  // Context value
  const value = {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    joinChat,
    leaveChat,
    sendMessage,
    setTyping,
    markMessageAsRead,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

// Custom hook to use the socket
export const useSocket = () => useContext(SocketContext)

