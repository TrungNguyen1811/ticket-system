import React, { useState } from "react";
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
import { Pencil, Tag, Trash, UserPlus } from "lucide-react";
import { ticketService } from "@/services/ticket.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_OPTIONS } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import LogService from "@/services/log.service";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTicket = useMutation({
    mutationFn: (data: { status?: "new" | "in_progress" | "waiting" | "assigned" | "complete" | "force_closed"; staff_id?: string }) =>
      ticketService.updateTicket(ticketId, {
        ...data,
        _method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-logs"] });
      setEditingType(null);
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
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
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

      <Dialog open={editingType === 'status'} onOpenChange={() => setEditingType(null)}>
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
                  handleStatusChange(value);
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
        </DialogContent>
      </Dialog>

      <Dialog open={editingType === 'staff'} onOpenChange={() => setEditingType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Staff</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="staff">Staff ID</Label>
              <Input
                id="staff"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                placeholder="Enter staff ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                handleStaffChange(selectedStaffId);
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deletingLog} onOpenChange={() => setDeletingLog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Log</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete this log?
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingLog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteLog.mutate(logId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 