import { useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TicketAuditLog } from "@/types/ticket";
import { Response, DataResponse } from "@/types/reponse";
import { useLogRealtime } from "./userLogRealtime";
import { logService } from "@/services/log.service";
import { useTicketMutations } from "./useTicketMutations";
import { toast } from "@/components/ui/use-toast";

interface UseTicketLogsProps {
  ticketId: string;
}

export const useTicketLogs = ({ ticketId }: UseTicketLogsProps) => {
  const queryClient = useQueryClient();
  const mutations = useTicketMutations();
  const queryKey = ["ticket-logs", ticketId];
  const deletedLogIds = useRef<Set<string>>(new Set());

  const { data: logsData, isLoading } = useQuery<Response<DataResponse<TicketAuditLog[]>>>({
    queryKey,
    queryFn: () => logService.getTicketLogs(ticketId),
  });

  const handleMutationError = useCallback(({
    error,
    fallback,
    queryKey,
  }: {
    error: { response: { data: { message: string } } };
    fallback?: any;
    queryKey: any[];
  }) => {
    if (fallback) {
      queryClient.setQueryData(queryKey, fallback);
    }
    toast({
      title: "Error",
      description: error.response.data.message,
      variant: "destructive",
    });
  }, [queryClient]);

  const handleLogUpdate = useCallback((data: TicketAuditLog) => {
    queryClient.setQueryData<Response<DataResponse<TicketAuditLog[]>>>(
      queryKey,
      (oldData) => {
        if (!oldData?.data) return oldData;

        // Check if log already exists
        const logExists = oldData.data.data.some(log => log.id === data.id);
        if (logExists) return oldData;

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
  }, [queryClient, queryKey]);

  const updateLogsAfterDelete = useCallback((logId: string) => {
    queryClient.setQueryData<Response<DataResponse<TicketAuditLog[]>>>(
      queryKey,
      (oldData) => {
        if (!oldData?.data) return oldData;

        const oldPagination = oldData.data.pagination || { page: 1, perPage: 10, total: 0 };
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: oldData.data.data.filter(log => log.id !== logId),
            pagination: {
              page: oldPagination.page,
              perPage: oldPagination.perPage,
              total: oldPagination.total - 1
            }
          }
        };
      }
    );
  }, [queryClient, queryKey]);

  const handleLogDelete = useCallback((logId: string) => {
    // Skip if log was already deleted
    if (deletedLogIds.current.has(logId)) {
      return;
    }

    // Store the previous data for rollback
    const previousData = queryClient.getQueryData<Response<DataResponse<TicketAuditLog[]>>>(queryKey);

    // Optimistically update the cache
    updateLogsAfterDelete(logId);

    // Add to deleted logs set
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
        // Remove from deleted logs set on error
        deletedLogIds.current.delete(logId);
        handleMutationError({ 
          error: error as unknown as { response: { data: { message: string } } },
          fallback: previousData, 
          queryKey 
        });
      }
    });
  }, [queryClient, queryKey, mutations, handleMutationError, updateLogsAfterDelete]);

  // Handle websocket delete events
  const handleWebsocketDelete = useCallback((logId: string) => {
    // Skip if we initiated this delete
    if (deletedLogIds.current.has(logId)) {
      return;
    }

    // Update UI for external deletes
    updateLogsAfterDelete(logId);
  }, [updateLogsAfterDelete]);

  // Subscribe to realtime updates
  useLogRealtime(ticketId, handleLogUpdate, handleWebsocketDelete);

  return {
    logs: logsData?.data.data || [],
    pagination: logsData?.data.pagination,
    isLoading,
    handleLogUpdate,
    handleLogDelete,
  };
}; 