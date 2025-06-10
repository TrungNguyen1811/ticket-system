import React, { useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { TicketAuditLog } from "@/types/ticket";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Tag, Trash, UserPlus, Check } from "lucide-react";
import { ticketService } from "@/services/ticket.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_OPTIONS } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import LogService from "@/services/log.service";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "../ui/alert-dialog";
import { userService } from "@/services/user.service";
import { UserAvatar } from "../shared/UserAvatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { useInView } from "react-intersection-observer";
import { useTicketLogs } from "@/hooks/useTicketLogs";
import { Response, DataResponse } from "@/types/reponse";

interface AuditLogTableProps {
  logs: TicketAuditLog[];
  ticketId: string;
  currentUserId: string;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  ticketId,
  currentUserId,
}) => {
  const [editingType, setEditingType] = useState<'status' | 'staff' | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [deletingLog, setDeletingLog] = useState<boolean>(false);
  const [logId, setLogId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.8
  });

  const getUsers = useQuery({
    queryKey: ["users", ticketId, searchQuery, perPage],
    queryFn: () => userService.getUsers({ 
      role: "user", 
      isPaginate: true,
      search: searchQuery,
      limit: perPage,
    }),
    enabled: !!ticketId && editingType === 'staff',
  });

  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const totalUsers = getUsers.data?.data.pagination?.total || 0;
  const hasNextPage = allUsers.length < totalUsers;

  React.useEffect(() => {
    if (inView && hasNextPage && !getUsers.isLoading && !isFetchingMore) {
      if (allUsers.length >= totalUsers) {
        return;
      }
      setIsFetchingMore(true);
      setPerPage(prev => prev + 10);
    }
  }, [inView, hasNextPage, getUsers.isLoading, isFetchingMore, allUsers.length, totalUsers]);
  
  // Reset cờ sau khi getUsers đã hoàn thành
  React.useEffect(() => {
    if (!getUsers.isLoading) {
      setIsFetchingMore(false);
    }
  }, [getUsers.isLoading]);

  // Reset users when search changes
  React.useEffect(() => {
    setAllUsers([]);
    setPerPage(10);
  }, [searchQuery]);

  React.useEffect(() => {
    if (getUsers.data?.data.data) {
      setAllUsers(prev => {
        const ids = new Set(prev.map(u => u.id));
        const newUsers = getUsers.data.data.data.filter(u => !ids.has(u.id));
        return [...prev, ...newUsers];
      });
    }
  }, [getUsers.data?.data.data]);

  const handleLogUpdate = useCallback((data: TicketAuditLog) => {
    queryClient.setQueryData<Response<DataResponse<TicketAuditLog[]>>>(
      ["ticket-logs", ticketId],
      (oldData: Response<DataResponse<TicketAuditLog[]>> | undefined) => {
        if (!oldData?.data) return oldData;

        // Check if log already exists
        const logExists = oldData.data.data.some((log: TicketAuditLog) => log.id === data.id);
        if (logExists) {
          // Update existing log
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: oldData.data.data.map((log: TicketAuditLog) => 
                log.id === data.id ? data : log
              )
            }
          };
        }

        // Add new log at the beginning
        const oldPagination = oldData.data.pagination || { page: 1, perPage: 10, total: 0 };
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: [data, ...oldData.data.data],
            pagination: {
              page: oldPagination.page,
              perPage: oldPagination.perPage,
              total: oldPagination.total + 1
            }
          }
        };
      }
    );
  }, [queryClient, ticketId]);

  const handleLogDelete = useCallback((deletedLogId: string) => {
    queryClient.setQueryData<Response<DataResponse<TicketAuditLog[]>>>(
      ["ticket-logs", ticketId],
      (oldData: Response<DataResponse<TicketAuditLog[]>> | undefined) => {
        if (!oldData?.data) return oldData;

        const oldPagination = oldData.data.pagination || { page: 1, perPage: 10, total: 0 };
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: oldData.data.data.filter((log: TicketAuditLog) => log.id !== deletedLogId),
            pagination: {
              page: oldPagination.page,
              perPage: oldPagination.perPage,
              total: oldPagination.total - 1
            }
          }
        };
      }
    );
  }, [queryClient, ticketId]);

  // Subscribe to realtime updates
  useTicketLogs({ ticketId });

  const updateTicket = useMutation({
    mutationFn: (data: { status?: "new" | "in_progress" | "waiting" | "assigned" | "complete" | "force_closed"; staff_id?: string }) =>
      ticketService.updateTicket(ticketId, {
        ...data,
        _method: "PUT",
      }),
    onSuccess: () => {
      // No need to invalidate queries as we're handling updates in realtime
      setEditingType(null);
      setSelectedStatus("");
      setSelectedStaffId("");
      setSearchQuery("");
      setPerPage(10);
      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (status: "new" | "in_progress" | "waiting" | "assigned" | "complete" | "force_closed") => {
    updateTicket.mutate({ status });
  };

  const handleStaffChange = (staffId: string) => {
    updateTicket.mutate({ staff_id: staffId });
  };

  const deleteLog = useMutation({
    mutationFn: (logId: string) => LogService.deleteLog(logId),
    onSuccess: () => {
      // No need to invalidate queries as we're handling deletes in realtime
      setDeletingLog(false);
      toast({
        title: "Success",
        description: "Log deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete log",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption?.color || "gray";
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">By</TableHead>
            <TableHead className="w-[120px]">Staff</TableHead>
            <TableHead className="w-[150px]">Start Time</TableHead>
            <TableHead className="w-[150px]">End Time</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px]">To Status</TableHead>
            <TableHead className="w-[120px]">Action</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium truncate max-w-[120px]" title={log.holder?.name || "-"}>
                {log.holder?.name || "-"}
              </TableCell>
              <TableCell className="truncate max-w-[120px]" title={log.staff?.name || "-"}>
                {log.staff?.name || "-"}
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(log.start_at)}</TableCell>
              <TableCell className="whitespace-nowrap">{log.end_at ? formatDate(log.end_at) : "-"}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`bg-${getStatusColor(log.status)}-100 text-${getStatusColor(log.status)}-800 whitespace-nowrap`}
                >
                  {STATUS_OPTIONS.find(s => s.value === log.status)?.label || log.status}
                </Badge>
              </TableCell>
              <TableCell>
                {log.to_status && (
                  <Badge
                    variant="outline"
                    className={`bg-${getStatusColor(log.to_status)}-100 text-${getStatusColor(log.to_status)}-800 whitespace-nowrap`}
                  >
                    {STATUS_OPTIONS.find(s => s.value === log.to_status)?.label || log.to_status}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="truncate max-w-[120px]" title={log.action}>
                {log.action}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  {log.id === logs[0].id && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingType('status');
                          setSelectedStatus(log.status);
                        }}
                        className="h-8 w-8"
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingType('staff');
                          setSelectedStaffId(log.staff_id || '');
                        }}
                        className="h-8 w-8"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDeletingLog(true);
                      setLogId(log.id);
                    }}
                    className="h-8 w-8"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={editingType === 'status'} onOpenChange={() => {
        setEditingType(null);
        setSelectedStatus("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value: "new" | "in_progress" | "waiting" | "assigned" | "complete" | "force_closed") => {
                  setSelectedStatus(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingType(null);
              setSelectedStatus("");
            }}>
              Cancel
            </Button>
            <Button 
              disabled={!selectedStatus || updateTicket.isPending} 
              onClick={() => handleStatusChange(selectedStatus as "new" | "in_progress" | "waiting" | "assigned" | "complete" | "force_closed")}
            >
              {updateTicket.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editingType === 'staff'} onOpenChange={() => {
        setEditingType(null);
        setSelectedStaffId("");
        setSearchQuery("");
        setPerPage(10);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign Staff</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Select Staff</Label>
              <Command className="rounded-lg border shadow-md">
                <CommandInput 
                  placeholder="Search staff..." 
                  value={searchQuery}
                  onValueChange={(value) => {
                    setSearchQuery(value);
                    setPerPage(10);
                  }}
                />
                <CommandList className="max-h-[300px] overflow-y-auto">
                  <CommandEmpty>
                    {getUsers.isLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      "No staff found."
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {allUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={() => {
                          setSelectedStaffId(user.id);
                        }}
                        className="flex items-center gap-2"
                      >
                        <UserAvatar name={user.name} size="sm" />
                        <span>{user.name}</span>
                        {selectedStaffId === user.id && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                    {hasNextPage && allUsers.length < totalUsers && (
                      <div ref={loadMoreRef} className="flex justify-center p-2">
                        {getUsers.isLoading && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingType(null);
              setSelectedStaffId("");
              setSearchQuery("");
              setPerPage(10);
            }}>
              Cancel
            </Button>
            <Button 
              disabled={!selectedStaffId || updateTicket.isPending} 
              onClick={() => {
                handleStaffChange(selectedStaffId);
                setEditingType(null);
                setSelectedStaffId("");
                setSearchQuery("");
                setPerPage(10);
              }}
            >
              {updateTicket.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingLog} onOpenChange={() => setDeletingLog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Log</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete this log?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeletingLog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteLog.mutate(logId)}>Delete</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 