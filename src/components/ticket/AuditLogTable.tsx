import React, { useState, useEffect } from "react";
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
import {
  Loader2,
  Tag,
  Trash,
  UserPlus,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_OPTIONS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogDescription,
} from "../ui/alert-dialog";
import { userService } from "@/services/user.service";
import { UserAvatar } from "../shared/UserAvatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { useInView } from "react-intersection-observer";
import { useTicketLogs } from "@/hooks/ticket/useTicketLogs";
import { useTicketMutations } from "@/hooks/ticket/useTicketMutations";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { TicketAuditLog } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { TicketStatusDisplay } from "../shared/StatusBadge";

interface AuditLogTableProps {
  ticketId: string;
  currentUserId: string;
  currentStatus: string;
  onStatusChange?: (status: string) => void;
  onStaffChange?: (staffId: string) => void;
  isTicketComplete?: boolean;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  ticketId,
  currentUserId,
  currentStatus,
  onStatusChange,
  onStaffChange,
  isTicketComplete,
}) => {
  const {
    logs,
    isLoading: isLoadingTicketLogs,
    handleLogDelete,
  } = useTicketLogs({ ticketId: ticketId || "" });

  const [editingType, setEditingType] = useState<"status" | "staff" | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [deletingLog, setDeletingLog] = useState<boolean>(false);
  const [logId, setLogId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const { user } = useAuth();

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.8,
  });

  const getUsers = useApiQuery({
    queryKey: ["users", ticketId, searchQuery, perPage],
    queryFn: () =>
      userService.getUsers({
        role: "user",
        isPaginate: true,
        search: searchQuery,
        limit: perPage,
      }),
    enabled: !!ticketId && editingType === "staff",
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
      setPerPage((prev) => prev + 10);
    }
  }, [
    inView,
    hasNextPage,
    getUsers.isLoading,
    isFetchingMore,
    allUsers.length,
    totalUsers,
  ]);

  React.useEffect(() => {
    if (!getUsers.isLoading) {
      setIsFetchingMore(false);
    }
  }, [getUsers.isLoading]);

  React.useEffect(() => {
    setAllUsers([]);
    setPerPage(10);
  }, [searchQuery]);

  React.useEffect(() => {
    if (getUsers.data?.data.data) {
      setAllUsers((prev) => {
        const ids = new Set(prev.map((u) => u.id));
        const newUsers = getUsers.data.data.data.filter((u) => !ids.has(u.id));
        return [...prev, ...newUsers];
      });
    }
  }, [getUsers.data?.data.data]);

  const mutations = useTicketMutations();

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  const handleStatusChange = (
    status:
      | "new"
      | "in_progress"
      | "pending"
      | "assigned"
      | "complete"
      | "archived",
  ) => {
    onStatusChange?.(status);

    mutations.changeStatus.mutate(
      {
        data: {
          status,
          _method: "PUT",
        },
        id: ticketId,
      },
      {
        onError: () => {
          onStatusChange?.(currentStatus);
        },
      },
    );

    setEditingType(null);
    setSelectedStatus("");
    setSearchQuery("");
    setPerPage(10);
  };

  const handleStaffChange = (staffId: string) => {
    onStaffChange?.(staffId);

    mutations.assign.mutate(
      {
        data: {
          staff_id: staffId,
          _method: "PUT",
        },
        id: ticketId,
      },
      {
        onError: () => {
          onStaffChange?.(currentUserId);
        },
      },
    );

    setEditingType(null);
    setSelectedStaffId("");
    setSearchQuery("");
    setPerPage(10);
  };

  const getStatusColor = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    return statusOption?.color || "gray";
  };

  const isAdmin = user?.role === "admin";
  const isHolder = logs?.data?.data?.[0]?.holder?.id === user?.id;
  const canArchive = isAdmin || isHolder;

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
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoadingTicketLogs ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </TableCell>
            </TableRow>
          ) : !logs?.data?.data?.length ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                No logs found
              </TableCell>
            </TableRow>
          ) : (
            logs?.data?.data?.map((log: TicketAuditLog) => (
              <TableRow
                key={log.id}
                className={cn(
                  "transition-colors",
                  log.id === logs?.data?.data?.[0]?.id && "bg-muted/50",
                )}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <span
                      className="truncate max-w-[100px]"
                      title={log.holder?.name || "-"}
                    >
                      {log.holder?.name || "-"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span
                      className="truncate max-w-[100px]"
                      title={log.staff?.name || "-"}
                    >
                      {log.staff?.name || "-"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span>{formatDate(log.start_at)}</span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span>{log.end_at ? formatDate(log.end_at) : "-"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "whitespace-nowrap",
                      `bg-${getStatusColor(log.status)}-100 text-${getStatusColor(log.status)}-800`,
                    )}
                  >
                    {STATUS_OPTIONS.find((s) => s.value === log.status)
                      ?.label || log.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.to_status && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "whitespace-nowrap",
                        `bg-${getStatusColor(log.to_status)}-100 text-${getStatusColor(log.to_status)}-800`,
                      )}
                    >
                      {STATUS_OPTIONS.find((s) => s.value === log.to_status)
                        ?.label || log.to_status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end">
                    {log.id === logs?.data?.data?.[0]?.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingType("status");
                            setSelectedStatus(log.status);
                          }}
                          className="h-8 w-8 hover:bg-primary/10"
                          title="Change Status"
                          disabled={isTicketComplete}
                        >
                          <Tag className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingType("staff");
                            setSelectedStaffId(log.staff_id || "");
                          }}
                          className="h-8 w-8 hover:bg-primary/10"
                          title="Reassign Staff"
                          disabled={isTicketComplete}
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
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Log"
                      disabled={isTicketComplete}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog
        open={editingType === "status"}
        onOpenChange={() => {
          setEditingType(null);
          setSelectedStatus("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(
                  value:
                    | "new"
                    | "in_progress"
                    | "pending"
                    | "assigned"
                    | "complete"
                    | "archived",
                ) => {
                  setSelectedStatus(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder="Select status"
                    className="text-sm"
                  />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.value === "archived" && !canArchive ? null : (
                        <div className="flex items-center justify-between w-full">
                          <TicketStatusDisplay
                            status={status.value}
                            variant="iconLabel"
                          />
                          {status.value === currentStatus && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingType(null);
                setSelectedStatus("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedStatus || mutations.changeStatus.isPending}
              onClick={() =>
                handleStatusChange(
                  selectedStatus as
                    | "new"
                    | "in_progress"
                    | "pending"
                    | "assigned"
                    | "complete"
                    | "archived",
                )
              }
              className="min-w-[100px]"
            >
              {mutations.changeStatus.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingType === "staff"}
        onOpenChange={() => {
          setEditingType(null);
          setSelectedStaffId("");
          setSearchQuery("");
          setPerPage(10);
        }}
      >
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
                          <Check className="ml-auto h-4 w-4 text-green-500" />
                        )}
                      </CommandItem>
                    ))}
                    {hasNextPage && allUsers.length < totalUsers && (
                      <div
                        ref={loadMoreRef}
                        className="flex justify-center p-2"
                      >
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
            <Button
              variant="outline"
              onClick={() => {
                setEditingType(null);
                setSelectedStaffId("");
                setSearchQuery("");
                setPerPage(10);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={
                !selectedStaffId ||
                mutations.assign.isPending ||
                selectedStaffId === currentUserId
              }
              onClick={() => {
                handleStaffChange(selectedStaffId);
                setEditingType(null);
                setSelectedStaffId("");
                setSearchQuery("");
                setPerPage(10);
              }}
              className="min-w-[100px]"
            >
              {mutations.assign.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingLog}
        onOpenChange={() => setDeletingLog(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Log</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete this log? This action cannot be
            undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeletingLog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleLogDelete(logId);
                setDeletingLog(false);
              }}
              className="min-w-[100px]"
            >
              {deletingLog ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
