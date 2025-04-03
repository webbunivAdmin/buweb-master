"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Upload, User } from "lucide-react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        setAvatarUrl(data.avatar_url || user.profileImageUrl || "")
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

    try {
      const storageRef = ref(storage, `profile-images/${Date.now()}-${avatarFile.name}`)
      await uploadBytes(storageRef, avatarFile)
      const downloadURL = await getDownloadURL(storageRef)
      return downloadURL
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast.error("Failed to upload profile image")
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

      // Update user in localStorage
      const userData = JSON.parse(localStorage.getItem("user") || "{}")
      userData.name = fullName
      userData.profileImageUrl = newAvatarUrl
      localStorage.setItem("user", JSON.stringify(userData))

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
            <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-32 w-32">
                <AvatarImage src={avatarUrl || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {fullName ? fullName.charAt(0).toUpperCase() : <User className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </div>
            <p className="text-sm text-muted-foreground">Click to change your profile picture</p>
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

