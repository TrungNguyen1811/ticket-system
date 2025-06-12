"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { useApiQuery } from '@/hooks/useApiQuery'
import { useTicketMutations } from "@/hooks/useTicketMutations"
import { usePusher } from "@/contexts/PusherContext"
import { usePusherSubscription } from "@/hooks/usePusherSubscription"
import { useTicketRealtime } from "@/hooks/useTicketRealtime"
import { SEARCH_STATUS_OPTIONS } from "@/lib/constants"

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100]
// const STATUS_OPTIONS = ["New", "In Progress", "Pending", "Assigned", "Complete", "Archived"]

export default function Tickets() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isConnected, pusher } = usePusher()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)

  // Use custom mutations hook
  const mutations = useTicketMutations()

  // Store the latest query parameters in a ref
  const queryParamsRef = useRef({
    currentPage,
    itemsPerPage,
    searchTerm,
    selectedStatus
  });

  // Update ref when params change
  useEffect(() => {
    queryParamsRef.current = {
      currentPage,
      itemsPerPage,
      searchTerm,
      selectedStatus
    };
  }, [currentPage, itemsPerPage, searchTerm, selectedStatus]);

  // Handle ticket updates with Pusher
  const handleTicketUpdate = useCallback((data: Ticket) => {
    const { currentPage, itemsPerPage, searchTerm, selectedStatus } = queryParamsRef.current;
    
    queryClient.setQueryData<Response<DataResponse<Ticket[]>>>(
      ["tickets", currentPage, itemsPerPage, searchTerm, selectedStatus],
      (oldData) => {
        if (!oldData?.data?.pagination) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: oldData.data.data.map((ticket) =>
              ticket.id === data.id ? { ...ticket, ...data } : ticket
            )
          }
        };
      }
    );
  }, [queryClient]);

  // Subscribe to ticket updates only when a ticket is selected
  useTicketRealtime(selectedTicket?.id || "", handleTicketUpdate);

  // Handle Pusher reconnection
  useEffect(() => {
    if (!pusher) return;

    const handleReconnect = () => {
      toast({
        title: "Reconnected",
        description: "Realtime updates reconnected",
      });
      // Only invalidate if we're disconnected for too long
      if (!isConnected) {
        queryClient.invalidateQueries({ queryKey: ["tickets"] });
      }
    };

    pusher.connection.bind("connected", handleReconnect);

    return () => {
      pusher.connection.unbind("connected", handleReconnect);
    };
  }, [pusher, toast, queryClient, isConnected]);

  // Fetch tickets with React Query
  const { data, isLoading: isLoadingTickets, isError } = useApiQuery<Response<DataResponse<Ticket[]>>>({
    queryKey: ["tickets", currentPage, itemsPerPage, searchTerm, selectedStatus],
    queryFn: () =>
      ticketService.getTickets({
        limit: itemsPerPage,
        page: currentPage,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        search: searchTerm,
      }),
  })

  // Mutation handlers
  const handleCreateTicket = (ticketData: CreateTicketSchema) => {
    mutations.create.mutate(ticketData);
  };

  const handleEditTicket = (ticketData: UpdateTicketSchema) => {
    if (!selectedTicket) return;
    mutations.update.mutate(
      {
        id: selectedTicket.id,
        data: {
          ...ticketData,
          _method: "PUT"
        }
      },
      {
        onSuccess: () => {
          setDialogOpen(null);
          setSelectedTicket(null);
        }
      }
    );
  };

  const handleStatusChange = (data: UpdateTicketSchema) => {
    if (!selectedTicket) return;
    mutations.changeStatus.mutate(
      {
        id: selectedTicket.id,
        data: {
          ...data,
          _method: "PUT"
        }
      },
      {
        onSuccess: () => {
          setDialogOpen(null);
          setSelectedTicket(null);
        }
      }
    );
  };

  const handleStaffAssign = (data: UpdateTicketSchema) => {
    if (!selectedTicket) return;
    mutations.assign.mutate(
      {
        id: selectedTicket.id,
        data: {
          ...data,
          _method: "PUT"
        }
      },
      {
        onSuccess: () => {
          setDialogOpen(null);
          setSelectedTicket(null);
        }
      }
    );
  };

  const handleDeleteTicket = () => {
    if (!selectedTicket) return;
    mutations.delete.mutate(selectedTicket.id);
    setDialogOpen(null);
    setSelectedTicket(null);
  };

  // Loading state
  const isLoading =
    isLoadingTickets ||
    mutations.create.isPending ||
    mutations.delete.isPending ||
    mutations.update.isPending ||
    mutations.assign.isPending ||
    mutations.changeStatus.isPending;

  // Total pages
  const totalPages = data?.data.pagination ? Math.ceil(data.data.pagination.total / itemsPerPage) : 1

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">Manage and track all support tickets</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? "Realtime connected" : "Disconnected"}
            </span>
          </div>
          <Button onClick={() => setDialogOpen("create")} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
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
                  {SEARCH_STATUS_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
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
                      <TableHead>Created At</TableHead>
                      <TableHead>Updated At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.data.map((ticket: Ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium truncate max-w-[250px]">{ticket.title}</TableCell>
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
                        <TableCell className="text-sm text-muted-foreground">{formatDate(ticket.created_at)}</TableCell>
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
            currentStaffId={selectedTicket.staff?.id || ""}
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
