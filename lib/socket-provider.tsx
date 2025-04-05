"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  onlineUsers: string[]
  joinChat: (chatId: string) => void
  joinGroup: (groupId: string) => void
  leaveGroup: (groupId: string) => void
  sendMessage: (message: any) => void
  sendGroupMessage: (message: any) => void
  setTyping: (chatId: string, isTyping: boolean) => void
  setGroupTyping: (groupId: string, isTyping: boolean) => void
  markMessageAsRead: (messageId: string, chatId: string) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
  joinChat: () => {},
  joinGroup: () => {},
  leaveGroup: () => {},
  sendMessage: () => {},
  sendGroupMessage: () => {},
  setTyping: () => {},
  setGroupTyping: () => {},
  markMessageAsRead: () => {},
})

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      withCredentials: true,
      autoConnect: false,
    })

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    socketInstance.on("onlineUsers", (users: string[]) => {
      setOnlineUsers(users)
    })

    // Connect to socket server
    socketInstance.connect()

    // Set socket instance
    setSocket(socketInstance)

    // Clean up on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Join a chat room
  const joinChat = (chatId: string) => {
    if (socket && isConnected) {
      socket.emit("joinChat", chatId)
    }
  }

  // Join a group room
  const joinGroup = (groupId: string) => {
    if (socket && isConnected) {
      socket.emit("joinGroup", groupId)
    }
  }

  // Leave a group room
  const leaveGroup = (groupId: string) => {
    if (socket && isConnected) {
      socket.emit("leaveGroup", groupId)
    }
  }

  // Send a direct message
  const sendMessage = (message: any) => {
    if (socket && isConnected) {
      socket.emit("sendMessage", message)
    }
  }

  // Send a group message
  const sendGroupMessage = (message: any) => {
    if (socket && isConnected) {
      socket.emit("sendGroupMessage", message)
    }
  }

  // Set typing status for direct chat
  const setTyping = (chatId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit("typing", { chatId, isTyping })
    }
  }

  // Set typing status for group chat
  const setGroupTyping = (groupId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit("groupTyping", { groupId, isTyping })
    }
  }

  // Mark message as read
  const markMessageAsRead = (messageId: string, chatId: string) => {
    if (socket && isConnected) {
      socket.emit("markMessageRead", { messageId, chatId })
    }
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        joinChat,
        joinGroup,
        leaveGroup,
        sendMessage,
        sendGroupMessage,
        setTyping,
        setGroupTyping,
        markMessageAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

