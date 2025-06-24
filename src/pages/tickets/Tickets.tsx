"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { TicketStatusDisplay } from "@/components/shared/StatusBadge";
import { CreateTicketDialog } from "@/components/ticket/CreateTicketDialog";
import { EditTicketDialog } from "@/components/ticket/EditTicketDialog";
import { ChangeStatusDialog } from "@/components/ticket/ChangeStatusDialog";
import { AssignStaffDialog } from "@/components/ticket/AssignStaffDialog";
import { DeleteConfirmationDialog } from "@/components/ticket/DeleteConfirmationDialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  RefreshCw,
  Trash2,
  Loader2,
  Filter,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Ticket } from "@/types/ticket";
import type { Response, DataResponse } from "@/types/reponse";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketService, UpdateTicketData } from "@/services/ticket.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateTicketSchema, UpdateTicketSchema } from "@/schema/ticket.schema";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useTicketMutations } from "@/hooks/ticket/useTicketMutations";
import { usePusher } from "@/contexts/PusherContext";
import { usePusherSubscription } from "@/hooks/pusher/usePusherSubscription";
import { useTicketRealtime } from "@/hooks/realtime/useTicketRealtime";
import { SHOW_STATUS_OPTIONS } from "@/lib/constants";
import { useDebounce } from "@/hooks/utils/useDebouce";
import { getTicketColumns } from "./column";
import { DataTable } from "./data-table";
import { VisibilityState } from "@tanstack/react-table";

