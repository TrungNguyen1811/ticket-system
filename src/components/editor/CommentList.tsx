import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2, FileIcon } from "lucide-react";
import CommentService from "@/services/comment.services";

type Attachment = {
  id: string;
  filename: string;
  url: string;
};

type Comment = {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
};

type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data: {
    data: Comment[];
    pagination: PaginationMeta;
  };
};

interface CommentListProps {
  ticketId: string;
  currentUserId: string; // Add this prop to identify current user's comments
}

export const CommentList: React.FC<CommentListProps> = ({ ticketId, currentUserId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadCount, setLoadCount] = useState(0);
  const [showPagination, setShowPagination] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await CommentService.getCommentsTicket(ticketId, { page, limit: perPage, isPaginate: true })
      if (response.success === true) {
        const typedComments: Comment[] = response.data.data.map(comment => ({
          ...comment,
          attachments: comment.attachments?.map(attachment => ({
            ...attachment,
            url: attachment.filename || '' 
          }))
        }));
        setComments(typedComments)
        setTotal(response.data.pagination?.total || 0)
        setShowPagination(true)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch comments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchComments()
  }, [ticketId, page, showPagination])

  // Handle Load More
  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    setLoadCount(prev => prev + 1);
    if (total > 50 && loadCount + 1 >= 3) setShowPagination(true);
  };

  // Handle Pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setComments([]); // reset for new page
  };

  const updateComment = async (commentId: string, content: string) => {
    try {
      const response = await CommentService.updateComment(commentId, { content, _method: "PUT" })
      if (response.success) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, content, updated_at: new Date().toISOString() }
            : comment
        ));
        setEditingCommentId(null);
        toast({
          title: "Success",
          description: "Comment updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      await CommentService.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      setDeleteCommentId(null);
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  }

  const handleUpdateComment = (commentId: string) => {
    updateComment(commentId, editContent);
  }

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  }

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent("");
  }

  // Empty state
  if (!isLoading && comments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">No comments yet.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <Card key={comment.id} className="group relative">
          <CardContent className="flex flex-col gap-1 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{comment.user_id}</span>
                <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
              </div>
              {comment.user_id === currentUserId && !editingCommentId && (
                <div className="absolute right-4 top-4 hidden group-hover:flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(comment)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteCommentId(comment.id)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {editingCommentId === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={cancelEditing}>Cancel</Button>
                  <Button onClick={() => handleUpdateComment(comment.id)}>Save</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="whitespace-pre-line break-words text-gray-800">{comment.content}</div>
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {comment.attachments.map(attachment => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-sm text-gray-600 hover:bg-gray-200"
                      >
                        <FileIcon className="h-4 w-4" />
                        {attachment.filename}
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      )}

      {!showPagination && comments.length < total && (
        <div className="flex justify-center">
          <Button onClick={handleLoadMore} disabled={isLoading}>
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      {showPagination && (
        <div className="flex justify-center">
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

      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the comment.
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
    </div>
  );
};