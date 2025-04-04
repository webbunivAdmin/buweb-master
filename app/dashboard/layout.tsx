"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Calendar, FileText, Home, LogOut, Menu, MessageSquare, Settings, User } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "sonner"
import { useMobile } from "@/hooks/use-mobile"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const isMobile = useMobile()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  const handleSignOut = async () => {
    try {
      await logout()
      toast.success("You have been logged out")
    } catch (error: any) {
      toast.error("Failed to log out", {
        description: error.message || "Please try again",
      })
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  const NavItems = () => (
    <>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        onClick={() => setOpen(false)}
      >
        <Home className="h-5 w-5" />
        <span>Dashboard</span>
      </Link>
      <Link
        href="/dashboard/messages"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        onClick={() => setOpen(false)}
      >
        <MessageSquare className="h-5 w-5" />
        <span>Messages</span>
      </Link>
      <Link
        href="/dashboard/announcements"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        onClick={() => setOpen(false)}
      >
        <FileText className="h-5 w-5" />
        <span>Announcements</span>
      </Link>
      <Link
        href="/dashboard/calendar"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        onClick={() => setOpen(false)}
      >
        <Calendar className="h-5 w-5" />
        <span>Calendar</span>
      </Link>
      <Link
        href="/dashboard/profile"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        onClick={() => setOpen(false)}
      >
        <User className="h-5 w-5" />
        <span>Profile</span>
      </Link>
      <Link
        href="/dashboard/settings"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        onClick={() => setOpen(false)}
      >
        <Settings className="h-5 w-5" />
        <span>Settings</span>
      </Link>
    </>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-xl">Bugema University</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <NavItems />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <div className="font-bold text-xl">Bugema University</div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/notifications">
                <Bell className="h-5 w-5" />
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.avatar || user.profileImageUrl || "/placeholder.svg?height=32&width=32"}
                      alt={user.email || ""}
                    />
                    <AvatarFallback>
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        {!isMobile && (
          <aside className="w-64 border-r bg-background">
            <div className="flex h-full flex-col gap-2 p-4">
              <NavItems />
            </div>
          </aside>
        )}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