export default function Tickets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected, pusher } = usePusher();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Reset to page 1 when search changes
    setPage(1);
  };

  // Handle search input clear
  const handleSearchClear = () => {
    setSearchTerm("");
    setPage(1);
  };

  // Use custom mutations hook
  const mutations = useTicketMutations();

  // Store the latest query parameters in a ref
  const queryParamsRef = useRef({
    page,
    perPage,
    debouncedSearchTerm,
    selectedStatus,
  });

  // Update ref when params change
  useEffect(() => {
    queryParamsRef.current = {
      page,
      perPage,
      debouncedSearchTerm,
      selectedStatus,
    };
  }, [page, perPage, debouncedSearchTerm, selectedStatus]);

  // Handle ticket updates with Pusher
  const handleTicketUpdate = useCallback(
    (data: Ticket) => {
      const { page, perPage, debouncedSearchTerm, selectedStatus } =
        queryParamsRef.current;

      queryClient.setQueryData<Response<DataResponse<Ticket[]>>>(
        [
          "tickets",
          page,
          perPage,
          debouncedSearchTerm,
          selectedStatus,
        ],
        (oldData) => {
          if (!oldData?.data?.pagination) return oldData;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: oldData.data.data.map((ticket) =>
                ticket.id === data.id ? { ...ticket, ...data } : ticket,
              ),
            },
          };
        },
      );
    },
    [queryClient],
  );

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
  const {
    data,
    isLoading: isLoadingTickets,
    isError,
  } = useApiQuery<Response<DataResponse<Ticket[]>>>({
    queryKey: [
      "tickets",
      page,
      perPage,
      debouncedSearchTerm,
      selectedStatus,
    ],
    queryFn: () =>
      ticketService.getTickets({
        limit: perPage,
        page,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        search: debouncedSearchTerm,
      }),
  });

  // Loading states for each action
  const isLoadingStates = {
    create: mutations.create.isPending,
    update: mutations.update.isPending,
    delete: mutations.delete.isPending,
    assign: mutations.assign.isPending,
    changeStatus: mutations.changeStatus.isPending,
  };

  // Common success handler for mutations
  const handleMutationSuccess = (response: any, action: string) => {
    const updatedTicket = response.data;
    queryClient.setQueryData<Response<DataResponse<Ticket[]>>>(
      [
        "tickets",
        page,
        perPage,
        debouncedSearchTerm,
        selectedStatus,
      ],
      (oldData) => {
        if (!oldData?.data?.data) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: oldData.data.data.map((ticket) =>
              ticket.id === updatedTicket.id
                ? { ...ticket, ...updatedTicket }
                : ticket,
            ),
          },
        };
      },
    );
    setDialogOpen(null);
    setSelectedTicket(null);
    toast({
      title: "Success",
      description: `Ticket ${action} successfully`,
    });
  };

  // Common error handler for mutations
  const handleMutationError = (error: any, action: string) => {
    toast({
      title: "Error",
      description: error.message || `Failed to ${action} ticket`,
      variant: "destructive",
    });
  };

  // Mutation handlers
  const handleCreateTicket = (ticketData: CreateTicketSchema) => {
    mutations.create.mutate(ticketData, {
      onSuccess: (response) => handleMutationSuccess(response, "created"),
      onError: (error) => handleMutationError(error, "create"),
    });
  };

  const handleEditTicket = (ticketData: UpdateTicketSchema) => {
    if (!selectedTicket) return;
    mutations.update.mutate(
      {
        id: selectedTicket.id,
        data: {
          ...ticketData,
          _method: "PUT",
        },
      },
      {
        onSuccess: (response) => handleMutationSuccess(response, "updated"),
        onError: (error) => handleMutationError(error, "update"),
      },
    );
  };

  const handleStatusChange = (data: UpdateTicketSchema) => {
    if (!selectedTicket) return;
    mutations.changeStatus.mutate(
      {
        id: selectedTicket.id,
        data: {
          ...data,
          _method: "PUT",
        },
      },
      {
        onSuccess: (response) =>
          handleMutationSuccess(response, "status changed"),
        onError: (error) => handleMutationError(error, "change status"),
      },
    );
  };

  const handleStaffAssign = (data: UpdateTicketSchema) => {
    if (!selectedTicket) return;
    mutations.assign.mutate(
      {
        id: selectedTicket.id,
        data: {
          ...data,
          _method: "PUT",
        },
      },
      {
        onSuccess: (response) =>
          handleMutationSuccess(response, "staff assigned"),
        onError: (error) => handleMutationError(error, "assign staff"),
      },
    );
  };

  const handleDeleteTicket = () => {
    if (!selectedTicket) return;
    mutations.delete.mutate(selectedTicket.id, {
      onSuccess: () => {
        setDialogOpen(null);
        setSelectedTicket(null);
        toast({
          title: "Success",
          description: "Ticket deleted successfully",
        });
      },
      onError: (error) => handleMutationError(error, "delete"),
    });
  };

  // Loading state
  const isLoading =
    isLoadingTickets || Object.values(isLoadingStates).some(Boolean);

  const ticketsData = data?.data.data || [];
  const total = data?.data.pagination?.total || 0;

  const columns = getTicketColumns({
    onViewDetail: (ticket: Ticket) => {
      // Handle view detail - you can implement navigation here
      console.log("View detail for ticket:", ticket.id);
    },
    onEdit: (ticket: Ticket) => {
      setSelectedTicket(ticket);
      setDialogOpen("edit");
    },
    onAssign: (ticket: Ticket) => {
      setSelectedTicket(ticket);
      setDialogOpen("assign");
    },
    onStatusChange: (ticket: Ticket) => {
      setSelectedTicket(ticket);
      setDialogOpen("status");
    },
    onDelete: (ticket: Ticket) => {
      setSelectedTicket(ticket);
      setDialogOpen("delete");
    },
    isLoadingStates,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
        <p className="text-sm text-muted-foreground">Manage and track all support tickets</p>
      </div>
      
      <div className="rounded-xl shadow-sm">
        <div className="bg-muted/50 rounded-t-xl px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex justify-between w-full">
            <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && searchTerm.length === 1) {
                      handleSearchClear();
                    }
                  }}
                  className="pl-10 rounded-md text-sm"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={handleSearchClear}
                  >
                    <span className="sr-only">Clear search</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </Button>
                )}
              </div>

              {/* Status filter */}
              <Select 
                value={selectedStatus} 
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px] rounded-md text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">All Status</SelectItem>
                  {SHOW_STATUS_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value} className="text-sm">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Column visibility toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto bg-white border border-gray-200 shadow-sm w-24 hover:bg-white hover:border-secondary-300 hover:shadow-none text-sm">
                    Hidden
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {columns
                    .filter((column) => column.id !== "actions")
                    .map((column: any) => {
                      const colId = column.id;
                      return (
                        <DropdownMenuCheckboxItem
                          key={colId}
                          className="capitalize text-sm"
                          checked={columnVisibility[colId as string] !== false}
                          onCheckedChange={(value) =>
                            setColumnVisibility({
                              ...columnVisibility,
                              [colId as string]: !!value,
                            })
                          }
                        >
                          {colId}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["tickets"] })
                }
                disabled={isLoading}
                className="rounded-md text-sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              
              <Button 
                onClick={() => setDialogOpen("create")} 
                disabled={isLoading}
                className="text-sm"
              >
                {isLoadingStates.create ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                New Ticket
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-0">
          <DataTable
            columns={columns}
            data={ticketsData}
            isLoading={isLoading}
            isError={isError}
            page={page}
            perPage={perPage}
            total={total}
            onPageChange={setPage}
            onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
          />
        </div>
      </div>

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
            isLoading={isLoadingStates.update}
          />

          <ChangeStatusDialog
            open={dialogOpen === "status"}
            onOpenChange={(open) => !open && setDialogOpen(null)}
            currentStatus={selectedTicket.status}
            onSubmit={handleStatusChange}
            isLoading={isLoadingStates.changeStatus}
            holderId={selectedTicket.holder?.id}
          />

          <AssignStaffDialog
            open={dialogOpen === "assign"}
            onOpenChange={(open) => !open && setDialogOpen(null)}
            currentStaffId={selectedTicket.staff?.id || ""}
            onSubmit={handleStaffAssign}
            isLoading={isLoadingStates.assign}
          />

          <DeleteConfirmationDialog
            open={dialogOpen === "delete"}
            onOpenChange={(open) => !open && setDialogOpen(null)}
            onConfirm={handleDeleteTicket}
            isLoading={isLoadingStates.delete}
            title="Delete Ticket"
            description={`Are you sure you want to delete ticket "${selectedTicket.title}"? This action cannot be undone.`}
          />
        </>
      )}
    </div>
  );
}
