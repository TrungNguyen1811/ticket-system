import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { ticketService } from "@/services/ticket.service";
import type { CreateTicketSchema, UpdateTicketSchema } from "@/schema/ticket.schema";

export const useTicketMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const baseConfig = (action: string) => ({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast({
        title: "Success",
        description: `${action} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    create: useMutation({
      mutationFn: (data: CreateTicketSchema) => ticketService.createTicket(data),
      ...baseConfig("Ticket created"),
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateTicketSchema }) =>
        ticketService.updateTicket(id, {
          ...data,
          _method: "PUT"
        }),
      ...baseConfig("Ticket updated"),
    }),
    assign: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateTicketSchema }) =>
        ticketService.updateTicket(id, {
          ...data,
          _method: "PUT"
        }),
      ...baseConfig("Staff assigned"),
    }),
    changeStatus: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateTicketSchema }) =>
        ticketService.updateTicket(id, {
          ...data,
          _method: "PUT"
        }),
      ...baseConfig("Status updated"),
    }),
    delete: useMutation({
      mutationFn: (id: string) => ticketService.deleteTicket(id),
      ...baseConfig("Ticket deleted"),
    }),
  };
}; 