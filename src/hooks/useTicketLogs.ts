import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TicketAuditLog } from "@/types/ticket";
import { Response, DataResponse } from "@/types/reponse";
import { useLogRealtime } from "./userLogRealtime";
import { logService } from "@/services/log.service";

interface UseTicketLogsProps {
  ticketId: string;
}

export const useTicketLogs = ({ ticketId }: UseTicketLogsProps) => {
  const queryClient = useQueryClient();

  const { data: logsData, isLoading } = useQuery<Response<DataResponse<TicketAuditLog[]>>>({
    queryKey: ["ticket-logs", ticketId],
    queryFn: () => logService.getTicketLogs(ticketId),// Consider data fresh for 1 minute
  });

  const handleLogUpdate = useCallback((data: TicketAuditLog) => {
    queryClient.setQueryData<Response<DataResponse<TicketAuditLog[]>>>(
      ["ticket-logs", ticketId],
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
  }, [queryClient, ticketId]);

  const handleLogDelete = useCallback((logId: string) => {
    queryClient.setQueryData<Response<DataResponse<TicketAuditLog[]>>>(
      ["ticket-logs", ticketId],
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
  }, [queryClient, ticketId]);

  // Subscribe to realtime updates
  useLogRealtime(ticketId, handleLogUpdate, handleLogDelete);

  return {
    logs: logsData?.data.data || [],
    pagination: logsData?.data.pagination,
    isLoading
  };
}; 