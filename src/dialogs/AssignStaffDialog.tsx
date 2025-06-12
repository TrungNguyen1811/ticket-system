"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { useToast } from "@/components/ui/use-toast"
import { DataResponse, Response } from "@/types/reponse"
import { userService } from "@/services/user.service"
import { useQuery } from "@tanstack/react-query"
import { User } from "@/types/user"
import { updateTicketSchema, UpdateTicketSchema } from "@/schema/ticket.schema"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Form, FormField, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface AssignStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStaffId: string
  onSubmit: (data: UpdateTicketSchema) => void
  isLoading?: boolean
}

export function AssignStaffDialog({ open, onOpenChange, currentStaffId, onSubmit, isLoading = false }: AssignStaffDialogProps) {
  const { toast } = useToast()
  
  const form = useForm<UpdateTicketSchema>({
    resolver: zodResolver(updateTicketSchema),
    defaultValues: {
      staff_id: currentStaffId || "",
    }
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        staff_id: currentStaffId || "",
      })
    }
  }, [open, currentStaffId, form])

  const { data: users } = useQuery<Response<DataResponse<User[]>>>({
    queryKey: ["users"],
    queryFn: () => userService.getUsers({role: "user", isPaginate: false}),
  })


  const handleSubmit = async (data: UpdateTicketSchema) => {
    if (data.staff_id === currentStaffId) {
      toast({
        title: "No Change",
        description: "The selected staff is the same as the current staff.",
        variant: "destructive",
      })
      return
    }

    try {
      await onSubmit({
        ...data,
        _method: "PUT"
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign staff. Please try again.",
        variant: "destructive",
      })
    }
  }

  const staffId = form.watch("staff_id")
  const selectedStaff = users?.data.data.find((user) => user.id === staffId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign Staff Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField 
              control={form.control} 
              name="staff_id" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Staff Member</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a staff member">
                          {selectedStaff && (
                            <div className="flex items-center space-x-2">
                              <UserAvatar name={selectedStaff.name} size="sm" />
                              <span>{selectedStaff.name}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {users?.data.data.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center space-x-2">
                              <UserAvatar name={user.name} size="sm" />
                              <span>{user.name}</span>
                              {user.role && <span className="text-xs text-gray-500">({user.role})</span>}
                            </div>
                          </SelectItem>
                        ))}
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
                disabled={isLoading || staffId === currentStaffId} 
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : ""}
                Assign Staff
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
