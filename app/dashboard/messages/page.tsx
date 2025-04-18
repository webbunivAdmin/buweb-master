"use client"

import { useAuth } from "@/lib/auth-provider"
import { useSocket } from "@/lib/socket-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Plus, Search, Users, UserPlus } from "lucide-react"
import Link from "next/link"
import { chatService, groupService } from "@/lib/api-service"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Chat {
  _id: string
  participants: {
    _id: string
    name: string
    avatar?: string
  }[]
  isGroup?: boolean
  groupName?: string
  lastMessage?: {
    _id: string
    content: string
    sender: string
    createdAt: string
    readBy: string[]
  }
  updatedAt: string
}

interface Group {
  _id: string
  name: string
  description?: string
  type: "class" | "office" | "department" | "discussion"
  members: {
    _id: string
    name: string
    avatar?: string
  }[]
  lastMessage?: {
    _id: string
    content: string
    sender: string
    createdAt: string
  }
  updatedAt: string
}

export default function MessagesPage() {
  const { user } = useAuth()
  const { socket, isConnected, onlineUsers } = useSocket()
  const [chats, setChats] = useState<Chat[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("direct")

  // Fetch chats and groups when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Fetch direct chats
        const chatData = await chatService.getUserChats(user.id)
        setChats(chatData)

        // Fetch groups
        const groupData = await groupService.getUserGroups(user.id)
        setGroups(groupData)
      } catch (err: any) {
        console.error("Error fetching conversations:", err)
        setError("Failed to load conversations. Please try again later.")
        toast.error("Failed to load conversations", {
          description: err.message || "Please try refreshing the page",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket || !user || !isConnected) return

    // Listen for new messages
    const handleNewMessage = (message: any) => {
      setChats((prevChats) => {
        // Find if the chat already exists
        const chatExists = prevChats.some((chat) => chat._id === message.chatId)

        if (chatExists) {
          // Update existing chat with new message
          return prevChats
            .map((chat) => {
              if (chat._id === message.chatId) {
                return {
                  ...chat,
                  lastMessage: {
                    _id: message._id,
                    content: message.content,
                    sender: message.sender,
                    createdAt: message.createdAt,
                    readBy: message.readBy || [],
                  },
                  updatedAt: message.createdAt,
                }
              }
              return chat
            })
            .sort((a, b) => {
              const timeA = a.lastMessage?.createdAt || a.updatedAt
              const timeB = b.lastMessage?.createdAt || b.updatedAt
              return new Date(timeB).getTime() - new Date(timeA).getTime()
            })
        } else {
          // If it's a new chat, we'll handle it with the newChat event
          return prevChats
        }
      })
    }

    // Listen for new group messages
    const handleNewGroupMessage = (message: any) => {
      setGroups((prevGroups) => {
        // Find if the group already exists
        const groupExists = prevGroups.some((group) => group._id === message.groupId)

        if (groupExists) {
          // Update existing group with new message
          return prevGroups
            .map((group) => {
              if (group._id === message.groupId) {
                return {
                  ...group,
                  lastMessage: {
                    _id: message._id,
                    content: message.content,
                    sender: message.sender,
                    createdAt: message.createdAt,
                  },
                  updatedAt: message.createdAt,
                }
              }
              return group
            })
            .sort((a, b) => {
              const timeA = a.lastMessage?.createdAt || a.updatedAt
              const timeB = b.lastMessage?.createdAt || b.updatedAt
              return new Date(timeB).getTime() - new Date(timeA).getTime()
            })
        } else {
          // If it's a new group, we'll handle it with the newGroup event
          return prevGroups
        }
      })
    }

    // Listen for new chats
    const handleNewChat = (chat: Chat) => {
      setChats((prevChats) => {
        // Check if chat already exists to prevent duplicates
        if (prevChats.some((c) => c._id === chat._id)) {
          return prevChats
        }
        return [chat, ...prevChats]
      })
    }

    // Listen for new groups
    const handleNewGroup = (group: Group) => {
      setGroups((prevGroups) => {
        // Check if group already exists to prevent duplicates
        if (prevGroups.some((g) => g._id === group._id)) {
          return prevGroups
        }
        return [group, ...prevGroups]
      })
    }

    // Listen for message read updates
    const handleMessageRead = ({
      messageId,
      chatId,
      userId,
    }: { messageId: string; chatId: string; userId: string }) => {
      if (userId !== user.id) {
        setChats((prevChats) => {
          return prevChats.map((chat) => {
            if (chat._id === chatId && chat.lastMessage?._id === messageId) {
              return {
                ...chat,
                lastMessage: {
                  ...chat.lastMessage,
                  readBy: [...(chat.lastMessage.readBy || []), userId],
                },
              }
            }
            return chat
          })
        })
      }
    }

    // Register event listeners
    socket.on("newMessage", handleNewMessage)
    socket.on("newGroupMessage", handleNewGroupMessage)
    socket.on("newChat", handleNewChat)
    socket.on("newGroup", handleNewGroup)
    socket.on("messageRead", handleMessageRead)

    // Emit user online status
    socket.emit("userOnline", user.id)

    // Cleanup
    return () => {
      socket.off("newMessage", handleNewMessage)
      socket.off("newGroupMessage", handleNewGroupMessage)
      socket.off("newChat", handleNewChat)
      socket.off("newGroup", handleNewGroup)
      socket.off("messageRead", handleMessageRead)
    }
  }, [socket, user, isConnected])

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true

    // For private chats, search in the other participant's name
    if (!chat.isGroup && chat.participants.length === 2) {
      const otherParticipant = chat.participants.find((p) => p._id !== user?.id)
      return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase())
    }

    return false
  })

  // Filter groups based on search query
  const filteredGroups = groups.filter((group) => {
    if (!searchQuery.trim()) return true
    return group.name.toLowerCase().includes(searchQuery.toLowerCase())
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
    if (chat.isGroup) return null
    return chat.participants.find((p) => p._id !== user?.id)
  }

  const isParticipantOnline = (participantId: string) => {
    return onlineUsers.includes(participantId)
  }

  const hasUnreadMessages = (chat: Chat) => {
    return (
      chat.lastMessage &&
      chat.lastMessage.sender !== user?.id &&
      (!chat.lastMessage.readBy || !chat.lastMessage.readBy.includes(user?.id || ""))
    )
  }

  // Sort chats by last message time (most recent first)
  const sortedChats = [...filteredChats].sort((a, b) => {
    const timeA = a.lastMessage?.createdAt || a.updatedAt
    const timeB = b.lastMessage?.createdAt || b.updatedAt
    return new Date(timeB).getTime() - new Date(timeA).getTime()
  })

  // Sort groups by last message time (most recent first)
  const sortedGroups = [...filteredGroups].sort((a, b) => {
    const timeA = a.lastMessage?.createdAt || a.updatedAt
    const timeB = b.lastMessage?.createdAt || b.updatedAt
    return new Date(timeB).getTime() - new Date(timeA).getTime()
  })

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Message
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/messages/new" className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Direct Message</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/messages/new-group" className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Create Group</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

      <Tabs defaultValue="direct" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="direct" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Direct Messages</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Groups</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="direct">
          <Card>
            <CardHeader className="border-b p-4">
              <CardTitle>Direct Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 p-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <Skeleton className="h-3 w-10" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex h-40 flex-col items-center justify-center p-4">
                  <p className="text-center text-destructive mb-2">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLoading(true)
                      setError(null)
                      Promise.all([
                        chatService.getUserChats(user?.id || ""),
                        groupService.getUserGroups(user?.id || ""),
                      ])
                        .then(([chatData, groupData]) => {
                          setChats(chatData)
                          setGroups(groupData)
                        })
                        .catch((err) => {
                          console.error("Error retrying fetch:", err)
                          setError("Failed to load conversations. Please try again later.")
                          toast.error("Failed to load conversations")
                        })
                        .finally(() => setLoading(false))
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              ) : sortedChats.length > 0 ? (
                <ul className="divide-y">
                  {sortedChats.map((chat) => {
                    const otherParticipant = getOtherParticipant(chat)
                    const isOnline = otherParticipant ? isParticipantOnline(otherParticipant._id) : false
                    const unread = hasUnreadMessages(chat)
                    const unreadCount = unread ? 1 : 0 // This would be dynamic in a real app

                    return (
                      <li key={chat._id}>
                        <Link
                          href={`/dashboard/messages/${chat._id}`}
                          className="block p-4 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {chat.isGroup ? (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                  <Users className="h-5 w-5 text-primary" />
                                </div>
                              ) : otherParticipant ? (
                                <Avatar>
                                  <AvatarImage src={otherParticipant.avatar || "/placeholder.svg?height=40&width=40"} />
                                  <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                  <MessageSquare className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              {isOnline && !chat.isGroup && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background"></span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className={`truncate font-medium ${unread ? "font-bold" : ""}`}>
                                  {chat.isGroup ? chat.groupName : otherParticipant?.name || "Unknown User"}
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                  {chat.lastMessage
                                    ? formatTime(chat.lastMessage.createdAt)
                                    : formatTime(chat.updatedAt)}
                                </span>
                              </div>
                              <p
                                className={`truncate text-sm ${
                                  unread ? "font-semibold text-foreground" : "text-muted-foreground"
                                }`}
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
                            {unreadCount > 0 && (
                              <Badge variant="default" className="ml-2">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center p-4">
                  <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">No direct messages found</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href="/dashboard/messages/new">Start a new conversation</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardHeader className="border-b p-4">
              <CardTitle>Group Chats</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 p-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <Skeleton className="h-3 w-10" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex h-40 flex-col items-center justify-center p-4">
                  <p className="text-center text-destructive mb-2">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLoading(true)
                      setError(null)
                      Promise.all([
                        chatService.getUserChats(user?.id || ""),
                        groupService.getUserGroups(user?.id || ""),
                      ])
                        .then(([chatData, groupData]) => {
                          setChats(chatData)
                          setGroups(groupData)
                        })
                        .catch((err) => {
                          console.error("Error retrying fetch:", err)
                          setError("Failed to load conversations. Please try again later.")
                          toast.error("Failed to load conversations")
                        })
                        .finally(() => setLoading(false))
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              ) : sortedGroups.length > 0 ? (
                <ul className="divide-y">
                  {sortedGroups.map((group) => {
                    return (
                      <li key={group._id}>
                        <Link
                          href={`/dashboard/messages/groups/${group._id}`}
                          className="block p-4 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h3 className="truncate font-medium">{group.name}</h3>
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {group.type}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {group.lastMessage
                                    ? formatTime(group.lastMessage.createdAt)
                                    : formatTime(group.updatedAt)}
                                </span>
                              </div>
                              <p className="truncate text-sm text-muted-foreground">
                                {group.lastMessage ? (
                                  group.lastMessage.sender === user?.id ? (
                                    <span>You: {group.lastMessage.content}</span>
                                  ) : (
                                    <>
                                      <span className="font-medium">
                                        {group.members.find((m) => m._id === group.lastMessage?.sender)?.name ||
                                          "Someone"}
                                        :
                                      </span>{" "}
                                      {group.lastMessage.content}
                                    </>
                                  )
                                ) : (
                                  "No messages yet"
                                )}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center p-4">
                  <Users className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">No group chats found</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href="/dashboard/messages/new-group">Create a new group</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

