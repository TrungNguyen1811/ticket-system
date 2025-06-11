import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2, FileIcon, MessageSquare, MoreVertical, Loader2 } from "lucide-react";
import { commentService } from "@/services/comment.services";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { DataResponse, Response } from "@/types/reponse";
import { Comment as CommentType } from "@/types/comment";
import AttachmentService from "@/services/attachment.service";
import { Attachment } from "@/types/ticket";

interface CommentListProps {
  ticketId: string;
  pagination: {
    page: number;
    perPage: number;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
  };
}

export const CommentList: React.FC<CommentListProps> = ({ ticketId, pagination }) => {
  const { page, perPage, setPage, setPerPage } = pagination;
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: commentsData, isLoading, isError } = useQuery<Response<DataResponse<CommentType[]>>>({
    queryKey: ["ticket-comments", ticketId, page, perPage],
    queryFn: () => commentService.getCommentsTicket(ticketId, { page, limit: perPage, isPaginate: true }),
  });

  const downloadAttachment = useMutation({
    mutationFn: (attachmentId: string) => AttachmentService.downloadAttachment(attachmentId),
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(data);
      window.open(url, '_blank');
      toast({
        title: "Success",
        description: "Attachment downloaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download attachment",
        variant: "destructive",
      });
    }
  });

  const comments = commentsData?.data.data || [];
  const total = commentsData?.data.pagination?.total || 0;

  // Handle Pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const updateComment = async (commentId: string, content: string) => {
    // Store previous data for rollback
    const previousData = queryClient.getQueryData<Response<DataResponse<CommentType[]>>>(
      ["ticket-comments", ticketId, page, perPage]
    );

    // Optimistically update the UI
    queryClient.setQueryData<Response<DataResponse<CommentType[]>>>(
      ["ticket-comments", ticketId, page, perPage],
      (oldData) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: oldData.data.data.map(comment => 
              comment.id === commentId 
                ? { ...comment, content } 
                : comment
            )
          }
        };
      }
    );

    try {
      const response = await commentService.updateComment(commentId, { content, _method: "PUT" });
      if (response.success) {
        toast({
          title: "Success",
          description: "Comment updated successfully",
        });
        setEditingCommentId(null);
      }
    } catch (error) {
      // Rollback on error
      if (previousData) {
        queryClient.setQueryData(
          ["ticket-comments", ticketId, page, perPage],
          previousData
        );
      }
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    }
  };

  const deleteComment = async (commentId: string) => {
    // Store previous data for rollback
    const previousData = queryClient.getQueryData<Response<DataResponse<CommentType[]>>>(
      ["ticket-comments", ticketId, page, perPage]
    );

    // Optimistically update the UI
    queryClient.setQueryData<Response<DataResponse<CommentType[]>>>(
      ["ticket-comments", ticketId, page, perPage],
      (oldData) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: oldData.data.data.filter(comment => comment.id !== commentId),
            pagination: {
              ...oldData.data.pagination,
              page: oldData.data.pagination?.page || 1,
              perPage: oldData.data.pagination?.perPage || perPage,
              total: (oldData.data.pagination?.total || 1) - 1
            }
          }
        };
      }
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
          previousData
        );
      }
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
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

  // Empty state
  if (!isLoading && comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center">
        <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">No comments yet.</p>
        <p className="text-sm text-gray-400 mt-1">Be the first to comment on this ticket.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-3 mt-2">
        {comments.map((comment: CommentType) => (
          <Card key={comment.id} className="group relative border-l-4 border-l-blue-500 hover:border-l-blue-600 transition-colors">
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
                      <span className="font-medium text-sm">{comment.user?.name || "Unknown"}</span>
                      <Badge variant="outline" className="text-xs font-normal">
                        {formatDate(comment.created_at)}
                      </Badge>
                    </div>
                    
                    {comment.user_id === user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditing(comment)}>
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
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[80px] text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={cancelEditing}>Cancel</Button>
                        <Button size="sm" onClick={() => handleUpdateComment(comment.id)}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-gray-700 whitespace-pre-line break-words">
                        <div
                          className="text-base text-muted-foreground"
                          dir="ltr"
                          dangerouslySetInnerHTML={{ __html: comment.content }}
                        />
                      </div>
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {comment.attachments.map((attachment: Attachment) => (
                            <Button
                              key={attachment.id}
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadAttachment(attachment.id)}
                              className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                              disabled={downloadAttachment.isPending}
                            >
                              <FileIcon className="h-3 w-3" />
                              {attachment.file_name}
                              {downloadAttachment.isPending && (
                                <Loader2 className="h-3 w-3 animate-spin ml-1" />
                              )}
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

        {total > perPage && (
          <div className="flex justify-center pt-2">
            <Pagination>
              <PaginationContent>
                {Array.from({ length: Math.ceil(total / perPage) }).map((_, idx) => (
                  <PaginationItem key={idx}>
                    <PaginationLink
                      isActive={page === idx + 1}
                      onClick={() => handlePageChange(idx + 1)}
                    >
                      {idx + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCommentId && deleteComment(deleteCommentId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
};