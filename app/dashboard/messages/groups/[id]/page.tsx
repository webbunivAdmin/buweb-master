"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-provider"
import { useSocket } from "@/lib/socket-provider"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Info,
  Loader2,
  MoreVertical,
  Pin,
  RefreshCw,
  Send,
  UserPlus,
  Users,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { groupService } from "@/lib/api-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { use } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

interface Message {
  _id: string
  sender: {
    _id: string
    name: string
    avatar?: string
  }
  content: string
  createdAt: string
  fileUrl?: string
  type?: string
  isSelf?: boolean
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
  admins: string[]
  isPublic: boolean
  pinnedMessages: Message[]
}

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use
  const unwrappedParams = use(params)
  const groupId = unwrappedParams.id

  const { user } = useAuth()
  const { socket, isConnected, onlineUsers } = useSocket()

  const [group, setGroup] = useState<Group | null>(null)
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

  // Join the group room when component mounts
  useEffect(() => {
    if (isConnected && groupId) {
      if (socket) {
        socket.emit("joinGroup", groupId)
      }
    }
  }, [isConnected, groupId, socket])

  // Listen for new group messages
  useEffect(() => {
    if (!socket || !user) return

    const handleNewGroupMessage = (message: any) => {
      console.log("New group message received:", message)

      if (message.groupId === groupId) {
        // Check if message already exists to prevent duplicates
        if (messages.some((m) => m._id === message._id)) {
          return
        }

        const formattedMessage = {
          ...message,
          isSelf: message.sender._id === user.id,
        }

        setMessages((prev) => [...prev, formattedMessage])

        // Update last message ID reference
        lastMessageIdRef.current = message._id
      }
    }

    const handleGroupTypingUpdate = ({ groupId: typingGroupId, users }: { groupId: string; users: string[] }) => {
      if (typingGroupId === groupId) {
        setTypingUsers(users.filter((id) => id !== user.id))
      }
    }

    // Clean up any existing listeners before adding new ones
    socket.off("newGroupMessage").off("groupUserTyping")

    // Add listeners
    socket.on("newGroupMessage", handleNewGroupMessage)
    socket.on("groupUserTyping", handleGroupTypingUpdate)

    return () => {
      socket.off("newGroupMessage", handleNewGroupMessage)
      socket.off("groupUserTyping", handleGroupTypingUpdate)
    }
  }, [socket, groupId, user, messages])

  // Fetch group and messages
  const fetchGroupData = async (isInitialLoad = false) => {
    if (!user) return

    try {
      if (isInitialLoad) {
        setLoading(true)
        setError(null)

        // Fetch group details
        const groupData = await groupService.getGroupDetails(groupId)

        if (!groupData) {
          throw new Error("Group not found")
        }

        setGroup(groupData)
      } else {
        setRefreshing(true)
      }

      // Fetch messages
      const messagesData = await groupService.getGroupMessages(groupId)

      // Format messages and add isSelf flag
      const formattedMessages = messagesData.map((message: any) => ({
        ...message,
        isSelf: message.sender._id === user.id,
      }))

      // Update last message ID reference
      if (formattedMessages.length > 0) {
        lastMessageIdRef.current = formattedMessages[formattedMessages.length - 1]._id
      }

      setMessages(formattedMessages)
    } catch (error: any) {
      console.error("Error fetching group data:", error)
      if (isInitialLoad) {
        setError("Failed to load group. Please try again later.")
        toast.error("Failed to load group", {
          description: error.message || "Please try again later",
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
    fetchGroupData(true)
  }, [user, groupId])

  // Set up polling for message updates
  useEffect(() => {
    // Start polling interval
    pollingIntervalRef.current = setInterval(() => {
      if (!loading && !refreshing && user) {
        fetchGroupData(false)
      }
    }, 5000) // Poll every 5 seconds

    // Clean up interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [loading, refreshing, user, groupId])

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
      if (socket) {
        socket.emit("groupTyping", { groupId, isTyping: true })
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (socket) {
          if (socket) {
            if (socket) {
              socket.emit("groupTyping", { groupId, isTyping: false })
            }
          }
        }
      }, 2000)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim() || !group) return

    setSending(true)
    try {
      // Prepare message data
      const messageData = {
        senderId: user.id,
        groupId: group._id,
        content: newMessage.trim(),
        type: "text",
      }

      // Create optimistic message for immediate UI update
      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        sender: {
          _id: user.id,
          name: user.name,
          avatar: user.avatar,
        },
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        type: "text",
        isSelf: true,
      }

      // Add optimistic message to UI
      setMessages((prev) => [...prev, optimisticMessage])

      // Clear input field immediately for better UX
      setNewMessage("")

      // Send message to server
      const data = await groupService.sendGroupMessage(messageData)

      // Emit the message via socket
      socket?.emit("sendGroupMessage", {
        ...data,
        groupId,
      })

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === optimisticMessage._id
            ? {
                ...data,
                isSelf: true,
              }
            : msg,
        ),
      )

      // Update last message ID reference
      lastMessageIdRef.current = data._id

      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        socket?.emit("groupTyping", { groupId, isTyping: false })
      }
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message", {
        description: error.message || "Please try again",
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
    fetchGroupData(false)
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

  // Check if user is admin
  const isAdmin = group?.admins.includes(user?.id || "")

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
            <Avatar className="h-10 w-10 bg-primary/10">
              <AvatarFallback>{group?.name.charAt(0) || "G"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{group?.name || "Group"}</h1>
                <Badge variant="outline" className="capitalize">
                  {group?.type || "group"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{group?.members.length || 0} members</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Members</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Group Members</SheetTitle>
                <SheetDescription>{group?.members.length || 0} members in this group</SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {group?.members.map((member) => {
                      const isOnline = onlineUsers.includes(member._id)
                      const memberIsAdmin = group.admins.includes(member._id)

                      return (
                        <div key={member._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar>
                                <AvatarImage src={member.avatar || "/placeholder.svg?height=40&width=40"} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {isOnline && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background"></span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{member.name}</p>
                                {memberIsAdmin && (
                                  <Badge variant="outline" className="text-xs">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{isOnline ? "Online" : "Offline"}</p>
                            </div>
                          </div>

                          {isAdmin && member._id !== user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!memberIsAdmin && <DropdownMenuItem>Make Admin</DropdownMenuItem>}
                                {memberIsAdmin && <DropdownMenuItem>Remove Admin</DropdownMenuItem>}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">Remove from Group</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2">
                <Info className="h-4 w-4" />
                <span>Group Info</span>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Add Members</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="gap-2">
                <Pin className="h-4 w-4" />
                <span>Pinned Messages</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive gap-2">
                <span>Leave Group</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="flex-1 overflow-hidden">
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
                    <Loader2 className="h-3 w-3 animate-spin" />
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
                              <AvatarImage src={message.sender.avatar || "/placeholder.svg?height=32&width=32"} />
                              <AvatarFallback>{message.sender.name?.charAt(0) || "?"}</AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            {!message.isSelf && (
                              <p className="mb-1 text-xs text-muted-foreground">{message.sender.name}</p>
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
                                    <Check className="h-3 w-3 text-primary-foreground/70" />
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
                    {typingUsers.length > 1
                      ? `${typingUsers.length} people typing...`
                      : `${group?.members.find((m) => m._id === typingUsers[0])?.name || "Someone"} is typing...`}
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

