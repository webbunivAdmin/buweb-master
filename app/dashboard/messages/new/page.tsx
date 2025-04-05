"use client"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Search, User, Users } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { chatService, groupService } from "@/lib/api-service"

interface Profile {
  id: string
  name: string
  email: string
  bio: string | null
  avatar: string | null
  role: string
  registrationNumber: string
}

export default function NewMessagePage() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [messageContent, setMessageContent] = useState("")
  const [groupName, setGroupName] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Fetch users from API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) throw new Error("Failed to fetch users")

        const data = await response.json()
        setProfiles(data.filter((p: Profile) => p.id !== user.id))
        setFilteredProfiles(data.filter((p: Profile) => p.id !== user.id))
      } catch (error) {
        console.error("Error fetching profiles:", error)
        toast.error("Failed to load users", {
          description: "Please try again later",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [user])

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

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleSendMessage = async (isGroup: boolean) => {
    if (!user || selectedUsers.length === 0 || !messageContent.trim()) return

    if (isGroup && !groupName.trim()) {
      toast.error("Please enter a group name")
      return
    }

    setSending(true)
    try {
      if (isGroup) {
        // Create group
        const groupData = {
          name: groupName,
          members: [...selectedUsers, user.id],
          createdBy: user.id,
          initialMessage: messageContent,
        }

        const data = await groupService.createGroup(groupData)
        toast.success("Group created successfully")
        router.push(`/dashboard/messages/${data.id}`)
      } else {
        // Start direct chat
        if (selectedUsers.length !== 1) {
          toast.error("Please select exactly one user for direct message")
          return
        }

        // Start chat with selected user
        const chatData = await chatService.startChat(user.id, selectedUsers[0])

        // Send message
        await chatService.sendMessage({
          chatId: chatData.id,
          senderId: user.id,
          content: messageContent,
        })

        toast.success("Message sent successfully")
        router.push(`/dashboard/messages/${chatData.id}`)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message", {
        description: "Please try again later",
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

      <Tabs defaultValue="direct">
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="direct">Direct Message</TabsTrigger>
          <TabsTrigger value="group">Group Message</TabsTrigger>
        </TabsList>

        <TabsContent value="direct">
          <Card>
            <CardHeader>
              <CardTitle>Send a Direct Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <h3 className="mb-2 font-medium">Selected ({selectedUsers.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.length > 0 ? (
                      selectedUsers.map((userId) => {
                        const profile = profiles.find((p) => p.id === userId)
                        return (
                          <div key={userId} className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                            <span>{profile?.name}</span>
                            <button
                              onClick={() => toggleUserSelection(userId)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No users selected</p>
                    )}
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto rounded-lg border">
                  {loading ? (
                    <div className="flex h-[300px] items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  ) : filteredProfiles.length > 0 ? (
                    <div className="divide-y">
                      {filteredProfiles.map((profile) => (
                        <div key={profile.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
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
                          <Checkbox
                            checked={selectedUsers.includes(profile.id)}
                            onCheckedChange={() => toggleUserSelection(profile.id)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-[300px] flex-col items-center justify-center p-4">
                      <User className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-center text-muted-foreground">No users found</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="message" className="mb-2 block">
                  Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  rows={4}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSendMessage(false)}
                disabled={selectedUsers.length === 0 || !messageContent.trim() || sending}
                className="ml-auto"
              >
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="group">
          <Card>
            <CardHeader>
              <CardTitle>Create a Group Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="groupName" className="mb-2 block">
                  Group Name
                </Label>
                <Input
                  id="groupName"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div>
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <h3 className="mb-2 font-medium">Selected ({selectedUsers.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.length > 0 ? (
                      selectedUsers.map((userId) => {
                        const profile = profiles.find((p) => p.id === userId)
                        return (
                          <div key={userId} className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                            <span>{profile?.name}</span>
                            <button
                              onClick={() => toggleUserSelection(userId)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No users selected</p>
                    )}
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto rounded-lg border">
                  {loading ? (
                    <div className="flex h-[300px] items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  ) : filteredProfiles.length > 0 ? (
                    <div className="divide-y">
                      {filteredProfiles.map((profile) => (
                        <div key={profile.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
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
                          <Checkbox
                            checked={selectedUsers.includes(profile.id)}
                            onCheckedChange={() => toggleUserSelection(profile.id)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-[300px] flex-col items-center justify-center p-4">
                      <Users className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-center text-muted-foreground">No users found</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="groupMessage" className="mb-2 block">
                  First Message
                </Label>
                <Textarea
                  id="groupMessage"
                  placeholder="Type your first message to the group..."
                  rows={4}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSendMessage(true)}
                disabled={selectedUsers.length === 0 || !messageContent.trim() || !groupName.trim() || sending}
                className="ml-auto"
              >
                {sending ? "Creating..." : "Create Group"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

