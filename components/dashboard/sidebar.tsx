"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Calendar, FileText, Home, LogOut, MessageSquare, Settings, User, Search } from "lucide-react"
import { useState } from "react"

interface SidebarProps {
  user: any
  onSignOut: () => void
}

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  return (
    <aside className="fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] w-72 flex-col border-r bg-background">
      {/* Fixed Header */}
      <div className="flex flex-col space-y-4 p-4">
        <div className="flex items-center gap-3 rounded-md bg-muted p-3">
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable Content */}
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
          />
          <NavItem
            href="/dashboard/messages"
            icon={MessageSquare}
            label="Messages"
            isActive={isActive("/dashboard/messages")}
          />
          <NavItem
            href="/dashboard/announcements"
            icon={FileText}
            label="Announcements"
            isActive={isActive("/dashboard/announcements")}
          />
          <NavItem
            href="/dashboard/calendar"
            icon={Calendar}
            label="Calendar"
            isActive={isActive("/dashboard/calendar")}
          />

          <div className="my-3 h-px bg-border" />

          <div className="mb-2 px-3 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Account</p>
          </div>
          <NavItem href="/dashboard/profile" icon={User} label="Profile" isActive={isActive("/dashboard/profile")} />
          <NavItem
            href="/dashboard/settings"
            icon={Settings}
            label="Settings"
            isActive={isActive("/dashboard/settings")}
          />

          {/* Add some padding at the bottom to ensure all items are visible when scrolled */}
          <div className="h-4"></div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="border-t p-4">
        <Button variant="outline" className="w-full justify-start" onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </Button>
      </div>
    </aside>
  )
}

interface NavItemProps {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
}

function NavItem({ href, icon: Icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 transition-all duration-200 hover:bg-muted",
        isActive ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:text-foreground",
      )}
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

