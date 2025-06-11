import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ticket } from "@/types/ticket";
import { Response, DataResponse } from "@/types/reponse";
import { useTicketRealtime } from "./useTicketRealtime";
import { useToast } from "@/components/ui/use-toast";
import { ticketService } from "@/services/ticket.service";
import { UpdateTicketSchema } from "@/schema/ticket.schema";
import { useTicketMutations } from "./useTicketMutations";  
import { usePusherSubscription } from "./usePusherSubscription";
import { userService } from "@/services/user.service";
import { User } from "@/types/user";

interface UseTicketProps {
  ticketId: string;
}

export const useTicket = ({ ticketId }: UseTicketProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutations = useTicketMutations();
  const queryKey = ["ticket", ticketId];
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => ticketService.getTicket(ticketId),
  });

  const { data: usersData } = useQuery<Response<DataResponse<User[]>>>({
    queryKey: ["users"],
    queryFn: () => userService.getUsers({
      isPaginate: false,
      role: "user",
    }),
  });

  usePusherSubscription(
    "ticket",
    `ticket.${ticketId}`,
    (data: { ticket: Ticket }) => {
      console.log('Realtime update received:', data);
      
      // Update ticket data in cache
      queryClient.setQueryData<Response<DataResponse<Ticket>>>(
        queryKey,
        (oldData) => {
          console.log('Old cache data:', oldData);
          if (!oldData?.data) return oldData;
          
          const newData = {
            ...oldData,
            data: {
              ...oldData.data,
              data: {
                ...oldData.data.data,
                ...data.ticket,
                staff: data.ticket.staff // Ensure staff is properly updated
              }
            }
          };
          console.log('New cache data:', newData);
          return newData;
        }
      );
    }
  );

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
  }, [queryClient, toast]);

  const handleUpdate = useCallback((data: UpdateTicketSchema) => {
    // Skip if ticket is already being updated
    if (isUpdating) {
      return;
    }

    // Store the previous data for rollback
    const previousData = queryClient.getQueryData<Response<DataResponse<Ticket>>>(queryKey);

    // Optimistically update the cache
    queryClient.setQueryData<Response<DataResponse<Ticket>>>(
      queryKey,
      (oldData) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: { ...oldData.data, ...data }
        };
      }
    );

    // Set updating state
    setIsUpdating(true);

    // Perform the mutation with rollback on error
    mutations.update.mutate({ id: ticketId, data }, {
      onSuccess: () => {
        // Reset updating state
        setIsUpdating(false);
        toast({
          title: "Success",
          description: "Ticket updated successfully",
        });
      },
      onError: (error: Error) => {
        // Reset updating state
        setIsUpdating(false);
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
  }, [queryClient, queryKey, ticketId, mutations, handleMutationError, toast, isUpdating]);

  const handleAssign = useCallback((data: UpdateTicketSchema) => {
    // Skip if ticket is already being updated
    if (isUpdating) {
      return;
    }

    // Store the previous data for rollback
    const previousData = queryClient.getQueryData<Response<DataResponse<Ticket>>>(queryKey);
    console.log('Previous data before assign:', previousData);

    // Optimistically update the cache
    queryClient.setQueryData<Response<DataResponse<Ticket>>>(
      queryKey,
      (oldData) => {
        if (!oldData?.data) return oldData;
        const newStaff = usersData?.data.data.find((user: User) => user.id === data.staff_id) || null;
        const newData = {
          ...oldData,
          data: {
            ...oldData.data,
            data: {
              ...oldData.data.data,
              ...data,
              staff: newStaff // Update staff info immediately
            }
          }
        };
        console.log('Optimistic update data:', newData);
        return newData;
      }
    );

    // Set updating state
    setIsUpdating(true);

    // Perform the mutation with rollback on error
    mutations.assign.mutate({ id: ticketId, data }, {
      onSuccess: (response) => {
        console.log('Assign success response:', response);
        // Reset updating state
        setIsUpdating(false);
        toast({
          title: "Success",
          description: "Staff assigned successfully",
        });
      },
      onError: (error: Error) => {
        console.log('Assign error:', error);
        // Reset updating state
        setIsUpdating(false);
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
  }, [queryClient, queryKey, ticketId, mutations, handleMutationError, toast, isUpdating, usersData]);

  const handleChangeStatus = useCallback((data: UpdateTicketSchema) => {
    // Skip if ticket is already being updated
    if (isUpdating) {
      return;
    }

    // Store the previous data for rollback
    const previousData = queryClient.getQueryData<Response<DataResponse<Ticket>>>(queryKey);

    // Optimistically update the cache
    queryClient.setQueryData<Response<DataResponse<Ticket>>>(
      queryKey,
      (oldData) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: { ...oldData.data, ...data }
        };
      }
    );

    // Set updating state
    setIsUpdating(true);

    // Perform the mutation with rollback on error
    mutations.changeStatus.mutate({ id: ticketId, data }, {
      onSuccess: () => {
        // Reset updating state
        setIsUpdating(false);
        toast({
          title: "Success",
          description: "Status updated successfully",
        });
      },
      onError: (error: Error) => {
        // Reset updating state
        setIsUpdating(false);
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
  }, [queryClient, queryKey, ticketId, mutations, handleMutationError, toast, isUpdating]);

  // Handle websocket updates
  const handleWebsocketUpdate = useCallback((data: Ticket) => {
    // Skip if we initiated this update
    if (isUpdating) {
      return;
    }

    // Update UI for external updates
    queryClient.setQueryData<Response<DataResponse<Ticket>>>(
      queryKey,
      (oldData) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: { ...oldData.data, ...data }
        };
      }
    );
  }, [queryClient, queryKey, isUpdating]);

  // Subscribe to realtime updates
  const { markAsUpdated } = useTicketRealtime(ticketId, handleWebsocketUpdate);

  return {
    ticket: ticket?.data,
    isLoading,
    isError,
    handleUpdate,
    handleAssign,
    handleChangeStatus,
    markAsUpdated,
    isUpdating,
  };
}; 