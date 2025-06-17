import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { MoreHorizontal, Info, Clock, FileText, Lock, FileIcon, Tag, MessageSquare, Paperclip, Loader2, Send, X, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Attachment, AttachmentList } from "@/components/editor/AttachmentList";
import attachmentService from "@/services/attachment.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Response, DataResponse } from "@/types/reponse";
import { userService } from "@/services/user.service";
import { useToast } from "@/components/ui/use-toast";
import type { User as UserType } from "@/types/user";
import ChangeStatus from "@/components/ChangeStatus";
import { useTicket } from "@/hooks/useTicket";
import { Status } from "@/types/ticket";
import AssigneeUser from "@/components/AssigneeUser";
import { cn, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import ToolbarPlugin from "@/components/editor/ToolbarPlugin";
import { commentService } from "@/services/comment.services";
import { CommentFormData, Comment as CommentType } from "@/types/comment";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OnChangePlugin } from "@/dialogs/AddCommentDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReadOnlyEditor } from "@/components/ReadOnlyEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { ClearEditorPlugin } from "@/components/ClearEditorPlugin";
import { FileUploader } from "@/components/FileUploader";
import { mailService } from "@/services/mail.service";
import { Mail, MailFormData } from "@/types/mail";
import { useCommentRealtime } from "@/hooks/useCommentRealtime";
import { useTicketComments } from "@/hooks/useTicketComments";
import SetEditTextPlugin from "@/components/SetEditTextPlugin";

export interface mockConversation {
    id: string
    title: string
    status: string
    overdue: boolean
    assignee: { id?: string, name: string }
    requester: { name: string; email: string }
    tags: string[]
    priority: string
    followers: { name: string }[]
    comments: {
        id: number
        user: { name: string }
        content: string
        created_at: string
        internal: boolean
        attachments: {
          id: string
          name: string
          url: string
        }[]
    }[] 
}

const mockConversation = {
  id: "5",
  title: "SAMPLE TICKET: Do I put it together",
  status: "Open",
  overdue: true,
  assignee: { id: "1", name: "Support/Trung Nguyen" },
  requester: { name: "Soobin Do", email: "soobin.do@example.com" },
  tags: ["delivery", "sample_ticket"],
  priority: "Normal",
  followers: [],
  comments: [
    {
      id: 1,
      user: { name: "Soobin Do" },
      content: `Hey there, I've been browsing your site and I keep seeing this term "Flat Pack Delivery". ...`,
      created_at: "2024-06-10T01:57:00Z",
      internal: false,
      attachments: [],
    },
    {
      id: 2,
      user: { name: "Trung Nguyen" },
      content: "okok",
      created_at: "2024-06-10T02:28:00Z",
      internal: true,
      attachments: [],
    },
    {
      id: 3,
      user: { name: "Trung Nguyen" },
      content: "add new file attachment",
      created_at: "2024-06-10T02:29:00Z",
      internal: true,
      attachments: [
        {
          id: "a1",
          name: "Screenshot from 2024-06-10.png",
          url: "#",
        },
      ],
    },
  ],
};

const initialConfig = {
  namespace: 'ConversationEditor',
  onError: (error: Error) => {
    console.error(error);
  },
  theme: {
    paragraph: 'mb-1',
    text: {
      base: 'text-sm',
      bold: 'font-semibold',
      italic: 'italic',
      underline: 'underline',
    },
  },
};

