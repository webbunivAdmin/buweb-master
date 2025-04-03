"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface Profile {
  id: string
  full_name: string
  email: string
  bio: string | null
  avatar_url: string | null
  role: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        // Fetch profile from API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) throw new Error("Failed to fetch profile")

        const data = await response.json()
        setProfile(data)
        setFullName(data.full_name || "")
        setBio(data.bio || "")
        setAvatarUrl(data.avatar_url || "")
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error("Failed to load profile", {
          description: "Please try again later",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setAvatarFile(file)

      // Create a preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return null

    // Create form data for file upload
    const formData = new FormData()
    formData.append("avatar", avatarFile)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload avatar")

      const data = await response.json()
      return data.avatarUrl
    } catch (error) {
      console.error("Error uploading avatar:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    try {
      let newAvatarUrl = avatarUrl

      // Upload new avatar if selected
      if (avatarFile) {
        newAvatarUrl = (await uploadAvatar()) || avatarUrl
      }

      // Update profile
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          bio,
          avatar_url: newAvatarUrl,
        }),
      })

      if (!response.ok) throw new Error("Failed to update profile")

      toast.success("Profile updated successfully")

      // Update local state
      setProfile({
        ...profile!,
        full_name: fullName,
        bio,
        avatar_url: newAvatarUrl,
      })

      setAvatarFile(null)
    } catch (error: any) {
      toast.error("Failed to update profile", {
        description: error.message || "Please try again",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container flex h-full items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <h1 className="mb-6 text-3xl font-bold">Profile</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={avatarUrl || "/placeholder.svg?height=128&width=128"} />
              <AvatarFallback>{fullName?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="w-full">
              <Label htmlFor="avatar" className="mb-2 block">
                Upload new picture
              </Label>
              <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={profile?.role || user?.role || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell us about yourself"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

