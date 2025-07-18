import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CreateTicketData, ticketService } from "@/services/ticket.service";
import { UpdateTicketSchema } from "@/schema/ticket.schema";
import { useToast } from "@/components/ui/use-toast";
import { CommentFormData } from "@/types/comment";
import { commentService } from "@/services/comment.services";
import { logService } from "@/services/log.service";
import { Ticket } from "@/types/ticket";
import { Response } from "@/types/response";

export const useTicketMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toastConfig = (action: string) => ({
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${action} successfully`,
      });
    },
    onError: (error: { response: { data: { message: string } } }) => {
      toast({
        title: "Error",
        description: error.response.data.message,
        variant: "destructive",
      });
    },
  });

  return {
    create: useMutation({
      mutationFn: (data: CreateTicketData) => ticketService.createTicket(data),
      onSuccess: (response: Response<Ticket>) => {
        if (response.success) {
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
          toast({
            title: "Success",
            description: response.message || "Ticket created successfully",
          });
        }
      },
      onError: (error: { response: { data: { message: string } } }) => {
        toast({
          title: "Error",
          description: error.response.data.message,
          variant: "destructive",
        });
      },
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateTicketSchema }) =>
        ticketService.updateTicket(id, { ...data, _method: "PUT" }),
    }),
    assign: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateTicketSchema }) =>
        ticketService.updateTicket(id, { ...data, _method: "PUT" }),
    }),
    changeStatus: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateTicketSchema }) =>
        ticketService.updateTicket(id, { ...data, _method: "PUT" }),
    }),
    createComment: useMutation({
      mutationFn: ({ id, data }: { id: string; data: CommentFormData }) =>
        commentService.createComment(id, data),
      ...toastConfig("Comment created"),
    }),
    updateComment: useMutation({
      mutationFn: ({ id, data }: { id: string; data: CommentFormData }) =>
        commentService.updateComment(id, data),
      ...toastConfig("Comment updated"),
    }),
    deleteComment: useMutation({
      mutationFn: (id: string) => commentService.deleteComment(id),
      ...toastConfig("Comment deleted"),
    }),
    deleteLog: useMutation({
      mutationFn: (id: string) => logService.deleteLog(id),
    }),
  };
};
