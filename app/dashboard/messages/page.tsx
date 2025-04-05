"use client"

import { useAuth } from "@/lib/auth-provider"
import { useSocket } from "@/lib/socket-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, User } from "lucide-react"
import Link from "next/link"
import { chatService } from "@/lib/api-service"

interface Chat {
  _id: string
  participants: {
    _id: string
    name: string
    avatar?: string
  }[]
  lastMessage?: {
    _id: string
    content: string
    sender: string
    createdAt: string
    readBy: string[]
  }
  updatedAt: string
}

export default function MessagesPage() {
  const { user } = useAuth()
  const { onlineUsers } = useSocket()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return

      try {
        const data = await chatService.getUserChats(user.id)
        setChats(data)
      } catch (error) {
        console.error("Error fetching chats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [user])

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true

    // For private chats, search in the other participant's name
    if (chat.participants.length === 2) {
      const otherParticipant = chat.participants.find((p) => p._id !== user?.id)
      return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase())
    }

    // For group chats, we would search in the group name
    // This is a placeholder for when group chat functionality is implemented
    return true
  })

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    // If the message is from today, show the time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    // If the message is from yesterday, show "Yesterday"
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    }

    // Otherwise, show the date
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find((p) => p._id !== user?.id)
  }

  const isParticipantOnline = (participantId: string) => {
    return onlineUsers.includes(participantId)
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Button asChild>
          <Link href="/dashboard/messages/new">
            <Plus className="mr-2 h-4 w-4" /> New Message
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="border-b p-4">
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredChats.length > 0 ? (
            <ul className="divide-y">
              {filteredChats.map((chat) => {
                const otherParticipant = getOtherParticipant(chat)
                const isOnline = otherParticipant ? isParticipantOnline(otherParticipant._id) : false
                const hasUnreadMessages =
                  chat.lastMessage &&
                  chat.lastMessage.sender !== user?.id &&
                  (!chat.lastMessage.readBy || !chat.lastMessage.readBy.includes(user?.id || ""))

                return (
                  <li key={chat._id}>
                    <Link
                      href={`/dashboard/messages/${chat._id}`}
                      className="block p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {otherParticipant ? (
                            <Avatar>
                              <AvatarImage src={otherParticipant.avatar || "/placeholder.svg?height=40&width=40"} />
                              <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className={`truncate font-medium ${hasUnreadMessages ? "font-bold" : ""}`}>
                              {otherParticipant?.name || "Group Chat"}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {chat.lastMessage ? formatTime(chat.lastMessage.createdAt) : formatTime(chat.updatedAt)}
                            </span>
                          </div>
                          <p
                            className={`truncate text-sm ${hasUnreadMessages ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                          >
                            {chat.lastMessage ? (
                              chat.lastMessage.sender === user?.id ? (
                                <span>You: {chat.lastMessage.content}</span>
                              ) : (
                                chat.lastMessage.content
                              )
                            ) : (
                              "No messages yet"
                            )}
                          </p>
                        </div>
                        {hasUnreadMessages && <div className="ml-2 h-2.5 w-2.5 rounded-full bg-primary"></div>}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center p-4">
              <p className="text-center text-muted-foreground">No conversations found</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/dashboard/messages/new">Start a new conversation</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

