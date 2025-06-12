"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { createTicketSchema } from "@/schema/ticket.schema"
import { CreateTicketSchema } from "@/schema/ticket.schema"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTicketSchema) => void
  isLoading?: boolean
}

export function CreateTicketDialog({ open, onOpenChange, onSubmit, isLoading = false }: CreateTicketDialogProps) {
  const { toast } = useToast()
  
  const form = useForm<CreateTicketSchema>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      client_email: "",
    }
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  const handleSubmit = async (data: CreateTicketSchema) => {
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField 
              control={form.control} 
              name="title" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter ticket title"
                      required
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <FormField 
              control={form.control} 
              name="client_email" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Email *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter client email"
                      required
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <FormField 
              control={form.control} 
              name="description" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the issue in detail"
                      rows={4}
                      required
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : ""}
                Create Ticket
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

