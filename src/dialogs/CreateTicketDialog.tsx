"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { createTicketSchema } from "@/schema/ticket.schema"
import { CreateTicketSchema } from "@/schema/ticket.schema"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTicketSchema) => void
}

export function CreateTicketDialog({ open, onOpenChange, onSubmit }: CreateTicketDialogProps) {
  const [loading, setLoading] = useState(false)
  const form = useForm<CreateTicketSchema>({
    resolver: zodResolver(createTicketSchema),
  })
  const { toast } = useToast()

  const handleSubmit = async (data: CreateTicketSchema) => {
    if (!form.formState.isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      onSubmit(data)
      form.reset()
      toast({
        title: "Success",
        description: "Ticket created successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
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
          <DialogTitle>Create New Ticket</DialogTitle>
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
            <Label htmlFor="client_email">Client Email *</Label>
            <Input
              id="client_email"
              {...form.register("client_email")}
              placeholder="Enter client email"
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
              {loading ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
