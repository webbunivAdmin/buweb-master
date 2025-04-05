"use client"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, ArrowLeft, Check, Loader2, Search, Users, UserPlus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { groupService, userService } from "@/lib/api-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Profile {
  _id: string
  name: string
  email: string
  avatar: string | null
  role: string
}

export default function NewGroupPage() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([])
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [groupType, setGroupType] = useState<"class" | "office" | "department" | "discussion">("discussion")
  const [initialMessage, setInitialMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch all users except the current user
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return

      setLoading(true)
      setError(null)
      try {
        const data = await userService.getAllUsers()

        // Filter out the current user from the profiles list
        const filteredData = data.filter((p: Profile) => p._id !== user.id)
        setProfiles(filteredData)
        setFilteredProfiles(filteredData)
      } catch (error: any) {
        console.error("Error fetching profiles:", error)
        setError("Failed to load users. Please try again later.")
        toast.error("Failed to load users", {
          description: error.message || "Please try again later",
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

  // Toggle user selection
  const toggleUserSelection = (profile: Profile) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((p) => p._id === profile._id)
      if (isSelected) {
        return prev.filter((p) => p._id !== profile._id)
      } else {
        return [...prev, profile]
      }
    })
  }

  // Create a new group
  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || !groupType || selectedUsers.length === 0) {
      toast.error("Missing information", {
        description: "Please fill in all required fields and select at least one member",
      })
      return
    }

    setCreating(true)
    setError(null)

    try {
      // Create group
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        type: groupType,
        adminId: user.id,
        members: [...selectedUsers.map((u) => u._id), user.id],
        initialMessage: initialMessage.trim() || undefined,
      }

      const group = await groupService.createGroup(groupData)

      toast.success("Group created successfully")
      router.push(`/dashboard/messages/groups/${group._id}`)
    } catch (error: any) {
      console.error("Error creating group:", error)
      setError(error.message || "Failed to create group. Please try again later.")
      toast.error("Failed to create group", {
        description: error.message || "Please try again later",
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container max-w-6xl py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-9 w-9">
          <Link href="/dashboard/messages">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create New Group</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:h-[600px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle>Group Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="group-name">
                Group Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="group-name"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                placeholder="Enter group description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-type">
                Group Type <span className="text-destructive">*</span>
              </Label>
              <Select value={groupType} onValueChange={(value) => setGroupType(value as any)}>
                <SelectTrigger id="group-type">
                  <SelectValue placeholder="Select group type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="discussion">Discussion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial-message">Welcome Message (Optional)</Label>
              <Textarea
                id="initial-message"
                placeholder="Enter an optional welcome message for the group"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                rows={2}
              />
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-medium mb-2">Selected Members ({selectedUsers.length})</h3>
              {selectedUsers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((profile) => (
                    <Badge key={profile._id} variant="secondary" className="flex items-center gap-1 pl-1 pr-2 py-1">
                      <Avatar className="h-5 w-5 mr-1">
                        <AvatarImage src={profile.avatar || "/placeholder.svg?height=20&width=20"} />
                        <AvatarFallback className="text-[10px]">{profile.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{profile.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 rounded-full"
                        onClick={() => toggleUserSelection(profile)}
                      >
                        <span className="sr-only">Remove {profile.name}</span>
                        <span className="text-xs">×</span>
                      </Button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No members selected yet</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t p-4">
            <Button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || !groupType || selectedUsers.length === 0 || creating}
              className="ml-auto gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Create Group
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:h-[600px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle>Add Members</CardTitle>
          </CardHeader>
          <div className="px-6 pb-3">
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
          </div>
          <Separator className="mb-2" />
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-[calc(100%-1rem)] px-6">
              {loading ? (
                <div className="space-y-3 py-2">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-2">
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
                <div className="space-y-1 py-2">
                  {filteredProfiles.map((profile) => {
                    const isSelected = selectedUsers.some((p) => p._id === profile._id)

                    return (
                      <div
                        key={profile._id}
                        className={`flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer ${
                          isSelected ? "bg-primary/10" : ""
                        }`}
                        onClick={() => toggleUserSelection(profile)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar || "/placeholder.svg?height=40&width=40"} />
                            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{profile.name}</p>
                              {profile.role === "admin" && (
                                <Badge variant="outline" className="text-xs py-0">
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center w-6 h-6 rounded-md border border-primary/30">
                          {isSelected ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <UserPlus className="h-4 w-4 text-muted-foreground opacity-50" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center py-10">
                  <Users className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

