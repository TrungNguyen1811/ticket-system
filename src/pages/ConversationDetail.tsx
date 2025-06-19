import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Info, Clock, FileText, Lock, FileIcon, Tag, MessageSquare, Paperclip, Loader2, Send, X, Pencil, Trash2, MoreVertical, Trash, Download, Search, ImageIcon, TimerIcon, RefreshCw, Menu } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Attachment, AttachmentList } from "@/components/editor/AttachmentList";
import attachmentService from "@/services/attachment.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Response, DataResponse } from "@/types/reponse";
import { userService } from "@/services/user.service";
import { useToast } from "@/components/ui/use-toast";
import type { User as UserType } from "@/types/user";
import ChangeStatus from "@/components/ChangeStatus";
import { useTicket } from "@/hooks/useTicket";
import { Status, Ticket } from "@/types/ticket";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useMailTicket } from "@/hooks/useMailTicket";

// Editor configuration
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
  // Router and context hooks
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // State management
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"public" | "internal">(() => {
    const savedTab = localStorage.getItem(`conversation-${id}-activeTab`);
    return savedTab === "internal" ? "internal" : "public";
  });
  const [isInternal, setIsInternal] = useState(false);
  const [editorContent, setEditorContent] = useState<{ raw: string; html: string; text: string }>({
    raw: "",
    html: "",
    text: "",
  });
  const [shouldClearEditor, setShouldClearEditor] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentType | null>(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data fetching
  const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers } = useQuery<Response<DataResponse<UserType[]>>>({
    queryKey: ["users"],
    queryFn: () => userService.getUsers({ role: "user", isPaginate: false }),
  });

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
  } = useTicketComments({ ticketId: id || "" });

  const { 
    ticket: ticketData, 
    isLoading: isLoadingTicket, 
    isError: isErrorTicket, 
    handleUpdate, 
    handleAssign, 
    handleChangeStatus, 
    markAsUpdated 
  } = useTicket({ ticketId: id || "" });

  const { 
    mails: mailsData, 
    isLoading: isLoadingMails,
    hasNewMails: hasNewMailNotification,
    setHasNewMails: setNewMailNotification
  } = useMailTicket({ ticketId: id || "" });

  // Mutations
  const downloadAttachment = useMutation({
    mutationFn: (attachmentId: string) => attachmentService.downloadAttachment(attachmentId),
    onMutate: (attachmentId) => {
      setDownloadingFiles(prev => new Set(prev).add(attachmentId));
    },
    onSuccess: (data, attachmentId) => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setDownloadingFiles(prev => {
        const next = new Set(prev);
        next.delete(attachmentId);
        return next;
      });
    },
    onError: (_, attachmentId) => {
      setDownloadingFiles(prev => {
        const next = new Set(prev);
        next.delete(attachmentId);
        return next;
      });
      toast({
        title: "Error",
        description: "Failed to download attachment",
        variant: "destructive",
      });
    }
  });

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: string) => attachmentService.deleteAttachment(attachmentId),
    onMutate: (attachmentId) => {
      setDeletingFiles(prev => new Set(prev).add(attachmentId));
    },
    onSuccess: (_, attachmentId) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-attachments", id] });
      queryClient.invalidateQueries({ queryKey: ["ticket-comments", id] });
      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      });
      setDeletingFiles(prev => {
        const next = new Set(prev);
        next.delete(attachmentId);
        return next;
      });
    },
    onError: (_, attachmentId) => {
      toast({
        title: "Error",
        description: "Failed to delete attachment",
        variant: "destructive",
      });
      setDeletingFiles(prev => {
        const next = new Set(prev);
        next.delete(attachmentId);
        return next;
      });
    }
  });

  // Effects
  useEffect(() => {
    const savedTab = localStorage.getItem(`conversation-${id}-activeTab`);
    setActiveTab(savedTab === "internal" ? "internal" : "public");
  }, [id]);

  useEffect(() => {
    localStorage.setItem(`conversation-${id}-activeTab`, activeTab);
  }, [activeTab, id]);

  useEffect(() => {
    if (ticketData?.staff?.id) {
      setSelectedStaff(ticketData.staff.id);
    }
  }, [ticketData]);

  useEffect(() => {
    setIsInternal(activeTab === "internal");
  }, [activeTab]);

  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commentsData, shouldAutoScroll, mailsData]);

  // Handlers
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShouldAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  }, []);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    const container = containerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    if (!isLoadingMails && mailsData?.length > 0) {
      scrollToBottom();
    }
  }, [isLoadingMails, mailsData]);


  const handleStatusSelect = useCallback((status: Status) => {
    setSelectedStatus(status);
    markAsUpdated(id || "");
    handleChangeStatus({ status });
    setIsStatusOpen(false);
    
    // Invalidate audit logs to ensure they are updated
    queryClient.invalidateQueries({ queryKey: ["ticket-logs", id] });
  }, [handleChangeStatus, markAsUpdated, id, queryClient]);

  const handleStaffSelect = (staffId: string) => {
    setSelectedStaff(staffId);
    markAsUpdated(id || "");

    // Get the new staff user data
    const newStaff = usersData?.data.data.find(user => user.id === staffId);

    // Optimistically update the UI
    queryClient.setQueryData<Response<Ticket>>(
      ["ticket", id],
      (oldData) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            staff: newStaff || null
          }
        };
      }
    );

    handleAssign({ 
      staff_id: staffId,
      _method: "PUT"
    });

    // Invalidate audit logs to ensure they are updated
    queryClient.invalidateQueries({ queryKey: ["ticket-logs", id] });
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleReloadPublicChat = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["ticket-mails", id] });
    setNewMailNotification(false);
    toast({
      title: "Chat refreshed",
      description: "Public chat has been updated",
    });
  }, [queryClient, id, toast, setNewMailNotification]);

  const handleEditComment = useCallback((comment: CommentType) => {
    setIsEditMode(true);
    setEditingComment(comment);
    setIsInternal(true);
    setActiveTab("internal");
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setEditingComment(null);
    setEditorContent({ raw: "", html: "", text: "" });
    setSelectedFiles([]);
    setShouldClearEditor(true);
  }, []);

  const handleInternalToggle = () => {
    const newIsInternal = !isInternal;
    setIsInternal(newIsInternal);
    setActiveTab(newIsInternal ? "internal" : "public");
  };

  const handleDownloadAttachment = async (id: string) => {
    try {
      setDownloadingId(id);
      await downloadAttachment.mutateAsync(id);
    } catch (err) {
      // handle error if needed
    } finally {
      setDownloadingId(null);
    }
  };
  

  const handleDeleteComment = async (commentId: string) => {
    setIsSubmitting(true);
    const previousData = queryClient.getQueryData<Response<DataResponse<CommentType[]>>>(
      ["ticket-comments", id, commentPage, commentPerPage]
    );

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

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔄 handleSubmit called", { isInternal, isEditMode, selectedFilesLength: selectedFiles.length });
    
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

      selectedFiles.forEach((file) => {
        formData.append("attachments[]", file);
      });

      if (isEditMode && editingComment) {
        const formUpdateData = new FormData();
        formUpdateData.append("content", editorContent.raw);
        formUpdateData.append("_method", "PUT");
        selectedFiles.forEach((file) => {
          formUpdateData.append("attachments[]", file);
        });

        await commentService.updateComment(editingComment.id, formUpdateData as CommentFormData);
        queryClient.invalidateQueries({ queryKey: ["ticket-comments", id] });
        setIsEditMode(false);
        setEditingComment(null);
      } else if (isInternal) {
        console.log("📝 Creating internal comment...");
        await commentService.createComment(id, formData as CommentFormData);
        console.log("✅ Internal comment created successfully");
        queryClient.invalidateQueries({ queryKey: ["ticket-attachments", id] });
        queryClient.invalidateQueries({ queryKey: ["ticket-comments", id] });
      } else {
        const formMailData = new FormData();
        formMailData.append("body", editorContent.text);
        // formMailData.append("content", editorContent.raw);
        selectedFiles.forEach((file) => {
          formMailData.append("attachments[]", file);
        });
         
        const mail = await mailService.createMail(id, formMailData as MailFormData);
          if (mail.success) {
            // Optimistic update for mail
          const optimisticMail: Mail = {
            id: `temp-${Date.now()}`,
            from_name: user?.name || "",
            from_email: "phamphanbang@gmail.com",
            subject: `Re: ${ticketData?.title || ""}`,
            body: editorContent.text,
            attachments: selectedFiles.map(file => ({
              id: `temp-${Date.now()}`,
              file_name: file.name,
              file_path: URL.createObjectURL(file),
              file_type: file.type,
              file_size: file.size,
              file_extension: file.name.split(".").pop() || "",
              content_type: file.type,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ticket_id: id,
              comment_id: ""
            })),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Add optimistic mail to cache
          queryClient.setQueryData<Response<DataResponse<Mail[]>>>(
            ["ticket-mails", id],
            (oldData) => {
              if (!oldData?.data) return oldData;
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  data: [...oldData.data.data, optimisticMail]
                }
              };
            }
          );
        } else {
          toast({
            title: "Error",
            description: mail.message,
            variant: "destructive",
          });
        }
        
        // Don't invalidate mails query - let real-time update handle it
        // queryClient.invalidateQueries({ queryKey: ["ticket-mails", id] });
      }

      setEditorContent({ raw: "", html: "", text: "" });
      setSelectedFiles([]);
      setShouldClearEditor(true);

      // Query invalidation is already handled in the specific conditions above
      // No need to invalidate again here

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

  // Filtered attachments
  const filtered = attachmentsData?.data.filter(a =>
    a.file_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] ticket-detail-container">
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Left Sidebar */}
        <aside className={cn(
          "shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 info-section",
          showLeftSidebar 
            ? "w-[280px] lg:w-[320px] xl:w-[280px]" 
            : "w-0 overflow-hidden"
        )}>
          <div className="p-3 lg:p-4 flex flex-col gap-3 lg:gap-4">
            {/* User Info Card */}
            <Card className="shadow-none border-gray-100">
              <CardContent className="p-2 lg:p-3">
                <div className="space-y-2 lg:space-y-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={ticketData?.client_name || ""} size="sm" />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xs lg:text-sm font-medium text-gray-900 truncate">{ticketData?.client_name || ""}</h2>
                      <p className="text-xs text-gray-500 truncate">{ticketData?.client_email || ""}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-gray-600 hover:text-gray-900 h-7 lg:h-8 text-xs"
                    onClick={() => navigate(`/communication/clients/${id}`)}
                  >
                    <Info className="h-3 w-3 mr-2" />
                    <span className="hidden lg:inline">View Client Profile</span>
                    <span className="lg:hidden">Profile</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Ticket Info Card */}
            <Card className="shadow-none border-gray-100">
              <CardHeader className="p-2 lg:p-3 pb-1 lg:pb-2">
                <CardTitle className="text-xs font-medium">Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="p-2 lg:p-3 space-y-2 lg:space-y-3">
                <div className="flex items-center gap-2">
                  <UserAvatar name={ticketData?.holder?.name || ""} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs lg:text-sm font-medium truncate">{ticketData?.holder?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{ticketData?.holder?.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge status={ticketData?.status || ""} />
                </div>

                <div className="space-y-1 lg:space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span className="truncate">Created {formatDate(ticketData?.created_at || "")}</span>
                  </div>
                </div>
                <div className="space-y-1 lg:space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <TimerIcon className="h-3 w-3" />
                    <span className="truncate">Updated {formatDate(ticketData?.updated_at || "")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignee Card */}
            <div className="shadow-none border-gray-100">
              <div className="px-2 lg:px-3 pb-1 lg:pb-2">
                <div className="text-xs lg:text-sm font-medium">Assignee</div>
              </div>
              <div className="px-2 lg:px-3">
                <AssigneeUser
                  isStaffOpen={isStaffOpen}
                  setIsStaffOpen={setIsStaffOpen}
                  isLoadingUsers={isLoadingUsers}
                  usersData={usersData}
                  selectedStaff={selectedStaff}
                  handleStaffSelect={handleStaffSelect}
                  isErrorUsers={isErrorUsers}
                />
              </div>
            </div>

            {/* Status Card */}
            <div className="shadow-none border-gray-100">
              <div className="px-2 lg:px-3 pb-1 lg:pb-2">
                <div className="text-xs lg:text-sm font-medium">Status</div>
              </div>
              <div className="px-2 lg:px-3">
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
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col bg-white relative chat-section">
          {/* Header */}
          <div className="px-4 lg:px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2 justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden h-8 w-8 p-0"
                      onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                    <Link to={`/tickets/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
                      <h1 className="text-base font-medium text-gray-900">{ticketData?.title || ""}</h1>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleReloadPublicChat}
                      size="sm"
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                        Reload Chat
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden h-8 w-8 p-0"
                      onClick={() => setShowRightSidebar(!showRightSidebar)}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <span>#{id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col relative">
              {/* <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "public" | "internal")}>
                <TabsList className="px-6 py-4 border-b border-gray-200 w-full shrink-0">
                  <TabsTrigger value="public" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Public Messages
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5">
                      {mailsData?.data.data.length || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="internal" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Internal Notes
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5">
                      {commentsData?.length || 0}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs> */}
              <div className="flex-1 overflow-auto">
                {activeTab === "public" ? (
                  <div>
                    {/* Public Chat Header with Reload Button */}
                    {/* {hasNewMailNotification && (
                      <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-700">New messages available</span>
                          </div>
                          <Button
                            onClick={handleReloadPublicChat}
                            size="sm"
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reload Chat
                          </Button>
                        </div>
                      </div>
                    )} */}
                    
                    <ScrollArea 
                      ref={containerRef}
                      className="h-[calc(100vh-475px)] px-4 lg:px-6" 
                      onScroll={handleScroll}
                    >
                      <div className="space-y-4 py-6 w-full">
                        {isLoadingMails ? (
                          <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex gap-2 lg:gap-3">
                                <Skeleton className="h-6 w-6 lg:h-8 lg:w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-3 lg:h-4 w-24 lg:w-32" />
                                  <Skeleton className="h-16 lg:h-20 w-full" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : mailsData && mailsData.length > 0 ? (
                          mailsData.map((m) => {
                            const isOwnMessage = m.from_email === "phamphanbang@gmail.com";
                            return (
                              <div 
                                key={m.id} 
                                className={cn(
                                  "flex gap-3 group",
                                  isOwnMessage ? "flex-row-reverse" : "flex-row"
                                )}
                              >
                                <UserAvatar name={m.from_name} size="sm" />
                                <div className={cn(
                                  "flex-1 min-w-0",
                                  isOwnMessage ? "items-end" : "items-start"
                                )}>
                                  <div className={cn(
                                    "flex items-center gap-2 mb-1",
                                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                                  )}>
                                    <span className="text-sm font-medium text-gray-900">{m.from_name}</span>
                                    <span className="text-xs text-gray-500">{formatDate(m.created_at)}</span>
                                  </div>
                                  <div className={cn("flex", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
                                    <div className={cn(
                                      "break-words text-sm whitespace-pre-wrap rounded-lg p-3 border",
                                      "max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]",
                                      isOwnMessage 
                                        ? "bg-gray-50 border-gray-100 text-gray-900" 
                                        : "bg-blue-50 border-blue-100 text-blue-900"
                                    )}>
                                      {/* <div dangerouslySetInnerHTML={{ __html: m.body }}/> */}
                                      <div className={cn(isOwnMessage ? "flex flex-row-reverse" : "")}>
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
                                                  "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors max-w-[200px] sm:max-w-[250px]",
                                                  isOwnMessage
                                                    ? "bg-blue-100 border border-blue-200 text-blue-700 hover:bg-blue-200"
                                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                                )}
                                              >
                                                <Paperclip className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{a.file_name}</span>
                                              </a>
                                            ))}
                                          </div>
                                        )}
                                    </div>  
                                  </div>
                                </div>
                                {isOwnMessage && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center p-4 lg:p-8">
                            <MessageSquare className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400 mb-2" />
                            <p className="text-xs lg:text-sm text-gray-500">No public messages yet</p>
                            <p className="text-xs text-gray-400 mt-1">Start the conversation with the client</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div>
                    <ScrollArea 
                      ref={containerRef}
                      className="h-[calc(100vh-475px)] px-6" 
                      onScroll={handleScroll}
                    >
                      <div className="space-y-4 py-6">
                        {isLoadingComments ? (
                          <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex gap-2 lg:gap-3">
                                <Skeleton className="h-6 w-6 lg:h-8 lg:w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-3 lg:h-4 w-24 lg:w-32" />
                                  <Skeleton className="h-16 lg:h-20 w-full" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : commentsData && commentsData.length > 0 ? (
                          [...commentsData].reverse().map((m) => {
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
                                      "text-sm whitespace-pre-wrap rounded-lg p-3 border",
                                      "max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]",
                                      isOwnMessage 
                                        ? "bg-yellow-50 border-yellow-100 text-yellow-900" 
                                        : "bg-gray-50 border-gray-100 text-gray-700"
                                    )}>
                                      <div className={cn(isOwnMessage ? "flex flex-row-reverse" : "")}>
                                        <ReadOnlyEditor content={m.content}/>
                                      </div>
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
                                                "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors max-w-[200px] sm:max-w-[250px]",
                                                isOwnMessage
                                                  ? "bg-yellow-100 border border-yellow-200 text-yellow-700 hover:bg-yellow-200"
                                                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                              )}
                                              disabled={downloadingId === a.id}
                                            >
                                              <FileIcon className="h-3 w-3 flex-shrink-0" />
                                              <span className="truncate">{a.file_name}</span>
                                              {downloadingId === a.id && (
                                                <Loader2 className="h-3 w-3 animate-spin ml-1 flex-shrink-0" />
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
                                        <MoreVertical className="h-4 w-4" />
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
                          <div className="flex flex-col items-center justify-center h-full text-center p-4 lg:p-8">
                            <Lock className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400 mb-2" />
                            <p className="text-xs lg:text-sm text-gray-500">No internal notes yet</p>
                            <p className="text-xs text-gray-400 mt-1">Add internal notes visible only to staff</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <div className="border-t border-gray-200 p-3 lg:p-4 bg-white absolute bottom-0 left-0 right-0">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isInternal ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={handleInternalToggle}
                      >
                        {isInternal ? <Lock className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                        <span className="hidden sm:inline">{isInternal ? "Internal Note" : "Public Message"}</span>
                        <span className="sm:hidden">{isInternal ? "Internal" : "Public"}</span>
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
                            <ContentEditable className="min-h-[80px] lg:min-h-[100px] p-3 text-sm outline-none" />
                          }
                          placeholder={
                            <div className="absolute lg:top-14 left-3 md:top-20 left-3 text-sm text-gray-400 pointer-events-none">
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
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 max-w-full"
                        >
                          <Paperclip className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-[200px]">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 flex-shrink-0"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
                        className="h-8 text-xs gap-1.5 w-full sm:w-auto"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="hidden sm:inline">Attach Files</span>
                        <span className="sm:hidden">Attach</span>
                      </Button>
                    </label>
                    <div className="flex-1" />
                    <Button 
                      type="submit" 
                      size="sm" 
                      className="h-8 text-xs gap-1.5 w-full sm:w-auto" 
                      disabled={isSubmitting || (!editorContent.raw.trim() && selectedFiles.length === 0)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="hidden sm:inline">{isEditMode ? "Updating..." : "Sending..."}</span>
                          <span className="sm:hidden">{isEditMode ? "Update" : "Send"}</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3" />
                          <span className="hidden sm:inline">{isEditMode ? "Update" : "Send"}</span>
                          <span className="sm:hidden">{isEditMode ? "Update" : "Send"}</span>
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
        <aside className={cn(
          "shrink-0 bg-white border-l border-gray-200 transition-all duration-300 attachments-section",
          showRightSidebar 
            ? "w-[300px] lg:w-[320px] xl:w-[300px]" 
            : "w-0 overflow-hidden"
        )}>
          <div className="p-3 lg:p-4">
            {attachmentsData?.data ? (
                  <div className="h-full">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
                    <div className="text-sm lg:text-md font-medium">Attachments</div>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search attachments..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 text-xs"
                      />
                    </div>
                    <div className="space-y-2 h-full overflow-y-auto pr-2">
                      <ScrollArea className="h-[calc(100vh-200px)] px-2 lg:px-4 pb-4 w-full">
                        {isLoadingAttachments ? (
                          <div className="flex items-center justify-center p-4 text-xs">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          </div>
                        ) : isErrorAttachments ? (
                          <div className="text-center p-4 text-red-500 text-xs">
                            Failed to load attachments
                          </div>
                        ) : filtered && filtered.length > 0 ? (
                          <div className="grid gap-2">
                            {filtered.map(attachment => (
                              <div
                                key={attachment.id}
                                className="flex items-center justify-between p-2 rounded-lg border bg-gray-50/50 hover:bg-gray-50 transition-colors overflow-hidden"
                              >
                                <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1 overflow-hidden">
                                  <div className="flex-shrink-0">
                                    {attachment.content_type.startsWith("image/") ? (
                                      <ImageIcon className="h-4 w-4 text-blue-500" />
                                    ) : (
                                      <FileText className="h-4 w-4 text-gray-500" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1 overflow-hidden">
                                    <a
                                      href={attachment.file_path}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block truncate text-xs font-medium text-gray-900 hover:text-blue-600 hover:underline"
                                    >
                                      {attachment.file_name}
                                    </a>
                                    <p className="truncate text-xs text-gray-500 mt-1">
                                      {attachment.file_size} • {formatDate(attachment.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {(
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        downloadAttachment.mutate(attachment.id);
                                      }}
                                      disabled={downloadingFiles.has(attachment.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      {downloadingFiles.has(attachment.id) ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Download className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                  {(
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        deleteAttachment.mutate(attachment.id);
                                      }}
                                      disabled={deletingFiles.has(attachment.id)}
                                      className="h-6 w-6 p-0 hover:text-red-500"
                                    >
                                      {deletingFiles.has(attachment.id) ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center p-4 lg:p-8 border-2 border-dashed rounded-lg bg-gray-50/50">
                            <Paperclip className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs lg:text-sm text-gray-500">No attachments found</p>
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                </div>
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