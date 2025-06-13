"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { STATUS_OPTIONS } from "@/lib/constants"
import { useToast } from "@/components/ui/use-toast"
import { updateTicketSchema, UpdateTicketSchema } from "@/schema/ticket.schema"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useAuth } from "@/contexts/AuthContext"

interface ChangeStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStatus: string
  onSubmit: (data: UpdateTicketSchema) => void
  isLoading?: boolean
  holderId?: string
}

export function ChangeStatusDialog({ open, onOpenChange, currentStatus, onSubmit, isLoading = false, holderId }: ChangeStatusDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth();
  const form = useForm<UpdateTicketSchema>({
    resolver: zodResolver(updateTicketSchema),
    defaultValues: {
      status: currentStatus as "new" | "in_progress" | "pending" | "assigned" | "complete" | "archived",
    },
  })

  // Watch status value for button disabled state
  const status = form.watch("status")

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        status: currentStatus as "new" | "in_progress" | "pending" | "assigned" | "complete" | "archived",
      })
    }
  }, [open, currentStatus, form])

  const handleSubmit = async (data: UpdateTicketSchema) => {
    if (data.status === currentStatus) {
      toast({
        title: "No Change",
        description: "The selected status is the same as the current status.",
        variant: "destructive",
      })
      return
    }

    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const isAdmin = user?.role === "admin"
  const isHolder = holderId === user?.id
  const canArchive = isAdmin || isHolder

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Change Ticket Status</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4"> 
            <FormField 
              control={form.control} 
              name="status" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Status</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => {
                          if (status.value === "archived" && !canArchive) {
                            return null;
                          }
                          
                          return (
                            <SelectItem key={status.value} value={status.value}>
                              <StatusBadge status={status.value} />
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
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
                disabled={isLoading || status === currentStatus} 
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : ""}
                Update Status
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