export default function ConversationDetail() {
  const { id } = useParams();
  const { title, status, overdue, requester, comments } = mockConversation;
  const [openConversations, setOpenConversations] = useState<mockConversation[]>([mockConversation])
  const [conversation, setConversation] = useState<mockConversation | null>(null);
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(mockConversation.assignee.id || null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(mockConversation.status || null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"public" | "internal">("public");
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [editorContent, setEditorContent] = useState<{ raw: string; html: string }>({
    raw: "",
    html: "",
  })
  const { user } = useAuth();
  const [shouldClearEditor, setShouldClearEditor] = useState(false);
  // Fetch users for staff assignment
  const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers } = useQuery<Response<DataResponse<UserType[]>>>({
    queryKey: ["users"],
    queryFn: () => userService.getUsers({ role: "user", isPaginate: false }),
  });

  const { data: mailsData, isLoading: isLoadingMails, isError: isErrorMails } = useQuery<Response<DataResponse<Mail[]>>>({
    queryKey: ["ticket-mails", id],
    queryFn: () => mailService.getMails(id || ""),
  });
  console.log("mailsData", mailsData);

  // Attachments handling
  const { data: attachmentsData, isLoading: isLoadingAttachments, isError: isErrorAttachments } = useQuery<Response<Attachment[]>>({
    queryKey: ["ticket-attachments", id],
    queryFn: () => attachmentService.getAttachments(id || ""),
  });
  const { 
    comments: commentsData,
    pagination: commentsPagination,
    isLoading: isLoadingComments,
    page: commentPage,
    perPage: commentPerPage,
    setPage: setCommentPage,
    setPerPage: setCommentPerPage
  } = useTicketComments({ ticketId: id || "" })

  const { ticket: ticketData, isLoading: isLoadingTicket, isError: isErrorTicket, handleUpdate, handleAssign, handleChangeStatus, markAsUpdated } = useTicket({ ticketId: id || "" })

  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());

  // Add new states for loading and scroll
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Handle scroll behavior
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShouldAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  }, []);

  // Auto scroll when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commentsData, shouldAutoScroll, mailsData?.data.data]);

  const handleStatusSelect = useCallback((status: "new" | "in_progress" | "pending" | "assigned" | "complete" | "archived") => {
    setSelectedStatus(status);
    handleChangeStatus({ status });
    setIsStatusOpen(false);
  }, [handleChangeStatus]);

  const downloadAttachment = useMutation({
    mutationFn: (id: string) => attachmentService.downloadAttachment(id),
  });

  const deleteAttachment = useMutation({
    mutationFn: (id: string) => attachmentService.deleteAttachment(id),
  });

  // Staff assignment mutation
  const assignStaff = useMutation({
    mutationFn: async (staffId: string) => {
      // Replace with your actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
      return { success: true };
    },
    onMutate: async (staffId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["conversation", id] });

      // Snapshot the previous value
      const previousConversation = queryClient.getQueryData(["conversation", id]);

      // Optimistically update to the new value
      const newStaff = usersData?.data.data.find(user => user.id === staffId);
      if (newStaff) {
        setConversation(prev => prev ? {
          ...prev,
          assignee: { id: newStaff.id, name: newStaff.name }
        } : null);
      }

      return { previousConversation };
    },
    onError: (err, staffId, context) => {
      // Revert back to the previous value if there's an error
      if (context?.previousConversation) {
        queryClient.setQueryData(["conversation", id], context.previousConversation);
      }
      toast({
        title: "Error",
        description: "Failed to assign staff. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff assigned successfully",
      });
      setIsStaffOpen(false);
    },
  });

  useEffect(() => {
    setConversation(mockConversation);
  }, [id]);

  const handleStaffSelect = (staffId: string) => {
    setSelectedStaff(staffId);
    assignStaff.mutate(staffId);
  };

  const publicMessages = comments.filter(c => !c.internal);
  const internalMessages = comments.filter(c => c.internal);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  // Remove selected file
  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Add state for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentType | null>(null);

  // Handle edit comment
  const handleEditComment = useCallback((comment: CommentType) => {
    setIsEditMode(true);
    setEditingComment(comment);
    setIsInternal(true); // Switch to internal tab if not already
    setActiveTab("internal");
  }, []);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setEditingComment(null);
    setEditorContent({ raw: "", html: "" });
    setSelectedFiles([]);
    setShouldClearEditor(true);
  }, []);

  // Update handleSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorContent.raw.trim() && selectedFiles.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a comment or attach files.",
        variant: "destructive",
      });
      return;
    }

    if (!id) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("content", editorContent.raw);

      // Add all selected files
      selectedFiles.forEach((file) => {
        formData.append("attachments[]", file);
      });

      if (isEditMode && editingComment) {
        const formUpdateData = new FormData();
        formUpdateData.append("content", editorContent.raw);
        formUpdateData.append("_method", "PUT");
        // Add all selected files
        selectedFiles.forEach((file) => {
          formUpdateData.append("attachments[]", file);
        });

        // Update existing comment
        await commentService.updateComment(editingComment.id, formUpdateData as CommentFormData);
        queryClient.invalidateQueries({ queryKey: ["ticket-comments", id] });
        toast({
          title: "Success",
          description: "Comment updated successfully",
        });
        setIsEditMode(false);
        setEditingComment(null);
      } else if (isInternal) {
        // Create new internal comment
        await commentService.createComment(id, formData as CommentFormData);
        toast({
          title: "Success",
          description: "Comment created successfully",
        });
      } else {
        const formMailData = new FormData();
        formMailData.append("body", editorContent.raw);

        // Add all selected files
        selectedFiles.forEach((file) => {
          formMailData.append("attachments[]", file);
        });
        // Create new public mail
        await mailService.createMail(id, formMailData as MailFormData);
        toast({
          title: "Success",
          description: "Message sent successfully",
        });
      }

      // Reset form
      setEditorContent({ raw: "", html: "" });
      setSelectedFiles([]);
      setShouldClearEditor(true);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["ticket-comments", id] });
      queryClient.invalidateQueries({ queryKey: ["ticket-mails", id] });

    } catch (error) {
      toast({
        title: "Error",
        description: isEditMode ? "Failed to update comment" : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync isInternal with activeTab
  useEffect(() => {
    setIsInternal(activeTab === "internal");
  }, [activeTab]);

  // Update activeTab when isInternal changes
  const handleInternalToggle = () => {
    const newIsInternal = !isInternal;
    setIsInternal(newIsInternal);
    setActiveTab(newIsInternal ? "internal" : "public");
  };

  // Add handleDownloadAttachment function
  const handleDownloadAttachment = useCallback((attachmentId: string) => {
    downloadAttachment.mutate(attachmentId);
  }, [downloadAttachment]);

  // Add handleDeleteComment function
  const handleDeleteComment = async (commentId: string) => {
    setIsSubmitting(true);
    // Store previous data for rollback
    const previousData = queryClient.getQueryData<Response<DataResponse<CommentType[]>>>(
      ["ticket-comments", id, commentPage, commentPerPage]
    );

    // Optimistically update the UI
    queryClient.setQueryData<Response<DataResponse<CommentType[]>>>(
      ["ticket-comments", id, commentPage, commentPerPage],
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
              perPage: oldData.data.pagination?.perPage || commentPerPage,
              total: (oldData.data.pagination?.total || 1) - 1
            }
          }
        };
      }
    );

    try {
      await commentService.deleteComment(commentId);
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error) {
      // Rollback on error
      if (previousData) {
        queryClient.setQueryData(
          ["ticket-comments", id, commentPage, commentPerPage],
          previousData
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

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[280px] bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 flex flex-col gap-4">
            {/* User Info Card */}
            <Card className="shadow-none border-gray-100">
              <CardContent className="p-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={requester.name} size="sm" />
                    <div>
                      <h2 className="text-sm font-medium text-gray-900">{requester.name}</h2>
                      <p className="text-xs text-gray-500">{requester.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-gray-600 hover:text-gray-900 h-8 text-xs"
                    onClick={() => navigate(`/communication/clients/${id}`)}
                  >
                    <Info className="h-3 w-3 mr-2" />
                    View Client Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Info Card */}
            <Card className="shadow-none border-gray-100">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs font-medium">Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={overdue ? "destructive" : "default"}
                    className="text-xs px-1.5 py-0.5"
                  >
                    {status}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs px-1.5 py-0.5",
                      mockConversation.priority === "High" && "border-red-200 text-red-700 bg-red-50",
                      mockConversation.priority === "Normal" && "border-blue-200 text-blue-700 bg-blue-50",
                      mockConversation.priority === "Low" && "border-green-200 text-green-700 bg-green-50"
                    )}
                  >
                    {mockConversation.priority} Priority
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    {/* <span>Created {formatDate(mockConversation.created_at)}</span> */}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Tag className="h-3 w-3" />
                    <span>Tags: {mockConversation.tags.join(", ")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignee Card */}
            <Card className="shadow-none border-gray-100">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs font-medium">Assignee</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <AssigneeUser
                  isStaffOpen={isStaffOpen}
                  setIsStaffOpen={setIsStaffOpen}
                  isLoadingUsers={isLoadingUsers}
                  usersData={usersData}
                  selectedStaff={selectedStaff}
                  handleStaffSelect={handleStaffSelect}
                  isErrorUsers={isErrorUsers}
                />
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className="shadow-none border-gray-100">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {ticketData && (
                  <ChangeStatus
                    isStatusOpen={isStatusOpen}
                    setIsStatusOpen={setIsStatusOpen}
                    isLoadingUsers={isLoadingUsers}
                    ticketData={ticketData}
                    selectedStatus={selectedStatus as Status}
                    handleStatusSelect={handleStatusSelect}
                    setSelectedStatus={setSelectedStatus}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-white relative">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-medium text-gray-900">{title}</h1>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <span>#{id}</span>
                  <span>•</span>
                  <span>Created by {requester.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={overdue ? "destructive" : "outline"} 
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                >
                  <Clock className="h-3 w-3" />
                  {overdue ? "Overdue" : "On Time"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                >
                  <Tag className="h-3 w-3" />
                  {mockConversation.priority}
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col relative">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "public" | "internal")}>
                <TabsList className="px-6 py-4 border-b border-gray-200 w-full shrink-0">
                  <TabsTrigger value="public" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Public Messages
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5">
                      {publicMessages.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="internal" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Internal Notes
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5">
                      {internalMessages.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex-1 overflow-auto">
                {activeTab === "public" ? (
                  <div>
                    <ScrollArea 
                      ref={scrollRef}
                      className="h-[calc(100vh-475px)] px-6" 
                      onScroll={handleScroll}
                    >
                      <div className="space-y-4 pb-6">
                        {isLoadingMails ? (
                          <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-20 w-full" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : mailsData?.data.data && mailsData.data.data.length > 0 ? (
                          mailsData.data.data.map((m) => {
                            const isOwnMessage = m.from === user?.name;
                            return (
                              <div 
                                key={m.id} 
                                className={cn(
                                  "flex gap-3 group",
                                  isOwnMessage ? "flex-row-reverse" : "flex-row"
                                )}
                              >
                                <UserAvatar name={m.from} size="sm" />
                                <div className={cn(
                                  "flex-1 min-w-0",
                                  isOwnMessage ? "items-end" : "items-start"
                                )}>
                                  <div className={cn(
                                    "flex items-center gap-2 mb-1",
                                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                                  )}>
                                    <span className="text-sm font-medium text-gray-900">{m.from}</span>
                                    <span className="text-xs text-gray-500">{formatDate(m.created_at)}</span>
                                  </div>
                                  <div className={cn(
                                    "inline-block text-sm whitespace-pre-wrap rounded-lg p-3 border",
                                    isOwnMessage 
                                      ? "bg-blue-50 border-blue-100 text-blue-900" 
                                      : "bg-gray-50 border-gray-100 text-gray-700"
                                  )}>
                                    <ReadOnlyEditor content={m.body} />
                                  </div>
                                  {m.attachments && m.attachments.length > 0 && (
                                    <div className={cn(
                                      "flex flex-wrap gap-2 mt-2",
                                      isOwnMessage ? "justify-end" : "justify-start"
                                    )}>
                                      {m.attachments.map((a) => (
                                        <a
                                          key={a.id}
                                          href={a.file_path}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
                                            isOwnMessage
                                              ? "bg-blue-100 border border-blue-200 text-blue-700 hover:bg-blue-200"
                                              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                          )}
                                        >
                                          <Paperclip className="h-3 w-3" />
                                          <span className="truncate max-w-[200px]">{a.file_name}</span>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {isOwnMessage && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <MessageSquare className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">No public messages yet</p>
                            <p className="text-xs text-gray-400 mt-1">Start the conversation with the client</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div>
                    <ScrollArea 
                      ref={scrollRef}
                      className="h-[calc(100vh-475px)] px-6" 
                      onScroll={handleScroll}
                    >
                      <div className="space-y-4 py-6">
                        {isLoadingComments ? (
                          <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-20 w-full" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : commentsData && commentsData.length > 0 ? (
                          commentsData.map((m) => {
                            const isOwnMessage = m.user?.name === user?.name;
                            return (
                              <div 
                                key={m.id} 
                                className={cn(
                                  "flex gap-3 group",
                                  isOwnMessage ? "flex-row-reverse" : "flex-row"
                                )}
                              >
                                <UserAvatar name={m.user?.name || ""} size="sm" />
                                <div className={cn(
                                  "flex-1 min-w-0",
                                  isOwnMessage ? "items-end" : "items-start"
                                )}>
                                  <div className={cn(
                                    "flex items-center gap-2 mb-1",
                                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                                  )}>
                                    <span className="text-sm font-medium text-gray-900">{m.user?.name || ""}</span>
                                    <span className="text-xs text-gray-500">{formatDate(m.created_at)}</span>
                                    {m.updated_at !== m.created_at && (
                                      <Badge variant="outline" className="text-xs font-normal text-gray-500">
                                        edited
                                      </Badge>
                                    )}
                                  </div>
                                  <div className={cn("flex", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
                                    <div className={cn(
                                      "inline-block text-sm whitespace-pre-wrap rounded-lg p-3 border",
                                      isOwnMessage 
                                        ? "bg-yellow-50 border-yellow-100 text-yellow-900" 
                                        : "bg-gray-50 border-gray-100 text-gray-700"
                                    )}>
                                      <ReadOnlyEditor content={m.content} />
                                      {m.attachments && m.attachments.length > 0 && (
                                        <div className={cn(
                                          "flex flex-wrap gap-2 mt-2",
                                          isOwnMessage ? "justify-end" : "justify-start"
                                        )}>
                                          {m.attachments.map((a) => (
                                            <Button
                                              key={a.id}
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleDownloadAttachment(a.id)}
                                              className={cn(
                                                "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
                                                isOwnMessage
                                                  ? "bg-yellow-100 border border-yellow-200 text-yellow-700 hover:bg-yellow-200"
                                                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                              )}
                                              disabled={downloadAttachment.isPending}
                                            >
                                              <FileIcon className="h-3 w-3" />
                                              {a.file_name}
                                              {downloadAttachment.isPending && (
                                                <Loader2 className="h-3 w-3 animate-spin ml-1" />
                                              )}
                                            </Button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {isOwnMessage && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditComment(m)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteComment(m.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <Lock className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">No internal notes yet</p>
                            <p className="text-xs text-gray-400 mt-1">Add internal notes visible only to staff</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <div className="border-t border-gray-200 p-4 bg-white absolute bottom-0 left-0 right-0">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isInternal ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={handleInternalToggle}
                      >
                        {isInternal ? <Lock className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                        {isInternal ? "Internal Note" : "Public Message"}
                      </Button>
                      {isEditMode && (
                        <Badge variant="secondary" className="text-xs">
                          Editing comment
                        </Badge>
                      )}
                    </div>
                    {isEditMode && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <LexicalComposer initialConfig={initialConfig}>
                      <div className="relative">
                        <ToolbarPlugin />
                        <RichTextPlugin
                          contentEditable={
                            <ContentEditable className="min-h-[100px] p-3 text-sm outline-none" />
                          }
                          placeholder={
                            <div className="absolute top-14 left-3 text-sm text-gray-400 pointer-events-none">
                              {isEditMode 
                                ? "Edit your comment..." 
                                : isInternal 
                                  ? "Write an internal note..." 
                                  : "Write a reply..."}
                            </div>
                          }
                          ErrorBoundary={LexicalErrorBoundary}
                        />
                        <HistoryPlugin />
                        <AutoFocusPlugin />
                        <OnChangePlugin onChange={setEditorContent} />
                        <ClearEditorPlugin
                          triggerClear={shouldClearEditor}
                          onClearFinished={() => setShouldClearEditor(false)}
                        />
                        <SetEditTextPlugin 
                          text={editingComment?.content || ""} 
                          isEditMode={isEditMode} 
                        />
                      </div>
                    </LexicalComposer>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700"
                        >
                          <Paperclip className="h-3 w-3 text-gray-500" />
                          <span className="truncate max-w-[200px]">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-3 w-3" />
                        Attach Files
                      </Button>
                    </label>
                    <div className="flex-1" />
                    <Button 
                      type="submit" 
                      size="sm" 
                      className="h-8 text-xs gap-1.5" 
                      disabled={isSubmitting || (!editorContent.raw.trim() && selectedFiles.length === 0)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {isEditMode ? "Updating..." : "Sending..."}
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3" />
                          {isEditMode ? "Update" : "Send"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-[300px] bg-white border-l border-gray-200">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Attachments</h3>
            {attachmentsData?.data && attachmentsData.data.length > 0 ? (
                  <AttachmentList
                    attachments={attachmentsData.data}
                    isLoading={isLoadingAttachments}
                    isError={isErrorAttachments}
                    onDownload={downloadAttachment.mutate}
                    onDelete={deleteAttachment.mutate}
                    downloadingFiles={downloadingFiles}
                    deletingFiles={deletingFiles}
                  />
                ) : (
                  <Alert
                  variant="default"
                  className="flex  border border-dashed border-gray-300 bg-gray-50 text-gray-500 rounded-md shadow-sm"
                >
                  <FileText className="h-4 w-4 text-gray-400" />
                  <AlertDescription className="text-sm">
                    No attachments found
                  </AlertDescription>
                </Alert>
                )}
          </div>
        </aside>
      </div>
    </div>
  );
}