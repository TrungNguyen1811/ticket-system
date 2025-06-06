import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2, FileIcon, MessageSquare, MoreVertical } from "lucide-react";
import CommentService from "@/services/comment.services";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";

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
  user?: User;
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
}

export const CommentList: React.FC<CommentListProps> = ({ ticketId}) => {
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

  const { user } = useAuth();

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
        {comments.map(comment => (
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
                        {comment.content}
                      </div>
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {comment.attachments.map(attachment => (
                            <a
                              key={attachment.id}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <FileIcon className="h-3 w-3" />
                              {attachment.filename}
                            </a>
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

        {!showPagination && comments.length < total && (
          <div className="flex justify-center pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLoadMore} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}

        {showPagination && (
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