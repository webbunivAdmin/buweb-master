"use client"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Plus, Search, User } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface Conversation {
  id: string
  last_message: string
  last_message_time: string
  is_group: boolean
  other_user_id?: string
  other_user_name?: string
  other_user_avatar?: string
  group_name?: string
  unread_count: number
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Fetch conversations from API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) throw new Error("Failed to fetch conversations")

        const data = await response.json()
        setConversations(data)
      } catch (error) {
        console.error("Error fetching conversations:", error)
        toast.error("Failed to load conversations", {
          description: "Please try again later",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()

    // Set up polling for new messages
    const interval = setInterval(fetchConversations, 10000) // Poll every 10 seconds

    return () => clearInterval(interval)
  }, [user])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInDays === 1) {
      return "Yesterday"
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true

    const searchLower = searchQuery.toLowerCase()
    if (conv.is_group) {
      return conv.group_name?.toLowerCase().includes(searchLower)
    } else {
      return conv.other_user_name?.toLowerCase().includes(searchLower)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">Communicate with your peers, faculty, and staff</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/messages/new">
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Link>
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-0">
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <Link key={conversation.id} href={`/dashboard/messages/${conversation.id}`} className="block">
                  <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    {conversation.is_group ? (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-3/20">
                        <MessageSquare className="h-6 w-6 text-chart-3" />
                      </div>
                    ) : (
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={conversation.other_user_avatar || "/placeholder.svg?height=48&width=48"} />
                        <AvatarFallback className="bg-chart-1/20 text-chart-1">
                          {conversation.other_user_name?.charAt(0) || <User className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">
                          {conversation.is_group ? conversation.group_name : conversation.other_user_name}
                        </h3>
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">
                          {formatTime(conversation.last_message_time)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground truncate">{conversation.last_message}</p>
                        {conversation.unread_count > 0 && (
                          <Badge variant="default" className="ml-2 shrink-0 bg-chart-2">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-medium">No conversations yet</h3>
                <p className="text-muted-foreground">Start a new conversation to connect with others</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/messages/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Message
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

