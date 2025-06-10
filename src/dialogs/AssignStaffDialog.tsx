"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
interface AssignStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStaffId: string
  onSubmit: (data: UpdateTicketSchema) => void
}

export function AssignStaffDialog({ open, onOpenChange, currentStaffId, onSubmit }: AssignStaffDialogProps) {
  const [selectedStaffId, setSelectedStaffId] = useState(currentStaffId)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const form = useForm<UpdateTicketSchema>({
    resolver: zodResolver(updateTicketSchema),
  })
  const { data: users } = useQuery<Response<DataResponse<User[]>>>({
    queryKey: ["users"],
    queryFn: () => userService.getUsers({role: "user", isPaginate: false}),
  })

  const handleSubmit = async (data: UpdateTicketSchema) => {
    if (!selectedStaffId) {
      toast({
        title: "Validation Error",
        description: "Please select a staff member.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      onSubmit({
        ...data,
        staff_id: selectedStaffId,
        _method: "PUT"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign staff. Please try again.",
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
          <DialogTitle>Assign Staff Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff">Select Staff Member</Label>
            <Select value={selectedStaffId} onValueChange={(value) => setSelectedStaffId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a staff member" />
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Assigning..." : "Assign Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
