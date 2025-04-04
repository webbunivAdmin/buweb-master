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
import {
  Bell,
  Calendar,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  User,
  ChevronRight,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { useMobile } from "@/hooks/use-mobile"
import { Input } from "@/components/ui/input"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const isMobile = useMobile()
  const [searchQuery, setSearchQuery] = useState("")

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
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen flex-col bg-muted/30">
        <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger />

          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="flex items-center">
                <span className="font-bold text-xl text-primary">Bugema</span>
                <span className="font-semibold text-xl">University</span>
              </Link>
            </div>

            <div className="hidden md:flex md:flex-1 md:justify-center md:px-6">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full bg-background pl-8 md:w-2/3 lg:w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link href="/dashboard/notifications">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    3
                  </span>
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage
                        src={user.avatar || user.profileImageUrl || "/placeholder.svg?height=32&width=32"}
                        alt={user.email || ""}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
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
                    <Link href="/dashboard/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          <Sidebar variant="floating" collapsible="icon">
            <SidebarHeader className="pb-0">
              {isMobile && (
                <div className="mb-2 flex items-center justify-between px-4">
                  <Link href="/dashboard" className="flex items-center">
                    <span className="font-bold text-xl text-primary">BU</span>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => document.body.click()}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
              <div className="px-2 py-2">
                <div className="flex items-center gap-2 rounded-md bg-sidebar-accent p-2">
                  <Avatar className="h-8 w-8 border border-sidebar-border">
                    <AvatarImage
                      src={user.avatar || user.profileImageUrl || "/placeholder.svg?height=32&width=32"}
                      alt={user.email || ""}
                    />
                    <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary">
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <div className="text-sm font-medium">{user.name || "User"}</div>
                    <div className="text-xs text-sidebar-foreground/70">{user.role || "Student"}</div>
                  </div>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Dashboard">
                        <Link href="/dashboard">
                          <Home className="h-5 w-5" />
                          <span>Dashboard</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Messages">
                        <Link href="/dashboard/messages">
                          <MessageSquare className="h-5 w-5" />
                          <span>Messages</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Announcements">
                        <Link href="/dashboard/announcements">
                          <FileText className="h-5 w-5" />
                          <span>Announcements</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Calendar">
                        <Link href="/dashboard/calendar">
                          <Calendar className="h-5 w-5" />
                          <span>Calendar</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarSeparator />

              <SidebarGroup>
                <SidebarGroupLabel>Account</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Profile">
                        <Link href="/dashboard/profile">
                          <User className="h-5 w-5" />
                          <span>Profile</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Settings">
                        <Link href="/dashboard/settings">
                          <Settings className="h-5 w-5" />
                          <span>Settings</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <div className="px-2 py-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 overflow-hidden">
            <div className="container h-full max-w-7xl overflow-auto py-6">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

