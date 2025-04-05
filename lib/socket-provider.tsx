"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "./auth-provider"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  onlineUsers: string[]
  joinChat: (chatId: string) => void
  joinGroup: (groupId: string) => void
  sendMessage: (message: any) => void
  setTyping: (chatId: string, isTyping: boolean) => void
  markMessageAsRead: (messageId: string, chatId: string) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
  joinChat: () => {},
  joinGroup: () => {},
  sendMessage: () => {},
  setTyping: () => {},
  markMessageAsRead: () => {},
})

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const { user } = useAuth()

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
    setSocket(socketInstance)

    // Socket connection events
    socketInstance.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    socketInstance.on("onlineUsers", (users) => {
      setOnlineUsers(users)
    })

    socketInstance.on("userStatus", ({ userId, status }) => {
      if (status === "online" && !onlineUsers.includes(userId)) {
        setOnlineUsers((prev) => [...prev, userId])
      } else if (status === "offline") {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId))
      }
    })

    // Clean up on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Authenticate user when available
  useEffect(() => {
    if (socket && user && user.id) {
      socket.emit("authenticate", user.id)
    }
  }, [socket, user])

  // Socket methods
  const joinChat = (chatId: string) => {
    if (socket && chatId) {
      socket.emit("joinChat", chatId)
    }
  }

  const joinGroup = (groupId: string) => {
    if (socket && groupId) {
      socket.emit("joinGroup", groupId)
    }
  }

  const sendMessage = (message: any) => {
    if (socket) {
      socket.emit("sendMessage", message)
    }
  }

  const setTyping = (chatId: string, isTyping: boolean) => {
    if (socket && user) {
      socket.emit("typing", { userId: user.id, chatId, isTyping })
    }
  }

  const markMessageAsRead = (messageId: string, chatId: string) => {
    if (socket && user) {
      socket.emit("messageRead", { messageId, chatId, userId: user.id })
    }
  }

  const value = {
    socket,
    isConnected,
    onlineUsers,
    joinChat,
    joinGroup,
    sendMessage,
    setTyping,
    markMessageAsRead,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

