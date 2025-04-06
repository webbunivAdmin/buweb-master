"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Calendar } from "@/components/calendar/calendar"
import { EventList } from "@/components/calendar/event-list"
import { NotificationPanel } from "@/components/calendar/notification-panel"
import { EventModal } from "@/components/calendar/event-modal"
import { CalendarHeader } from "@/components/calendar/calendar-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-provider"

export default function CalendarPage() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(user?.role === "admin" || user?.role === "faculty")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { theme, setTheme } = useTheme()

  // Fetch events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const response = await fetch("/api/events", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch events")
        }

        const data = await response.json()
        const { generalEvents, userEvents } = data

        // Combine general and user events
        const allEvents = [...generalEvents, ...userEvents]
        setEvents(allEvents)
        setFilteredEvents(allEvents)
      } catch (error) {
        console.error("Failed to fetch events:", error)
        toast.error("Failed to load events")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [user])

  // Filter events based on search query and admin/user view
  useEffect(() => {
    let filtered = events

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredEvents(filtered)
  }, [searchQuery, events])

  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setIsModalOpen(true)
  }

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete event")
      }

      setEvents((prevEvents) => prevEvents.filter((event) => event._id !== eventId))
      toast.success("Event deleted successfully")
    } catch (error) {
      console.error("Failed to delete event:", error)
      toast.error("Failed to delete event")
    }
  }

  const handleSaveEvent = async (eventData: any) => {
    try {
      if (selectedEvent) {
        // Update existing event
        const response = await fetch("/api/events", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            eventId: selectedEvent._id,
            ...eventData,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update event")
        }

        const updatedEvent = await response.json()

        setEvents((prevEvents) =>
          prevEvents.map((event) => (event._id === selectedEvent._id ? updatedEvent.event : event)),
        )
        toast.success("Event updated successfully")
      } else {
        // Create new event
        const response = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(eventData),
        })

        if (!response.ok) {
          throw new Error("Failed to create event")
        }

        const data = await response.json()
        setEvents((prevEvents) => [...prevEvents, data.event])
        toast.success("Event created successfully")
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error("Failed to save event:", error)
      toast.error("Failed to save event")
    }
  }

  const toggleAdminView = () => {
    setIsAdmin(!isAdmin)
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Calendar</h1>

          {(user?.role === "admin" || user?.role === "faculty") && (
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="admin-mode" checked={isAdmin} onCheckedChange={toggleAdminView} />
                <Label htmlFor="admin-mode">Admin View</Label>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search events..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button onClick={handleCreateEvent}>
                <Plus className="mr-2 h-4 w-4" /> Add Event
              </Button>
            </div>

            <CalendarHeader currentDate={currentDate} onDateChange={setCurrentDate} />

            <Calendar
              events={filteredEvents}
              currentDate={currentDate}
              onEventClick={handleEditEvent}
              isLoading={isLoading}
            />

            <Tabs defaultValue="all" className="mt-6">
              <TabsList>
                <TabsTrigger value="all">All Events</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <EventList
                  events={filteredEvents}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                  isAdmin={isAdmin}
                  userId={user?.id || ""}
                />
              </TabsContent>

              <TabsContent value="general">
                <EventList
                  events={filteredEvents.filter((event) => event.isGeneral)}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                  isAdmin={isAdmin}
                  userId={user?.id || ""}
                />
              </TabsContent>

              <TabsContent value="personal">
                <EventList
                  events={filteredEvents.filter((event) => !event.isGeneral && event.creatorId === user?.id)}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                  isAdmin={isAdmin}
                  userId={user?.id || ""}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <NotificationPanel events={events} userId={user?.id || ""} />
          </div>
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        event={selectedEvent}
        isAdmin={isAdmin}
      />
    </div>
  )
}

