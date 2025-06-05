"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import type { Ticket } from "@/types/ticket"
import { useQuery } from "@tanstack/react-query"
import { userService } from "@/services/user.service"
import { User } from "@/types/user"
import { DataResponse, Response } from "@/types/reponse"
import { UpdateTicketData } from "@/services/ticket.service"

interface EditTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: Ticket
  onSubmit: (data: UpdateTicketData) => void
}

export function EditTicketDialog({ open, onOpenChange, ticket, onSubmit }: EditTicketDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: ticket.title,
    description: ticket.description,
    status: ticket.status as "new" | "in_progress" | "waiting" | "assigned" | "complete" | "force_closed",
    staff_id: ticket.staff_id,
  })
  const { toast } = useToast()
  const { data: users } = useQuery<Response<DataResponse<User[]>>>({
    queryKey: ["users"],
    queryFn: () => userService.getUsers({role: "user", isPaginate: false}),
  })



  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title || "",
        description: ticket.description || "",
        status: ticket.status as "new" | "in_progress" | "waiting" | "assigned" | "complete" | "force_closed" || "",
        staff_id: ticket.staff_id || "",
      })
    }
  }, [ticket])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)

    try {
      onSubmit({
        ...formData,
        _method: "PUT"
      })
      toast({
        title: "Success",
        description: "Ticket updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter ticket title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the issue in detail"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="holder">Status  </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as "new" | "in_progress" | "waiting" | "assigned" | "complete" | "force_closed" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    {["new", "in_progress", "waiting", "assigned", "complete", "force_closed"].map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff">Assign Staff</Label>
              <Select
                value={formData.staff_id}
                onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {users?.data.data.map((user: User) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
