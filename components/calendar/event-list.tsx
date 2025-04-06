"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Calendar, Clock, Building } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface EventListProps {
  events: any[]
  onEdit: (event: any) => void
  onDelete: (eventId: string) => void
  isAdmin: boolean
  userId: string
}

export function EventList({ events, onEdit, onDelete, isAdmin, userId }: EventListProps) {
  // Sort events by start time (most recent first)
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  })

  // Format date (e.g., "Mon, Apr 5, 2023")
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Format time (e.g., "10:00 AM - 11:30 AM")
  const formatTimeRange = (start: Date, end: Date) => {
    const startTime = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const endTime = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    return `${startTime} - ${endTime}`
  }

  // Check if user can edit/delete an event
  const canModifyEvent = (event: any) => {
    return isAdmin || (!event.isGeneral && event.creatorId === userId)
  }

  if (events.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No events found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      {sortedEvents.map((event) => (
        <Card
          key={event._id}
          className={`overflow-hidden ${
            event.isGeneral ? "border-blue-200 dark:border-blue-800" : "border-green-200 dark:border-green-800"
          }`}
        >
          <CardContent className="p-0">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
                <div>
                  <Badge variant={event.isGeneral ? "secondary" : "outline"}>
                    {event.isGeneral ? "General" : "Personal"}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(new Date(event.startTime))}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{formatTimeRange(new Date(event.startTime), new Date(event.endTime))}</span>
                </div>
                {event.department && (
                  <div className="flex items-center text-sm">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{event.department}</span>
                  </div>
                )}
              </div>

              {canModifyEvent(event) && (
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                    <Edit className="mr-1 h-4 w-4" /> Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the event.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(event._id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

