"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function CreateTicketDialog({ open, onOpenChange, onSubmit }: CreateTicketDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client_email: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.client_email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      onSubmit(formData)
      toast({
        title: "Success",
        description: "Ticket created successfully.",
      })
      setFormData({
        title: "",
        description: "",
        client_email: "",
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
            <Label htmlFor="client_email">Client Email *</Label>
            <Input
              id="client_email"
              value={formData.client_email}
              onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
              placeholder="Enter client email"
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
