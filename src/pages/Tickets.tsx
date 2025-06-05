"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { mockTickets, mockUsers, mockClients } from "@/mock/data"
import { formatDate } from "@/lib/utils"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { CreateTicketDialog } from "@/dialogs/CreateTicketDialog"
import { EditTicketDialog } from "@/dialogs/EditTicketDialog"
import { ChangeStatusDialog } from "@/dialogs/ChangeStatusDialog"
import { AssignStaffDialog } from "@/dialogs/AssignStaffDialog"
import { DeleteConfirmationDialog } from "@/dialogs/DeleteConfirmationDialog"
import { Plus, Search, MoreHorizontal, Eye, Edit, UserPlus, RefreshCw, Trash2, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import type { Ticket } from "@/types/ticket"
import { useApi } from "@/hooks/useApi"
import { useApiMutation } from "@/hooks/useApiMutation"
import { ticketService } from "@/services/ticket.service"

export function Tickets() {
  const [tickets, setTickets] = useState(mockTickets)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)

  // API hooks for real implementation
  const {
    data: apiTickets,
    loading: loadingTickets,
    execute: fetchTickets,
  } = useApi(() => ticketService.getTickets({ search: searchTerm }), {
    immediate: false, // Set to true when connecting to real API
  })

  const { mutate: createTicket, loading: creatingTicket } = useApiMutation(ticketService.createTicket, {
    successMessage: "Ticket created successfully",
    onSuccess: (newTicket) => {
      setTickets([newTicket, ...tickets])
      setDialogOpen(null)
    },
  })

  const { mutate: updateTicket, loading: updatingTicket } = useApiMutation(
    ({ id, data }: { id: string; data: any }) => ticketService.updateTicket(id, data),
    {
      successMessage: "Ticket updated successfully",
      onSuccess: (updatedTicket) => {
        setTickets(tickets.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)))
        setDialogOpen(null)
        setSelectedTicket(null)
      },
    },
  )

  const { mutate: deleteTicket, loading: deletingTicket } = useApiMutation(ticketService.deleteTicket, {
    successMessage: "Ticket deleted successfully",
    onSuccess: () => {
      if (selectedTicket) {
        setTickets(tickets.filter((ticket) => ticket.id !== selectedTicket.id))
      }
      setDialogOpen(null)
      setSelectedTicket(null)
    },
  })

  const { mutate: assignStaff, loading: assigningStaff } = useApiMutation(
    ({ ticketId, staffId }: { ticketId: string; staffId: string }) => ticketService.assignStaff(ticketId, staffId),
    {
      successMessage: "Staff assigned successfully",
      onSuccess: (updatedTicket) => {
        setTickets(tickets.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)))
        setDialogOpen(null)
        setSelectedTicket(null)
      },
    },
  )

  const { mutate: changeStatus, loading: changingStatus } = useApiMutation(
    ({ ticketId, status }: { ticketId: string; status: string }) => ticketService.changeStatus(ticketId, status),
    {
      successMessage: "Status updated successfully",
      onSuccess: (updatedTicket) => {
        setTickets(tickets.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)))
        setDialogOpen(null)
        setSelectedTicket(null)
      },
    },
  )

  // Search effect with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        // In real implementation, this would trigger API call
        // fetchTickets()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClientName(ticket.client_id).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getUserName = (userId: string) => {
    return mockUsers.find((u) => u.id === userId)?.name || "Unknown"
  }

  const getClientName = (clientId: string) => {
    return mockClients.find((c) => c.id === clientId)?.name || "Unknown"
  }

  const handleCreateTicket = async (ticketData: any) => {
    try {
      // For demo, use local state. In production, use API:
      // await createTicket(ticketData)

      const newTicket: Ticket = {
        id: `ticket${tickets.length + 1}`,
        ...ticketData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setTickets([newTicket, ...tickets])
      setDialogOpen(null)
    } catch (error) {
      console.error("Failed to create ticket:", error)
    }
  }

  const handleEditTicket = async (ticketData: any) => {
    if (!selectedTicket) return

    try {
      // For demo, use local state. In production, use API:
      // await updateTicket({ id: selectedTicket.id, data: ticketData })

      const updatedTickets = tickets.map((ticket) =>
        ticket.id === selectedTicket.id ? { ...ticket, ...ticketData, updated_at: new Date().toISOString() } : ticket,
      )
      setTickets(updatedTickets)
      setDialogOpen(null)
      setSelectedTicket(null)
    } catch (error) {
      console.error("Failed to update ticket:", error)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return

    try {
      // For demo, use local state. In production, use API:
      // await changeStatus({ ticketId: selectedTicket.id, status: newStatus })

      const updatedTickets = tickets.map((ticket) =>
        ticket.id === selectedTicket.id
          ? { ...ticket, status: newStatus as any, updated_at: new Date().toISOString() }
          : ticket,
      )
      setTickets(updatedTickets)
      setDialogOpen(null)
      setSelectedTicket(null)
    } catch (error) {
      console.error("Failed to change status:", error)
    }
  }

  const handleStaffAssign = async (staffId: string) => {
    if (!selectedTicket) return

    try {
      // For demo, use local state. In production, use API:
      // await assignStaff({ ticketId: selectedTicket.id, staffId })

      const updatedTickets = tickets.map((ticket) =>
        ticket.id === selectedTicket.id
          ? { ...ticket, staff_id: staffId, updated_at: new Date().toISOString() }
          : ticket,
      )
      setTickets(updatedTickets)
      setDialogOpen(null)
      setSelectedTicket(null)
    } catch (error) {
      console.error("Failed to assign staff:", error)
    }
  }

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return

    try {
      // For demo, use local state. In production, use API:
      // await deleteTicket(selectedTicket.id)

      const updatedTickets = tickets.filter((ticket) => ticket.id !== selectedTicket.id)
      setTickets(updatedTickets)
      setDialogOpen(null)
      setSelectedTicket(null)
    } catch (error) {
      console.error("Failed to delete ticket:", error)
    }
  }

  const isLoading =
    loadingTickets || creatingTicket || updatingTicket || deletingTicket || assigningStaff || changingStatus

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
          <p className="mt-2 text-gray-600">Manage and track all support tickets</p>
        </div>
        <Button onClick={() => setDialogOpen("create")} disabled={isLoading}>
          {creatingTicket ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          New Ticket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => fetchTickets()} disabled={loadingTickets}>
              {loadingTickets ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Holder</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.title}</TableCell>
                  <TableCell>{getClientName(ticket.client_id)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <UserAvatar name={getUserName(ticket.holder_id)} size="sm" />
                      <span className="text-sm">{getUserName(ticket.holder_id)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <UserAvatar name={getUserName(ticket.staff_id)} size="sm" />
                      <span className="text-sm">{getUserName(ticket.staff_id)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(ticket.updated_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isLoading}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/tickets/${ticket.id}`} className="flex items-center">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setDialogOpen("edit")
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Ticket
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setDialogOpen("assign")
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign Staff
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setDialogOpen("status")
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Change Status
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setDialogOpen("delete")
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateTicketDialog
        open={dialogOpen === "create"}
        onOpenChange={(open) => !open && setDialogOpen(null)}
        onSubmit={handleCreateTicket}
      />

      {selectedTicket && (
        <>
          <EditTicketDialog
            open={dialogOpen === "edit"}
            onOpenChange={(open) => !open && setDialogOpen(null)}
            ticket={selectedTicket}
            onSubmit={handleEditTicket}
          />

          <ChangeStatusDialog
            open={dialogOpen === "status"}
            onOpenChange={(open) => !open && setDialogOpen(null)}
            currentStatus={selectedTicket.status}
            onSubmit={handleStatusChange}
          />

          <AssignStaffDialog
            open={dialogOpen === "assign"}
            onOpenChange={(open) => !open && setDialogOpen(null)}
            currentStaffId={selectedTicket.staff_id}
            onSubmit={handleStaffAssign}
          />

          <DeleteConfirmationDialog
            open={dialogOpen === "delete"}
            onOpenChange={(open) => !open && setDialogOpen(null)}
            title="Delete Ticket"
            description={`Are you sure you want to delete "${selectedTicket.title}"? This action cannot be undone.`}
            onConfirm={handleDeleteTicket}
          />
        </>
      )}
    </div>
  )
}
