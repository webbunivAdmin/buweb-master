"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  Calendar,
  ChevronRight,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  User,
} from "lucide-react"
import { useState } from "react"

interface MobileSidebarProps {
  user: any
  onSignOut: () => void
}

export function MobileSidebar({ user, onSignOut }: MobileSidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="mr-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-primary">Bugema</span>
            <span className="font-semibold text-xl">University</span>
          </div>
          <Button variant="ghost" size="icon" className="absolute right-4" onClick={() => setOpen(false)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <div className="p-4">
            <div className="mb-4 flex items-center gap-3 rounded-md bg-muted p-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage
                  src={user.avatar || user.profileImageUrl || "/placeholder.svg?height=40&width=40"}
                  alt={user.email || ""}
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <div className="text-sm font-medium">{user.name || "User"}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto px-2">
            <div className="flex flex-col space-y-1">
              <div className="mb-2 px-3 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Main Menu</p>
              </div>
              <NavItem
                href="/dashboard"
                icon={Home}
                label="Dashboard"
                isActive={isActive("/dashboard") && pathname === "/dashboard"}
                onClick={() => setOpen(false)}
              />
              <NavItem
                href="/dashboard/messages"
                icon={MessageSquare}
                label="Messages"
                isActive={isActive("/dashboard/messages")}
                onClick={() => setOpen(false)}
              />
              <NavItem
                href="/dashboard/announcements"
                icon={FileText}
                label="Announcements"
                isActive={isActive("/dashboard/announcements")}
                onClick={() => setOpen(false)}
              />
              <NavItem
                href="/dashboard/calendar"
                icon={Calendar}
                label="Calendar"
                isActive={isActive("/dashboard/calendar")}
                onClick={() => setOpen(false)}
              />

              <div className="my-3 h-px bg-border" />

              <div className="mb-2 px-3 pt-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Account</p>
              </div>
              <NavItem
                href="/dashboard/profile"
                icon={User}
                label="Profile"
                isActive={isActive("/dashboard/profile")}
                onClick={() => setOpen(false)}
              />
              <NavItem
                href="/dashboard/settings"
                icon={Settings}
                label="Settings"
                isActive={isActive("/dashboard/settings")}
                onClick={() => setOpen(false)}
              />
            </div>
          </div>

          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                onSignOut()
                setOpen(false)
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface NavItemProps {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
  onClick?: () => void
}

function NavItem({ href, icon: Icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 transition-all duration-200 hover:bg-muted",
        isActive ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:text-foreground",
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
          isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:text-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span>{label}</span>
    </Link>
  )
}

