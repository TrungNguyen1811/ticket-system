import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { commentService } from "@/services/comment.services";
import { Comment } from "@/types/comment";
import { Response, DataResponse } from "@/types/reponse";
import { useCommentRealtime } from "./useCommentRealtime";

interface UseTicketCommentsProps {
  ticketId: string;
}

export const useTicketComments = ({ ticketId }: UseTicketCommentsProps) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data: commentsData, isLoading } = useQuery<Response<DataResponse<Comment[]>>>({
    queryKey: ["ticket-comments", ticketId, page, perPage],
    queryFn: () => commentService.getCommentsTicket(ticketId, { 
      page, 
      limit: perPage, 
      isPaginate: true 
    }),
  });

  const handleCommentUpdate = useCallback((data: Comment) => {
    const currentData = queryClient.getQueryData<Response<DataResponse<Comment[]>>>(
      ["ticket-comments", ticketId, page, perPage]
    );

    // Only update if we're on the first page (newest comments)
    const shouldUpdate = currentData?.data && page === 1;

    if (shouldUpdate) {
      queryClient.setQueryData<Response<DataResponse<Comment[]>>>(
        ["ticket-comments", ticketId, page, perPage],
        (oldData) => {
          if (!oldData?.data) return oldData;
          const newTotal = (oldData.data.pagination?.total || 0) + 1;
          
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: [data, ...oldData.data.data],
              pagination: {
                ...oldData.data.pagination,
                total: newTotal,
                page: oldData.data.pagination?.page || 1,
                perPage: oldData.data.pagination?.perPage || perPage
              }
            }
          };
        }
      );
    } else {
      queryClient.invalidateQueries({ queryKey: ["ticket-comments", ticketId] });
    }
  }, [queryClient, ticketId, page, perPage]);

  // Subscribe to realtime updates
  useCommentRealtime(ticketId, handleCommentUpdate);

  return {
    comments: commentsData?.data.data || [],
    pagination: commentsData?.data.pagination,
    isLoading,
    page,
    perPage,
    setPage,
    setPerPage
  };
}; 