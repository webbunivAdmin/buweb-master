"use client"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Plus, Search, User } from "lucide-react"

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
        // Fetch direct conversations
        const { data: directConversations, error: directError } = await supabase
          .from("conversations")
          .select(`
            id,
            last_message,
            last_message_time,
            is_group,
            participants!inner(
              user_id,
              profiles(id, full_name, avatar_url)
            )
          `)
          .eq("participants.user_id", user.id)
          .eq("is_group", false)
          .order("last_message_time", { ascending: false })

        if (directError) throw directError

        // Fetch group conversations
        const { data: groupConversations, error: groupError } = await supabase
          .from("conversations")
          .select(`
            id,
            last_message,
            last_message_time,
            is_group,
            group_name,
            participants!inner(user_id)
          `)
          .eq("participants.user_id", user.id)
          .eq("is_group", true)
          .order("last_message_time", { ascending: false })

        if (groupError) throw groupError

        // Fetch unread counts
        const { data: unreadCounts, error: unreadError } = await supabase
          .from("messages")
          .select("conversation_id, count")
          .eq("recipient_id", user.id)
          .eq("read", false)
          .group("conversation_id")

        if (unreadError) throw unreadError

        const unreadMap = new Map()
        unreadCounts?.forEach((item) => {
          unreadMap.set(item.conversation_id, Number.parseInt(item.count))
        })

        // Format direct conversations
        const formattedDirectConversations = directConversations?.map((conv) => {
          const otherParticipant = conv.participants.find((p) => p.user_id !== user.id)

          return {
            id: conv.id,
            last_message: conv.last_message,
            last_message_time: conv.last_message_time,
            is_group: false,
            other_user_id: otherParticipant?.user_id,
            other_user_name: otherParticipant?.profiles?.full_name || "Unknown",
            other_user_avatar: otherParticipant?.profiles?.avatar_url || null,
            unread_count: unreadMap.get(conv.id) || 0,
          }
        })

        // Format group conversations
        const formattedGroupConversations = groupConversations?.map((conv) => {
          return {
            id: conv.id,
            last_message: conv.last_message,
            last_message_time: conv.last_message_time,
            is_group: true,
            group_name: conv.group_name,
            unread_count: unreadMap.get(conv.id) || 0,
          }
        })

        // Combine and sort by last message time
        const allConversations = [...(formattedDirectConversations || []), ...(formattedGroupConversations || [])].sort(
          (a, b) => {
            return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
          },
        )

        setConversations(allConversations)
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()

    // Set up real-time subscription for new messages
    const conversationsSubscription = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          // Refresh conversations when there's an update
          fetchConversations()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(conversationsSubscription)
    }
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
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Messages</h1>
        <Button asChild>
          <Link href="/dashboard/messages/new">
            <Plus className="mr-2 h-4 w-4" />
            New Message
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
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent>
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
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <MessageSquare className="h-6 w-6 text-primary" />
                      </div>
                    ) : (
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.other_user_avatar || "/placeholder.svg?height=48&width=48"} />
                        <AvatarFallback>
                          {conversation.other_user_name?.charAt(0) || <User className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">
                          {conversation.is_group ? conversation.group_name : conversation.other_user_name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conversation.last_message_time)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground line-clamp-1">{conversation.last_message}</p>
                        {conversation.unread_count > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                            {conversation.unread_count}
                          </span>
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

