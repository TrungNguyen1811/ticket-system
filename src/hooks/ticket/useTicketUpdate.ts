import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { UpdateTicketSchema } from "@/schema/ticket.schema";
import { useTicketMutations } from "./useTicketMutations";
import { useTicketLogs } from "./useTicketLogs";
import { Ticket, TicketAuditLog } from "@/types/ticket";
import { Response, DataResponse } from "@/types/response";

interface UseTicketUpdateProps {
  ticketId: string;
}

interface TicketResponse extends DataResponse<Ticket> {
  log?: TicketAuditLog;
}

export const useTicketUpdate = ({ ticketId }: UseTicketUpdateProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutations = useTicketMutations();
  const { handleLogUpdate } = useTicketLogs({ ticketId });
  const queryKey = ["ticket", ticketId];
  const [isUpdating, setIsUpdating] = useState(false);

  const handleMutationError = useCallback(
    ({
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
    },
    [queryClient, toast],
  );

  const handleUpdate = useCallback(
    (data: UpdateTicketSchema) => {
      // Skip if ticket is already being updated
      if (isUpdating) {
        return;
      }

      // Store the previous data for rollback
      const previousData =
        queryClient.getQueryData<Response<DataResponse<Ticket>>>(queryKey);

      // Optimistically update the cache
      queryClient.setQueryData<Response<DataResponse<Ticket>>>(
        queryKey,
        (oldData) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: { ...oldData.data, ...data },
          };
        },
      );

      // Set updating state
      setIsUpdating(true);

      // Perform the mutation with rollback on error
      mutations.update.mutate(
        { id: ticketId, data },
        {
          onSuccess: (response) => {
            // Reset updating state
            setIsUpdating(false);

            // Update log if available
            const ticketResponse = response.data as unknown as TicketResponse;
            if (ticketResponse.log) {
              handleLogUpdate(ticketResponse.log);
            } else {
              // If no log in response, invalidate logs query to refetch
              queryClient.invalidateQueries({
                queryKey: ["ticket-logs", ticketId],
              });
            }

            toast({
              title: "Success",
              description: "Ticket updated successfully",
            });
          },
          onError: (error: Error) => {
            // Reset updating state
            setIsUpdating(false);
            handleMutationError({
              error: error as unknown as {
                response: { data: { message: string } };
              },
              fallback: previousData,
              queryKey,
            });
          },
        },
      );

      return { previousData };
    },
    [
      queryClient,
      queryKey,
      ticketId,
      mutations,
      handleMutationError,
      toast,
      isUpdating,
      handleLogUpdate,
    ],
  );

  const handleAssign = useCallback(
    (data: UpdateTicketSchema) => {
      // Skip if ticket is already being updated
      if (isUpdating) {
        return;
      }

      // Store the previous data for rollback
      const previousData =
        queryClient.getQueryData<Response<DataResponse<Ticket>>>(queryKey);

      // Optimistically update the cache
      queryClient.setQueryData<Response<DataResponse<Ticket>>>(
        queryKey,
        (oldData) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: { ...oldData.data, ...data },
          };
        },
      );

      // Set updating state
      setIsUpdating(true);

      // Perform the mutation with rollback on error
      mutations.assign.mutate(
        { id: ticketId, data },
        {
          onSuccess: (response) => {
            // Reset updating state
            setIsUpdating(false);

            // Update log if available
            const ticketResponse = response.data as unknown as TicketResponse;
            if (ticketResponse.log) {
              handleLogUpdate(ticketResponse.log);
            } else {
              // If no log in response, invalidate logs query to refetch
              queryClient.invalidateQueries({
                queryKey: ["ticket-logs", ticketId],
              });
            }

            toast({
              title: "Success",
              description: "Staff assigned successfully",
            });
          },
          onError: (error: Error) => {
            // Reset updating state
            setIsUpdating(false);
            handleMutationError({
              error: error as unknown as {
                response: { data: { message: string } };
              },
              fallback: previousData,
              queryKey,
            });
          },
        },
      );

      return { previousData };
    },
    [
      queryClient,
      queryKey,
      ticketId,
      mutations,
      handleMutationError,
      toast,
      isUpdating,
      handleLogUpdate,
    ],
  );

  const handleChangeStatus = useCallback(
    (data: UpdateTicketSchema) => {
      // Skip if ticket is already being updated
      if (isUpdating) {
        return;
      }

      // Store the previous data for rollback
      const previousData =
        queryClient.getQueryData<Response<DataResponse<Ticket>>>(queryKey);

      // Optimistically update the cache
      queryClient.setQueryData<Response<DataResponse<Ticket>>>(
        queryKey,
        (oldData) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: { ...oldData.data, ...data },
          };
        },
      );

      // Set updating state
      setIsUpdating(true);

      // Perform the mutation with rollback on error
      mutations.changeStatus.mutate(
        { id: ticketId, data },
        {
          onSuccess: (response) => {
            // Reset updating state
            setIsUpdating(false);

            // Update log if available
            const ticketResponse = response.data as unknown as TicketResponse;
            if (ticketResponse.log) {
              handleLogUpdate(ticketResponse.log);
            } else {
              // If no log in response, invalidate logs query to refetch
              queryClient.invalidateQueries({
                queryKey: ["ticket-logs", ticketId],
              });
            }

            toast({
              title: "Success",
              description: "Status updated successfully",
            });
          },
          onError: (error: Error) => {
            // Reset updating state
            setIsUpdating(false);
            handleMutationError({
              error: error as unknown as {
                response: { data: { message: string } };
              },
              fallback: previousData,
              queryKey,
            });
          },
        },
      );

      return { previousData };
    },
    [
      queryClient,
      queryKey,
      ticketId,
      mutations,
      handleMutationError,
      toast,
      isUpdating,
      handleLogUpdate,
    ],
  );

  return {
    handleUpdate,
    handleAssign,
    handleChangeStatus,
    isUpdating,
  };
};
