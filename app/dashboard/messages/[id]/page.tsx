"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-provider"
import { useSocket } from "@/lib/socket-provider"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Check, CheckCheck, Loader2, RefreshCw, Send } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { chatService } from "@/lib/api-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { use } from "react"

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

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use
  const unwrappedParams = use(params)
  const chatId = unwrappedParams.id

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
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)

  // Join the chat room when component mounts
  useEffect(() => {
    if (isConnected && chatId) {
      joinChat(chatId)
    }
  }, [isConnected, chatId, joinChat])

  // Listen for new messages
  useEffect(() => {
    if (!socket || !user) return

    const handleNewMessage = (message: any) => {
      console.log("New message received:", message)

      if (message.chatId === chatId) {
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
          isSelf: message.sender === user.id,
        }

        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          if (prev.some((m) => m._id === message._id)) {
            return prev
          }
          return [...prev, formattedMessage]
        })

        // Update last message ID reference
        lastMessageIdRef.current = message._id

        // Mark message as read if it's not from the current user
        if (message.sender !== user.id) {
          markMessageAsRead(message._id, chatId)
          chatService.markMessagesAsRead(chatId, user.id)
        }
      }
    }

    const handleTypingUpdate = ({ chatId: typingChatId, users }: { chatId: string; users: string[] }) => {
      if (typingChatId === chatId) {
        setTypingUsers(users.filter((id) => id !== user.id))
      }
    }

    const handleMessageReadUpdate = ({ messageId, userId }: { messageId: string; userId: string }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, readBy: [...(msg.readBy || []), userId] } : msg)),
      )
    }

    // Clean up any existing listeners before adding new ones
    socket.off("newMessage").off("userTyping").off("messageRead")

    // Add listeners
    socket.on("newMessage", handleNewMessage)
    socket.on("userTyping", handleTypingUpdate)
    socket.on("messageRead", handleMessageReadUpdate) // Make sure this matches the event name from the server

    return () => {
      socket.off("newMessage", handleNewMessage)
      socket.off("userTyping", handleTypingUpdate)
      socket.off("messageRead", handleMessageReadUpdate)
    }
  }, [socket, chatId, user, markMessageAsRead])

  // Fetch chat and messages
  const fetchMessages = async (isInitialLoad = false) => {
    if (!user) return

    try {
      if (isInitialLoad) {
        setLoading(true)
        setError(null)

        // Fetch chat details
        const chatData = await chatService.getUserChats(user.id)
        const currentChat = chatData.find((c: any) => c._id === chatId)

        if (!currentChat) {
          throw new Error("Chat not found")
        }

        setChat({
          _id: currentChat._id,
          participants: currentChat.participants,
          isGroup: currentChat.participants.length > 2,
          groupName: currentChat.name,
        })
      } else {
        setRefreshing(true)
      }

      // Fetch messages
      const messagesData = await chatService.getChatMessages(chatId)

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

      // Update last message ID reference
      if (formattedMessages.length > 0) {
        lastMessageIdRef.current = formattedMessages[formattedMessages.length - 1]._id
      }

      setMessages(formattedMessages)

      // Mark all messages as read
      await chatService.markMessagesAsRead(chatId, user.id)
    } catch (error) {
      console.error("Error fetching conversation:", error)
      if (isInitialLoad) {
        setError("Failed to load conversation. Please try again later.")
        toast.error("Failed to load conversation", {
          description: "Please try again later",
        })
      } else {
        console.error("Error refreshing messages:", error)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchMessages(true)
  }, [user, chatId])

  // Set up polling for message updates
  useEffect(() => {
    // Start polling interval
    pollingIntervalRef.current = setInterval(() => {
      if (!loading && !refreshing && user) {
        fetchMessages(false)
      }
    }, 5000) // Poll every 5 seconds

    // Clean up interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [loading, refreshing, user, chatId])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    // Handle typing indicator
    if (isConnected && user) {
      // Send typing indicator
      setTyping(chatId, true)

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(chatId, false)
      }, 2000)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim() || !chat) return

    setSending(true)
    try {
      // Prepare message data
      const messageData = {
        senderId: user.id,
        chatId: chat._id,
        content: newMessage.trim(),
        type: "text",
      }

      // Create optimistic message for immediate UI update
      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        sender: user.id,
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        type: "text",
        senderName: user.name,
        senderAvatar: user.avatar,
        isSelf: true,
        readBy: [user.id],
      }

      // Add optimistic message to UI
      setMessages((prev) => [...prev, optimisticMessage])

      // Clear input field immediately for better UX
      setNewMessage("")

      // Send message to server
      const data = await chatService.sendMessage(messageData)

      // Emit the message via socket
      emitMessage({
        ...messageData,
        _id: data._id,
        senderName: user.name,
        senderAvatar: user.avatar,
        createdAt: new Date().toISOString(),
        readBy: [user.id],
        recipientId: chat.participants.find((p) => p._id !== user.id)?._id,
      })

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === optimisticMessage._id
            ? {
                ...msg,
                _id: data._id,
                createdAt: data.createdAt || msg.createdAt,
              }
            : msg,
        ),
      )

      // Update last message ID reference
      lastMessageIdRef.current = data._id

      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        setTyping(chatId, false)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message", {
        description: "Please try again",
      })

      // Remove the optimistic message on error
      setMessages((prev) => prev.filter((msg) => !msg._id.startsWith("temp-")))

      // Restore the message to the input field
      setNewMessage(newMessage)
    } finally {
      setSending(false)
    }
  }

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchMessages(false)
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
    <div className="container max-w-4xl flex h-[calc(100vh-4rem)] flex-col py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/messages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            {chat?.isGroup ? (
              <Avatar className="h-10 w-10 bg-primary/10">
                <AvatarFallback>G</AvatarFallback>
              </Avatar>
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

        <Button
          variant="ghost"
          size="icon"
          onClick={handleManualRefresh}
          disabled={loading || refreshing}
          className="h-9 w-9"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh messages</span>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="flex-1 overflow-y-auto">
        <CardContent className="flex h-full flex-col p-0">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : messages.length > 0 ? (
            <ScrollArea className="flex-1 p-4">
              {refreshing && (
                <div className="flex justify-center mb-2">
                  <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Syncing messages...</span>
                  </div>
                </div>
              )}

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
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>

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
            </ScrollArea>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-4">
              <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          )}

          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleInputChange}
                disabled={sending || loading}
                className="focus-visible:ring-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim() || sending || loading}
                className="shrink-0 h-10 w-10"
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

