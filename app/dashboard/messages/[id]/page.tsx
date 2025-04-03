"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Paperclip, Send, User } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
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
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchChat = async () => {
      if (!user) return

      try {
        // Fetch chat details - this endpoint isn't explicitly shown in your API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/${params.id}`)
        if (!response.ok) throw new Error("Failed to fetch chat")
        const chatData = await response.json()
        setChat(chatData)

        // Fetch messages - this endpoint isn't explicitly shown in your API
        const messagesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/${params.id}/messages`)
        if (!messagesResponse.ok) throw new Error("Failed to fetch messages")
        const messagesData = await messagesResponse.json()

        const formattedMessages = messagesData.map((message: any) => ({
          _id: message._id,
          sender: message.sender,
          content: message.content,
          createdAt: message.createdAt,
          fileUrl: message.fileUrl,
          type: message.type,
          senderName: message.senderName || "Unknown",
          senderAvatar: message.senderAvatar,
          isSelf: message.sender === user.id,
        }))

        setMessages(formattedMessages)
      } catch (error) {
        console.error("Error fetching conversation:", error)
        toast({
          title: "Error",
          description: "Failed to load conversation. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchChat()

    // Set up real-time subscription for new messages
    // This would typically be done with a WebSocket connection
    const messageSubscription = setInterval(() => {
      if (user && params.id) {
        // Poll for new messages
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chats/${params.id}/messages?after=${messages.length > 0 ? messages[messages.length - 1].createdAt : ""}`,
        )
          .then((response) => {
            if (response.ok) return response.json()
            throw new Error("Failed to fetch new messages")
          })
          .then((newMessages) => {
            if (newMessages && newMessages.length > 0) {
              const formattedNewMessages = newMessages.map((message: any) => ({
                _id: message._id,
                sender: message.sender,
                content: message.content,
                createdAt: message.createdAt,
                fileUrl: message.fileUrl,
                type: message.type,
                senderName: message.senderName || "Unknown",
                senderAvatar: message.senderAvatar,
                isSelf: message.sender === user.id,
              }))

              setMessages((prev) => [...prev, ...formattedNewMessages])
            }
          })
          .catch((error) => {
            console.error("Error polling for new messages:", error)
          })
      }
    }, 5000) // Poll every 5 seconds

    return () => {
      clearInterval(messageSubscription)
    }
  }, [user, params.id, toast, messages.length])

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || (!newMessage.trim() && !file) || !chat) return

    setSending(true)
    try {
      let fileUrl = null
      let fileType = null

      if (file) {
        // Simulate file upload and getting a URL
        fileUrl = URL.createObjectURL(file)
        fileType = file.type.split("/")[0] // e.g., 'image', 'application', etc.
      }

      const messageData = {
        senderId: user.id,
        chatId: chat._id,
        content: newMessage.trim(),
        fileUrl,
        type: fileType,
      }

      const data = await chatService.sendMessage(messageData)

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
      }

      setMessages((prev) => [...prev, newMessageObj])
      setNewMessage("")
      setFile(null)

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
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

  if (chat) {
    if (chat.isGroup) {
      conversationTitle = chat.groupName || "Group Conversation"
    } else {
      const otherParticipant = chat.participants.find((p) => p._id !== user?.id)
      conversationTitle = otherParticipant?.name || "Conversation"
      conversationAvatar = otherParticipant?.avatar
    }
  }

  return (
    <div className="container flex h-[calc(100vh-4rem)] flex-col py-6">
      <div className="mb-4 flex items-center gap-4">
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
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversationAvatar || "/placeholder.svg?height=40&width=40"} />
              <AvatarFallback>{conversationTitle.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
          <h1 className="text-xl font-bold">{conversationTitle}</h1>
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

                              <p
                                className={`mt-1 text-right text-xs ${
                                  message.isSelf ? "text-primary-foreground/70" : "text-muted-foreground"
                                }`}
                              >
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
                onChange={(e) => setNewMessage(e.target.value)}
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

