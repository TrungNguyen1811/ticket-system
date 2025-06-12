import { useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useLogRealtime } from "./userLogRealtime";
import { useTicketLogMutations } from "./useTicketLogMutations";
import { TicketAuditLog } from "@/types/ticket";
import { logService } from "@/services/log.service";
import { Response, DataResponse } from "@/types/reponse";

interface UseTicketLogsProps {
  ticketId: string;
}

export const useTicketLogs = ({ ticketId }: UseTicketLogsProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutations = useTicketLogMutations();
  const queryKey = ["ticket-logs", ticketId];
  const deletedLogIds = useRef<Set<string>>(new Set());

  const { data: logs, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => logService.getTicketLogs(ticketId),
  });

  const handleLogUpdate = useCallback((data: TicketAuditLog) => {
    // Update UI for new logs
    queryClient.setQueryData<Response<DataResponse<TicketAuditLog[]>>>(
      queryKey,
      (oldData) => {
        if (!oldData?.data?.data) return oldData;
        
        // Check if log already exists
        const logExists = oldData.data.data.some(log => log.id === data.id);
        if (logExists) return oldData;

        if(oldData.data.data.length > 0){
          oldData.data.data[0].end_at = data.start_at;
          oldData.data.data[0].to_status = data.status;
        }

        // Add new log at the beginning
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: [data, ...oldData.data.data]
          }
        };
      }
    );
  }, [queryClient, queryKey]);

  const handleLogDelete = useCallback((logId: string) => {
    // Skip if already deleted
    if (deletedLogIds.current.has(logId)) {
      return;
    }

    // Store the previous data for rollback
    const previousData = queryClient.getQueryData<Response<DataResponse<TicketAuditLog[]>>>(queryKey);

    // Optimistically update the cache
    queryClient.setQueryData<Response<DataResponse<TicketAuditLog[]>>>(
      queryKey,
      (oldData) => {
        if (!oldData?.data?.data) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: oldData.data.data.filter((log) => log.id !== logId)
          }
        };
      }
    );

    // Add to deleted set
    deletedLogIds.current.add(logId);

    // Perform the mutation with rollback on error
    mutations.deleteLog.mutate(logId, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Log deleted successfully",
        });
      },
      onError: (error: Error) => {
        // Remove from deleted set
        deletedLogIds.current.delete(logId);

        // Rollback on error
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }

        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    });

    return { previousData };
  }, [queryClient, queryKey, mutations, toast]);

  // Handle websocket updates
  const handleWebsocketDelete = useCallback((logId: string) => {
    // Skip if we initiated this delete
    if (deletedLogIds.current.has(logId)) {
      return;
    }

    // Update UI for external deletes
    queryClient.setQueryData<Response<DataResponse<TicketAuditLog[]>>>(
      queryKey,
      (oldData) => {
        if (!oldData?.data?.data) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: oldData.data.data.filter((log) => log.id !== logId)
          }
        };
      }
    );
  }, [queryClient, queryKey]);

  // Subscribe to realtime updates
  useLogRealtime(ticketId, handleLogUpdate, handleWebsocketDelete);

  return {
    logs,
    isLoading,
    isError,
    handleLogUpdate,
    handleLogDelete,
  };
}; 