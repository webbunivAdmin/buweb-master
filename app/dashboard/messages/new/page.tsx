"use client"

import { useAuth } from "@/lib/auth-provider"
import { useSocket } from "@/lib/socket-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, ArrowLeft, Check, Loader2, Search, User } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { chatService } from "@/lib/api-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface Profile {
  _id: string
  name: string
  email: string
  avatar: string | null
  role: string
}

export default function NewMessagePage() {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [messageContent, setMessageContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch all users except the current user
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return

      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || `API error: ${response.status} ${response.statusText}`
          } catch {
            errorMessage = `API error: ${response.status} ${response.statusText}`
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()

        // Filter out the current user from the profiles list
        const filteredData = data.filter((p: Profile) => p._id !== user._id)
        setProfiles(filteredData)
        setFilteredProfiles(filteredData)
      } catch (error) {
        console.error("Error fetching profiles:", error)
        setError("Failed to load users. Please try again later.")
        toast.error("Failed to load users", {
          description: "Please try again later",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [user])

  // Filter profiles based on search query
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = profiles.filter(
        (profile) => profile.name.toLowerCase().includes(query) || profile.email.toLowerCase().includes(query),
      )
      setFilteredProfiles(filtered)
    } else {
      setFilteredProfiles(profiles)
    }
  }, [searchQuery, profiles])

  // Select a user to message
  const handleSelectUser = (profile: Profile) => {
    setSelectedUser(profile)
  }

  // Send a message to the selected user
  const handleSendMessage = async () => {
    if (!user || !selectedUser || !messageContent.trim()) {
      toast.error("Missing information", {
        description: "Please select a recipient and enter a message",
      })
      return
    }

    setSending(true)
    setError(null)

    try {
      // Start chat with selected user
      const chatData = await chatService.startChat({
        userId1: user.id,
        userId2: selectedUser._id,
      })

      // Send message
      const messageData = {
        chatId: chatData._id,
        senderId: user.id,
        content: messageContent.trim(),
        type: "text",
      }

      const sentMessage = await chatService.sendMessage(messageData)

      // Emit socket event for new message
      if (socket && isConnected) {
        socket.emit("sendMessage", {
          ...sentMessage,
          senderName: user.name,
          senderAvatar: user.avatar,
          recipientId: selectedUser._id,
        })
      }

      toast.success("Message sent successfully")
      router.push(`/dashboard/messages/${chatData._id}`)
    } catch (error: any) {
      console.error("Error in chat creation:", error)
      setError(error.message || "Failed to create chat. Please try again later.")
      toast.error("Failed to create chat", {
        description: error.message || "Please try again later",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/messages">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Message</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Recipient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto rounded-lg border">
              {loading ? (
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-6 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : filteredProfiles.length > 0 ? (
                <div className="divide-y">
                  {filteredProfiles.map((profile) => {
                    const isSelected = selectedUser?._id === profile._id
                    return (
                      <div
                        key={profile._id}
                        className={`flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer ${isSelected ? "bg-primary/5" : ""}`}
                        onClick={() => handleSelectUser(profile)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar || "/placeholder.svg?height=40&width=40"} />
                            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile.name}</p>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center w-6 h-6 rounded-md border border-primary/30">
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center p-4">
                  <User className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">No users found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedUser ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatar || "/placeholder.svg?height=40&width=40"} />
                  <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Select a recipient from the list</p>
              </div>
            )}

            <Textarea
              placeholder="Type your message here..."
              rows={8}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              disabled={!selectedUser || sending}
            />
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSendMessage}
              disabled={!selectedUser || !messageContent.trim() || sending}
              className="ml-auto"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

