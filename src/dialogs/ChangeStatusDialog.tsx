"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { TICKET_STATUSES } from "@/lib/constants"
import { useToast } from "@/components/ui/use-toast"
import { updateTicketSchema, UpdateTicketSchema } from "@/schema/ticket.schema"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

interface ChangeStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStatus: string
  onSubmit: (data: UpdateTicketSchema) => void
}

export function ChangeStatusDialog({ open, onOpenChange, currentStatus, onSubmit }: ChangeStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const form = useForm<UpdateTicketSchema>({
    resolver: zodResolver(updateTicketSchema),
  })


  const handleSubmit = async (data: UpdateTicketSchema) => {

    if (!selectedStatus) {
      toast({
        title: "Validation Error",
        description: "Please select a status.",
        variant: "destructive",
      })
      return
    }

    if (selectedStatus === currentStatus) {
      toast({
        title: "No Change",
        description: "The selected status is the same as the current status.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      onSubmit({
        ...data,
        status: selectedStatus as "new" | "in_progress" | "pending" | "assigned" | "complete" | "archived" | undefined,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Change Ticket Status</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div className="p-2 bg-gray-50 rounded-md">
              <StatusBadge status={currentStatus} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as "new" | "in_progress" | "pending" | "assigned" | "complete" | "archived" | '') }>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {TICKET_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    <StatusBadge status={status} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
