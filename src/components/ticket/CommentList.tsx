import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Pencil,
  Trash2,
  FileIcon,
  MessageSquare,
  MoreVertical,
  Loader2,
  AlertCircle,
  Save,
  X,
} from "lucide-react";
import { commentService } from "@/services/comment.services";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { DataResponse, Response } from "@/types/response";
import { CommentFormData, Comment as CommentType } from "@/types/comment";
import AttachmentService from "@/services/attachment.service";
import { useCommentRealtime } from "@/hooks/realtime/useCommentRealtime";
import EditCommentEditor from "../comment/EditCommentEditor";
import { ReadOnlyEditor } from "../editor/ReadOnlyEditor";

interface CommentListProps {
  ticketId: string;
  pagination: {
    page: number;
    perPage: number;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
  };
}

export const CommentList: React.FC<CommentListProps> = ({
  ticketId,
  pagination,
}) => {
  const { page, perPage, setPage, setPerPage } = pagination;
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Track the last edited comment to avoid duplicate updates
  const [lastEditedComment, setLastEditedComment] = useState<{
    id: string;
    content: string;
  } | null>(null);

  // Add new state to track if menu should be visible
  const [visibleMenuId, setVisibleMenuId] = useState<string | null>(null);

  const {
    data: commentsData,
    isLoading,
    isError,
  } = useQuery<Response<DataResponse<CommentType[]>>>({
    queryKey: ["ticket-comments", ticketId, page, perPage],
    queryFn: () =>
      commentService.getCommentsTicket(ticketId, {
        page,
        limit: perPage,
        isPaginate: true,
      }),
  });

  const downloadAttachment = useMutation({
    mutationFn: (attachmentId: string) =>
      AttachmentService.downloadAttachment(attachmentId),
    onMutate: () => {
      toast({
        title: "Opening...",
        description: "Please wait while we prepare your file",
      });
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(data);
      window.open(url, "_blank");
      // toast({
      //   title: "Success",
      //   description: "Attachment downloaded successfully",
      // });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response.data.message || "Failed to download attachment",
        variant: "destructive",
      });
    },
  });

  const comments = commentsData?.data.data || [];
  const total = commentsData?.data.pagination?.total || 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Handle realtime updates
  const handleCommentUpdate = useCallback(
    (data: CommentType) => {
      // Skip if this is our own update that we just processed
      if (
        lastEditedComment &&
        lastEditedComment.id === data.id &&
        lastEditedComment.content === data.content
      ) {
        return;
      }

      // Update UI from Pusher event
      queryClient.setQueryData<Response<DataResponse<CommentType[]>>>(
        ["ticket-comments", ticketId, page, perPage],
        (oldData) => {
          if (!oldData?.data) return oldData;

          // Check if this is a new comment or an update
          const isNewComment = !oldData.data.data.some(
            (comment: CommentType) => comment.id === data.id,
          );

          if (isNewComment && page === 1) {
            // Add new comment to the beginning if we're on page 1
            const newData = {
              ...oldData,
              data: {
                ...oldData.data,
                data: [data, ...oldData.data.data],
                pagination: {
                  total: (oldData.data.pagination?.total || 0) + 1,
                  page: oldData.data.pagination?.page || 1,
                  perPage: oldData.data.pagination?.perPage || perPage,
                },
              },
            };

            // Force a re-render by invalidating the query
            queryClient.invalidateQueries({
              queryKey: ["ticket-comments", ticketId, page, perPage],
            });

            return newData;
          } else {
            // Update existing comment
            const newData = {
              ...oldData,
              data: {
                ...oldData.data,
                data: oldData.data.data.map((comment) =>
                  comment.id === data.id ? data : comment,
                ),
              },
            };

            // Force a re-render by invalidating the query
            queryClient.invalidateQueries({
              queryKey: ["ticket-comments", ticketId, page, perPage],
            });

            return newData;
          }
        },
      );

      // Update attachments if the comment has them
      if (data.attachments?.length) {
        queryClient.invalidateQueries({
          queryKey: ["ticket-attachments", ticketId],
        });
      }

      // Reset visible menu for new comments
      const currentData = queryClient.getQueryData<
        Response<DataResponse<CommentType[]>>
      >(["ticket-comments", ticketId, page, perPage]);
      if (
        currentData?.data &&
        !currentData.data.data.some(
          (comment: CommentType) => comment.id === data.id,
        )
      ) {
        setVisibleMenuId(null);
      }
    },
    [queryClient, ticketId, page, perPage, lastEditedComment],
  );

  // Add useEffect to handle data updates
  useEffect(() => {
    if (commentsData?.data) {
      // Force re-render when data changes
      queryClient.invalidateQueries({
        queryKey: ["ticket-comments", ticketId, page, perPage],
      });
    }
  }, [commentsData, queryClient, ticketId, page, perPage]);

  // Subscribe to Pusher events
  useCommentRealtime(
    ticketId,
    handleCommentUpdate,
    undefined,
    lastEditedComment,
  );

  // Handle Pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const updateComment = async (commentId: string, content: string) => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("_method", "PUT");

      const response = await commentService.updateComment(
        commentId,
        formData as CommentFormData,
      );
      if (response.success) {
        setLastEditedComment({
          id: commentId,
          content: response.data.content,
        });

        // Optimistically update the UI
        queryClient.setQueryData<Response<DataResponse<CommentType[]>>>(
          ["ticket-comments", ticketId, page, perPage],
          (oldData) => {
            if (!oldData?.data) return oldData;
            return {
              ...oldData,
              data: {
                ...oldData.data,
                data: oldData.data.data.map((comment) =>
                  comment.id === commentId
                    ? {
                        ...comment,
                        content: response.data.content,
                        updated_at: response.data.updated_at,
                        user: response.data.user,
                      }
                    : comment,
                ),
              },
            };
          },
        );

        toast({
          title: "Success",
          description: "Comment updated successfully",
        });
        setEditingCommentId(null);
        setEditContent("");
        // Reset visible menu after successful update
        setVisibleMenuId(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    setIsSubmitting(true);
    // Store previous data for rollback
    const previousData = queryClient.getQueryData<
      Response<DataResponse<CommentType[]>>
    >(["ticket-comments", ticketId, page, perPage]);

    // Optimistically update the UI
    queryClient.setQueryData<Response<DataResponse<CommentType[]>>>(
      ["ticket-comments", ticketId, page, perPage],
      (oldData) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: oldData.data.data.filter(
              (comment) => comment.id !== commentId,
            ),
            pagination: {
              ...oldData.data.pagination,
              page: oldData.data.pagination?.page || 1,
              perPage: oldData.data.pagination?.perPage || perPage,
              total: (oldData.data.pagination?.total || 1) - 1,
            },
          },
        };
      },
    );

    try {
      await commentService.deleteComment(commentId);
      setDeleteCommentId(null);
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error) {
      // Rollback on error
      if (previousData) {
        queryClient.setQueryData(
          ["ticket-comments", ticketId, page, perPage],
          previousData,
        );
      }
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = (commentId: string) => {
    updateComment(commentId, editContent);
  };

  const startEditing = (comment: CommentType) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleDownloadAttachment = (attachmentId: string) => {
    downloadAttachment.mutate(attachmentId);
  };

  // Add scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Auto scroll if we're near the bottom
    setShouldAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  }, []);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments, shouldAutoScroll]);

  // Handle loading more comments
  const handleLoadMore = useCallback(async () => {
    if (page > 1 && !isLoadingMore) {
      setIsLoadingMore(true);
      setPage(page - 1);
      setIsLoadingMore(false);
    }
  }, [page, isLoadingMore, setPage]);

  // Empty state
  if (!isLoading && comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center">
        <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">No comments yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          Be the first to comment on this ticket.
        </p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-500">Failed to load comments.</p>
        <p className="text-sm text-gray-400 mt-1">Please try again later.</p>
      </div>
    );
  }

  return (
    <ScrollArea ref={scrollRef} className="h-full pr-4" onScroll={handleScroll}>
      <div className="space-y-3 mt-2">
        {page > 1 && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more comments"
              )}
            </Button>
          </div>
        )}

        {comments.map((comment: CommentType) => (
          <Card
            key={comment.id}
            className="group relative border-l-4 border-l-blue-500 hover:border-l-blue-600 transition-colors"
            onMouseEnter={() => setVisibleMenuId(comment.id)}
            onMouseLeave={() => setVisibleMenuId(null)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {comment.user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.user?.name || "Unknown"}
                      </span>
                      <Badge variant="outline" className="text-xs font-normal">
                        {formatDate(comment.created_at)}
                      </Badge>
                      {comment.updated_at !== comment.created_at && (
                        <Badge
                          variant="outline"
                          className="text-xs font-normal text-gray-500"
                        >
                          edited
                        </Badge>
                      )}
                    </div>

                    {comment.user_id === user?.id &&
                      editingCommentId !== comment.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 transition-opacity ${
                                visibleMenuId === comment.id
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-100"
                              }`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => startEditing(comment)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteCommentId(comment.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="space-y-2 mt-2">
                      <EditCommentEditor
                        initialState={comment.content}
                        onChange={(val) => setEditContent(val.raw)}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                          disabled={isSubmitting}
                          className="gap-1.5"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateComment(comment.id)}
                          disabled={isSubmitting || !editContent}
                          className="gap-1.5"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-gray-700 whitespace-pre-line break-words">
                        <ReadOnlyEditor content={comment.content} />
                      </div>
                      {comment.attachments &&
                        comment.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {comment.attachments.map((attachment) => (
                              <Button
                                key={attachment.id}
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDownloadAttachment(attachment.id)
                                }
                                className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                <FileIcon className="h-3 w-3" />
                                {attachment.file_name}
                              </Button>
                            ))}
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteCommentId}
        onOpenChange={() => setDeleteCommentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCommentId && deleteComment(deleteCommentId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
};
