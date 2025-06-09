"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import type { Ticket } from "@/types/ticket"
import { updateTicketSchema, UpdateTicketSchema } from "@/schema/ticket.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

interface EditTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: Ticket
  onSubmit: (data: UpdateTicketSchema) => void
}

export function EditTicketDialog({ open, onOpenChange, ticket, onSubmit }: EditTicketDialogProps) {
  const [loading, setLoading] = useState(false)
  const form = useForm<UpdateTicketSchema>({
    resolver: zodResolver(updateTicketSchema),
  })
  const { toast } = useToast()


  useEffect(() => {
    if (ticket) {
      form.reset({
        title: ticket.title || "",
        description: ticket.description || "",
      })
    }
  }, [ticket])

  const handleSubmit = async (data: UpdateTicketSchema) => {
    setLoading(true)

    try {
      onSubmit(data)
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
          <DialogTitle>Quick Edit</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="Enter ticket title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Describe the issue in detail"
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
