"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { CreateTicketDialog } from "@/dialogs/CreateTicketDialog"
import { EditTicketDialog } from "@/dialogs/EditTicketDialog"
import { ChangeStatusDialog } from "@/dialogs/ChangeStatusDialog"
import { AssignStaffDialog } from "@/dialogs/AssignStaffDialog"
import { DeleteConfirmationDialog } from "@/dialogs/DeleteConfirmationDialog"
import { Plus, Search, MoreHorizontal, Eye, Edit, UserPlus, RefreshCw, Trash2, Loader2, Filter } from "lucide-react"
import { Link } from "react-router-dom"
import type { Ticket } from "@/types/ticket"
import type { Response, DataResponse } from "@/types/reponse"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ticketService, UpdateTicketData } from "@/services/ticket.service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { CreateTicketSchema, UpdateTicketSchema } from "@/schema/ticket.schema"

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100]
const STATUS_OPTIONS = ["Open", "In Progress", "Done", "Cancelled"]

export function Tickets() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)

  // Fetch tickets with React Query
  const { data, isLoading: isLoadingTickets, isError } = useQuery<Response<DataResponse<Ticket[]>>>({
    queryKey: ["tickets", currentPage, itemsPerPage, searchTerm, selectedStatus],
    queryFn: () =>
      ticketService.getTickets({
        limit: itemsPerPage,
        page: currentPage,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        search: searchTerm,
      }),
  })

  // Mutations
  const createTicketMutation = useMutation({
    mutationFn: ticketService.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      toast({
        title: "Success",
        description: "Ticket created successfully",
      })
      setDialogOpen(null)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketData }) => ticketService.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      toast({
        title: "Success",
        description: "Ticket updated successfully",
      })
      setDialogOpen(null)
      setSelectedTicket(null)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const deleteTicketMutation = useMutation({
    mutationFn: (id: string) => ticketService.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      })
      setDialogOpen(null)
      setSelectedTicket(null)
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete ticket",
        variant: "destructive",
      })
    },
  })

  const assignStaffMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketData }) =>
      ticketService.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      toast({
        title: "Success",
        description: "Staff assigned successfully",
      })
      setDialogOpen(null)
      setSelectedTicket(null)
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign staff",
        variant: "destructive",
      })
    },
  })

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketData }) =>
      ticketService.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      toast({
        title: "Success",
        description: "Status updated successfully",
      })
      setDialogOpen(null)
      setSelectedTicket(null)
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    },
  })

  const handleCreateTicket = (ticketData: CreateTicketSchema) => {
    createTicketMutation.mutate(ticketData)
  }

  const handleEditTicket = (ticketData: UpdateTicketSchema) => {
    if (!selectedTicket) return
    updateTicketMutation.mutate({ id: selectedTicket.id, data: {
      ...ticketData,
      _method: "PUT"
    } })
  }

  const handleStatusChange = (data: UpdateTicketData) => {
    if (!selectedTicket) return
    changeStatusMutation.mutate({ id: selectedTicket.id, data: {
      status: data.status as "new" | "in_progress" | "waiting" | "assigned" | "complete" | "force_closed" | undefined,
      _method: "PUT"
    } })
  }

  const handleStaffAssign = (data: UpdateTicketData) => {
    if (!selectedTicket) return
    assignStaffMutation.mutate({ id: selectedTicket.id, data: {
      staff_id: data.staff_id || "",
      _method: "PUT"
    } })
  }

  const handleDeleteTicket = () => {
    if (!selectedTicket) return
    deleteTicketMutation.mutate(selectedTicket.id)
  }

  const isLoading =
    isLoadingTickets ||
    createTicketMutation.isPending ||
    updateTicketMutation.isPending ||
    deleteTicketMutation.isPending ||
    assignStaffMutation.isPending ||
    changeStatusMutation.isPending

  const totalPages = data?.data.pagination?.total || 1

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">Manage and track all support tickets</p>
        </div>
        <Button onClick={() => setDialogOpen("create")} disabled={isLoading}>
          {createTicketMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          New Ticket
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/50">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="text-xl">Ticket Management</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["tickets"] })} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                <Filter className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Error loading tickets</h3>
              <p className="text-gray-500 mt-2">Please try again later</p>
            </div>
          ) : (
            <>
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Holder</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.data.map((ticket: Ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="font-medium">{ticket.client_name}</div>
                              <div className="text-sm text-muted-foreground">{ticket.client_email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <UserAvatar name={ticket.holder?.name || "Unassigned"} size="sm" />
                            <span className="text-sm">{ticket.holder?.name || "Unassigned"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <UserAvatar name={ticket.staff?.name || "Unassigned"} size="sm" />
                            <span className="text-sm">{ticket.staff?.name || "Unassigned"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={ticket.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(ticket.updated_at)}</TableCell>
                        <TableCell className="text-right">
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
              </div>

              <div className="flex items-center justify-between p-4 border-t">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">Rows per page</p>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option.toString()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      } else if (
                        (page === currentPage - 2 && currentPage > 3) ||
                        (page === currentPage + 2 && currentPage < totalPages - 2)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      return null
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
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
