"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-provider"
import { useSocket } from "@/lib/socket-provider"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Paperclip, Send, User, Check, CheckCheck } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { chatService } from "@/lib/api-service"

interface Message {
  _id: string
  sender: string
  content: string
  createdAt: string
  fileUrl?: string
  type?: string
  senderName?: string
  senderAvatar?: string
  isSelf: boolean
  readBy?: string[]
}

interface Chat {
  _id: string
  participants: {
    _id: string
    name: string
    avatar?: string
  }[]
  isGroup: boolean
  groupName?: string
}

export default function ConversationPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const {
    socket,
    isConnected,
    onlineUsers,
    joinChat,
    sendMessage: emitMessage,
    setTyping,
    markMessageAsRead,
  } = useSocket()
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Join the chat room when component mounts
  useEffect(() => {
    if (isConnected && params.id) {
      joinChat(params.id)
    }
  }, [isConnected, params.id, joinChat])

  // Listen for new messages
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: any) => {
      if (message.chatId === params.id) {
        const formattedMessage = {
          _id: message._id,
          sender: message.sender,
          content: message.content,
          createdAt: message.createdAt,
          fileUrl: message.fileUrl,
          type: message.type,
          senderName: message.senderName,
          senderAvatar: message.senderAvatar,
          readBy: message.readBy || [],
          isSelf: message.sender === user?.id,
        }

        setMessages((prev) => [...prev, formattedMessage])

        // Mark message as read if it's not from the current user
        if (message.sender !== user?.id) {
          markMessageAsRead(message._id, params.id)
          chatService.markMessagesAsRead(params.id, user?.id || "")
        }
      }
    }

    const handleTypingUpdate = ({ chatId, typingUsers: users }: { chatId: string; typingUsers: string[] }) => {
      if (chatId === params.id) {
        setTypingUsers(users.filter((id) => id !== user?.id))
      }
    }

    const handleMessageReadUpdate = ({ messageId, userId }: { messageId: string; userId: string }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, readBy: [...(msg.readBy || []), userId] } : msg)),
      )
    }

    socket.on("newMessage", handleNewMessage)
    socket.on("userTyping", handleTypingUpdate)
    socket.on("messageReadUpdate", handleMessageReadUpdate)

    return () => {
      socket.off("newMessage", handleNewMessage)
      socket.off("userTyping", handleTypingUpdate)
      socket.off("messageReadUpdate", handleMessageReadUpdate)
    }
  }, [socket, params.id, user?.id, markMessageAsRead])

  useEffect(() => {
    const fetchChat = async () => {
      if (!user) return

      try {
        // Fetch chat details
        const chatData = await chatService.getUserChats(user.id)
        const currentChat = chatData.find((c: any) => c._id === params.id)

        if (!currentChat) throw new Error("Chat not found")

        setChat({
          _id: currentChat._id,
          participants: currentChat.participants,
          isGroup: currentChat.participants.length > 2,
          groupName: currentChat.name,
        })

        // Fetch messages
        const messagesData = await chatService.getChatMessages(params.id)

        const formattedMessages = messagesData.map((message: any) => ({
          _id: message._id,
          sender: message.sender._id,
          content: message.content,
          createdAt: message.createdAt,
          fileUrl: message.fileUrl,
          type: message.type,
          senderName: message.sender.name || "Unknown",
          senderAvatar: message.sender.avatar,
          readBy: message.readBy || [],
          isSelf: message.sender._id === user.id,
        }))

        setMessages(formattedMessages)

        // Mark all messages as read
        await chatService.markMessagesAsRead(params.id, user.id)
      } catch (error) {
        console.error("Error fetching conversation:", error)
        toast.error("Failed to load conversation", {
          description: "Please try again later",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchChat()
  }, [user, params.id])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    // Handle typing indicator
    if (isConnected) {
      // Send typing indicator
      setTyping(params.id, true)

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(params.id, false)
      }, 2000)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || (!newMessage.trim() && !file) || !chat) return

    setSending(true)
    try {
      let fileUrl = null
      let fileType = null

      if (file) {
        // Upload file
        const formData = new FormData()
        formData.append("file", file)
        formData.append("chatId", chat._id)

        const fileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        })

        if (!fileResponse.ok) throw new Error("Failed to upload file")

        const fileData = await fileResponse.json()
        fileUrl = fileData.fileUrl
        fileType = fileData.fileType
      }

      const messageData = {
        senderId: user.id,
        chatId: chat._id,
        content: newMessage.trim(),
        fileUrl,
        type: fileType,
        senderName: user.name,
        senderAvatar: user.avatar,
        createdAt: new Date().toISOString(),
        readBy: [user.id],
      }

      // Send message to server
      const data = await chatService.sendMessage({
        senderId: user.id,
        chatId: chat._id,
        content: newMessage.trim(),
        fileUrl,
        type: fileType,
      })

      // Emit the message via socket
      emitMessage({
        ...messageData,
        _id: data._id,
        recipientId: chat.participants.find((p) => p._id !== user.id)?._id,
      })

      // Add the new message to the UI immediately
      const newMessageObj = {
        _id: data._id,
        sender: user.id,
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        fileUrl,
        type: fileType,
        senderName: user.name,
        senderAvatar: user.avatar,
        isSelf: true,
        readBy: [user.id],
      }

      setMessages((prev) => [...prev, newMessageObj])
      setNewMessage("")
      setFile(null)

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        setTyping(params.id, false)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message", {
        description: "Please try again",
      })
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  }

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {}
  messages.forEach((message) => {
    const date = new Date(message.createdAt).toLocaleDateString()
    if (!groupedMessages[date]) {
      groupedMessages[date] = []
    }
    groupedMessages[date].push(message)
  })

  // Get conversation title and avatar
  let conversationTitle = "Conversation"
  let conversationAvatar = null
  let otherParticipantId = null

  if (chat) {
    if (chat.isGroup) {
      conversationTitle = chat.groupName || "Group Conversation"
    } else {
      const otherParticipant = chat.participants.find((p) => p._id !== user?.id)
      if (otherParticipant) {
        conversationTitle = otherParticipant.name || "Conversation"
        conversationAvatar = otherParticipant.avatar
        otherParticipantId = otherParticipant._id
      }
    }
  }

  // Check if other participant is online
  const isOtherParticipantOnline = otherParticipantId ? onlineUsers.includes(otherParticipantId) : false

  return (
    <div className="container flex h-[calc(100vh-4rem)] flex-col py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/messages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            {chat?.isGroup ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
            ) : (
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversationAvatar || "/placeholder.svg?height=40&width=40"} />
                  <AvatarFallback>{conversationTitle.charAt(0)}</AvatarFallback>
                </Avatar>
                {isOtherParticipantOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background"></span>
                )}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{conversationTitle}</h1>
              {!chat?.isGroup && (
                <p className="text-xs text-muted-foreground">{isOtherParticipantOnline ? "Online" : "Offline"}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="flex h-full flex-col p-0">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : messages.length > 0 ? (
            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date} className="mb-6">
                  <div className="mb-4 flex justify-center">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      {formatDate(dateMessages[0].createdAt)}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {dateMessages.map((message) => (
                      <div key={message._id} className={`flex ${message.isSelf ? "justify-end" : "justify-start"}`}>
                        <div className={`flex max-w-[80%] gap-2 ${message.isSelf ? "flex-row-reverse" : "flex-row"}`}>
                          {!message.isSelf && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.senderAvatar || "/placeholder.svg?height=32&width=32"} />
                              <AvatarFallback>{message.senderName?.charAt(0) || "?"}</AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            {!message.isSelf && chat?.isGroup && (
                              <p className="mb-1 text-xs text-muted-foreground">{message.senderName}</p>
                            )}
                            <div
                              className={`rounded-lg p-3 ${
                                message.isSelf ? "bg-primary text-primary-foreground" : "bg-muted"
                              }`}
                            >
                              {message.fileUrl && message.type === "image" && (
                                <div className="mb-2">
                                  <img
                                    src={message.fileUrl || "/placeholder.svg"}
                                    alt="Attachment"
                                    className="max-h-60 rounded-md object-contain"
                                  />
                                </div>
                              )}

                              {message.fileUrl && message.type !== "image" && (
                                <div className="mb-2">
                                  <a
                                    href={message.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 rounded-md border p-2 ${
                                      message.isSelf ? "border-primary-foreground/20" : "border-muted-foreground/20"
                                    }`}
                                  >
                                    <Paperclip className="h-4 w-4" />
                                    <span className="text-sm">Attachment</span>
                                  </a>
                                </div>
                              )}

                              {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}

                              <div className="mt-1 flex items-center justify-end gap-1">
                                <p
                                  className={`text-right text-xs ${
                                    message.isSelf ? "text-primary-foreground/70" : "text-muted-foreground"
                                  }`}
                                >
                                  {formatTime(message.createdAt)}
                                </p>

                                {message.isSelf && (
                                  <span className="text-xs">
                                    {message.readBy && message.readBy.includes(otherParticipantId || "") ? (
                                      <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                                    ) : (
                                      <Check className="h-3 w-3 text-primary-foreground/70" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                  <span className="text-xs">
                    {chat?.isGroup ? `${typingUsers.length} people typing...` : "Typing..."}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-4">
              <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          )}

          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={handleFileSelect}>
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleInputChange}
                disabled={sending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={(!newMessage.trim() && !file) || sending}
                className="shrink-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
            {file && (
              <div className="mt-2 flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Remove
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

