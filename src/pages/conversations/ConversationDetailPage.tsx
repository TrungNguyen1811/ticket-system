import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  Info,
  Clock,
  FileText,
  MessageSquare,
  Paperclip,
  Loader2,
  Send,
  X,
  Download,
  Search,
  ImageIcon,
  TimerIcon,
  RefreshCw,
  Menu,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import attachmentService from "@/services/attachment.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Response, DataResponse } from "@/types/reponse";
import { userService } from "@/services/user.service";
import { useToast } from "@/components/ui/use-toast";
import type { User, User as UserType } from "@/types/user";
import ChangeStatus from "@/components/ticket/ChangeStatus";
import { Attachment, Status, Ticket } from "@/types/ticket";
import AssigneeUser from "@/components/ticket/AssigneeUser";
import { cn, formatDate } from "@/lib/utils";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import ToolbarPlugin from "@/components/editor/ToolbarPlugin";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OnChangePlugin } from "@/components/comment/AddCommentDialog";
import { ReadOnlyEditor } from "@/components/comment/ReadOnlyEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { ClearEditorPlugin } from "@/components/editor/ClearEditorPlugin";
import { mailService } from "@/services/mail.service";
import { Mail, MailFormData } from "@/types/mail";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useTicket } from "@/hooks/ticket/useTicket";
import { useMailTicket } from "@/hooks/mail/useMailTicket";
import { AttachmentsPanel } from "@/components/attachments/AttachmentsPanel";
import { ClientCard } from "../tickets/ticket-detail/ClientCard";
import { FilePreviewModal } from "@/components/attachments/FilePreviewModal";
import { UploadAttachmentDialog } from "@/dialogs/UploadAttachmentDialog";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";



// Editor configuration
const initialConfig = {
  namespace: "ConversationEditor",
  onError: (error: Error) => {
    console.error(error);
  },
  theme: {
    paragraph: "mb-1",
    text: {
      base: "text-sm",
      bold: "font-semibold",
      italic: "italic",
      underline: "underline",
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
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [editorContent, setEditorContent] = useState<{
    raw: string;
    html: string;
    text: string;
  }>({
    raw: "",
    html: "",
    text: "",
  });
  const [shouldClearEditor, setShouldClearEditor] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(
    new Set(),
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [previewFiles, setPreviewFiles] = useState<Attachment[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [optimisticObjectUrls, setOptimisticObjectUrls] = useState<Set<string>>(new Set());

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data fetching
  const {
    data: attachmentsData,
    isLoading: isLoadingAttachments,
    isError: isErrorAttachments,
  } = useQuery<Response<Attachment[]>>({
    queryKey: ["ticket-attachments", id],
    queryFn: () => attachmentService.getAttachments(id || ""),
  });

  const {
    ticket: ticketData,
  } = useTicket({ ticketId: id || "" });

  const {
    mails: mailsData,
    isLoading: isLoadingMails,
    hasNewMails: hasNewMailNotification,
    setHasNewMails: setNewMailNotification,
  } = useMailTicket({ ticketId: id || "" });

  // Mutations
  const downloadAttachment = useMutation({
    mutationFn: (attachmentId: string) =>
      attachmentService.downloadAttachment(attachmentId),
    onMutate: (attachmentId) => {
      setDownloadingFiles((prev) => new Set(prev).add(attachmentId));
    },
    onSuccess: (data, attachmentId) => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setDownloadingFiles((prev) => {
        const next = new Set(prev);
        next.delete(attachmentId);
        return next;
      });
    },
    onError: (_, attachmentId) => {
      setDownloadingFiles((prev) => {
        const next = new Set(prev);
        next.delete(attachmentId);
        return next;
      });
      toast({
        title: "Error",
        description: "Failed to download attachment",
        variant: "destructive",
      });
    },
  });

  // Effects
  useEffect(() => {
    if (ticketData?.staff?.id) {
      setSelectedStaff(ticketData.staff);
    }
  }, [ticketData]);

  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [shouldAutoScroll, mailsData]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all tracked object URLs to prevent memory leaks
      optimisticObjectUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [optimisticObjectUrls]);

  // Cleanup optimistic object URLs when mails data updates (optimistic updates replaced)
  useEffect(() => {
    if (mailsData && mailsData.length > 0) {
      // Check if there are any optimistic mails that have been replaced
      const hasOptimisticMails = mailsData.some(mail => mail.id.startsWith('temp-'));
      if (!hasOptimisticMails && optimisticObjectUrls.size > 0) {
        // All optimistic mails have been replaced, cleanup object URLs
        optimisticObjectUrls.forEach(url => {
          URL.revokeObjectURL(url);
        });
        setOptimisticObjectUrls(new Set());
      }
    }
  }, [mailsData, optimisticObjectUrls]);

  // Handlers
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShouldAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  }, []);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    const container = containerRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    if (!isLoadingMails && mailsData?.length > 0) {
      scrollToBottom();
    }
  }, [isLoadingMails, mailsData]);


  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const newFiles = Array.from(e.target.files);
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [],
  );

  const handleReloadPublicChat = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["ticket-mails", id] });
    setNewMailNotification(false);
    toast({
      title: "Chat refreshed",
      description: "Public chat has been updated",
    });
  }, [queryClient, id, toast, setNewMailNotification]);


  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔄 handleSubmit called", {
      selectedFilesLength: selectedFiles.length,
    });

    if (!editorContent.raw.trim() && selectedFiles.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a message or attach files.",
        variant: "destructive",
      });
      return;
    }

    if (!id) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("body", editorContent.text);

      selectedFiles.forEach((file) => {
        formData.append("attachments[]", file);
      });

      const mail = await mailService.createMail(id, formData as MailFormData);
      if (mail.success) {
        // Create object URLs for images and track them
        const objectUrls: string[] = [];
        const optimisticAttachments = selectedFiles.map((file, index) => {
          const tempId = `temp-${Date.now()}-${index}`;
          const isImage = isImageFileByName(file.name);
          let objectUrl = "";
          
          if (isImage) {
            objectUrl = URL.createObjectURL(file);
            objectUrls.push(objectUrl);
          }
          
          return {
            id: tempId,
            file_name: file.name,
            file_path: objectUrl,
            file_type: file.type,
            file_size: file.size,
            file_extension: file.name.split(".").pop() || "",
            content_type: file.type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ticket_id: id,
            comment_id: "",
            email_id: "",
          };
        });

        // Optimistic update for mail
        const optimisticMail: Mail = {
          id: `temp-${Date.now()}`,
          from_name: user?.name || "",
          from_email: "phamphanbang@gmail.com",
          subject: `Re: ${ticketData?.title || ""}`,
          body: editorContent.text,
          attachments: optimisticAttachments,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Track object URLs for cleanup
        setOptimisticObjectUrls(prev => new Set([...prev, ...objectUrls]));

        // Add optimistic mail to cache
        queryClient.setQueryData<Response<DataResponse<Mail[]>>>(
          ["ticket-mails", id],
          (oldData) => {
            if (!oldData?.data) return oldData;
            return {
              ...oldData,
              data: {
                ...oldData.data,
                data: [...oldData.data.data, optimisticMail],
              },
            };
          },
        );

        if (selectedFiles.length > 0) {
          queryClient.invalidateQueries({ queryKey: ["ticket-attachments", id] });
        }
      }

      setEditorContent({ raw: "", html: "", text: "" });
      setSelectedFiles([]);
      setShouldClearEditor(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  function handlePreviewFile(attachment: Attachment, scope: Attachment[]) {
    const index = scope.findIndex((f) => f.id === attachment.id);
    if (index !== -1) {
      setPreviewFiles(scope);
      setPreviewIndex(index);
      setIsPreviewOpen(true);
    }
  }

  const isImageFile = (ext: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    return imageExtensions.includes(ext.toLowerCase());
  };
  const isImageFileByName = (name: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    return imageExtensions.includes(name.toLowerCase().split('.').pop() || '');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-[89vh] bg-[#f8fafc] ticket-detail-container">
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Left Sidebar */}


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
                    <Link
                      to={`/tickets/${id}`}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      <h1 className="text-base font-medium text-gray-900">
                        {ticketData?.title || ""}
                      </h1>
                    </Link>
                  </div>
                  {/* <div className="flex items-center gap-2">
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
                  </div> */}
                </div>
                {/* <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <span>#{id}</span>
                </div> */}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex flex-col">
            <div className="flex-1 flex flex-col relative">
              <div className="flex-1 overflow-auto">
                <div className="flex flex-col h-[84vh]">
                  {/* Public Chat Header with Reload Button */}
                  {hasNewMailNotification && (
                    <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-700">
                            New messages available
                          </span>
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
                  )}

                  <ScrollArea
                    ref={containerRef}
                    className="h-[calc(100vh-400px)] px-4 lg:px-6"
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
                          const isOwnMessage =
                            m.from_email === "phamphanbang@gmail.com";
                          return (
                            <div
                              key={m.id}
                              className={cn(
                                "flex gap-3 group",
                                isOwnMessage ? "flex-row-reverse" : "flex-row",
                              )}
                            >
                              <UserAvatar name={m.from_name} size="sm" />
                              <div
                                className={cn(
                                  "flex-1 min-w-0",
                                  isOwnMessage ? "items-end" : "items-start",
                                )}
                              >
                                <div
                                  className={cn(
                                    "flex items-center gap-2 mb-1",
                                    isOwnMessage
                                      ? "flex-row-reverse"
                                      : "flex-row",
                                  )}
                                >
                                  <span className="text-sm font-medium text-gray-900">
                                    {m.from_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(m.created_at)}
                                  </span>
                                </div>
                                <div
                                  className={cn(
                                    "flex",
                                    isOwnMessage
                                      ? "flex-row-reverse"
                                      : "flex-row",
                                  )}
                                >
                                  <div className={cn(
                                            "flex flex-col gap-2 w-full",
                                            isOwnMessage ? "items-end" : "items-start"
                                          )}>
                                  <div
                                    className={cn(
                                      "break-words text-sm whitespace-pre-wrap rounded-lg p-3 border",
                                      "max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]",
                                      isOwnMessage
                                        ? "bg-blue-300 border-blue-100 text-blue-900"
                                        : "bg-gray-300 border-gray-100 text-gray-900",
                                    )}
                                  >
                                    {/* <div dangerouslySetInnerHTML={{ __html: m.body }}/> */}
                                    <div
                                      className={cn(
                                        isOwnMessage
                                          ? "flex flex-row-reverse"
                                          : "",
                                      )}
                                    >
                                      <ReadOnlyEditor content={m.body} />
                                    </div>
                                    
                                      </div>
                                      {m.attachments &&
                                      m.attachments.length > 0 && (
                                        <div
                                          className={cn(
                                            "flex flex-col gap-1",
                                            isOwnMessage ? "justify-end" : "justify-start"
                                          )}
                                        >
                                          {m.attachments.map((a, idx) => {
                                            const isImg = isImageFile(a.file_extension);
                                            const isOptimistic = a.id.startsWith('temp-');
                                            
                                            // Determine image source based on attachment type
                                            const imageSrc = isOptimistic 
                                              ? a.file_path // Use object URL for optimistic attachments
                                              : `${import.meta.env.VITE_API_URL}/attachments/${a.id}`; // Use API URL for server attachments
                                            
                                            return (
                                              <div
                                                key={a.id}
                                                className={cn(
                                                  "group relative flex flex-row items-end justify-start border rounded-lg bg-white shadow-sm overflow-hidden cursor-pointer transition hover:shadow-md ",
                                                  isImg ? "h-48 w-auto" : "h-14 w-auto"
                                                )}
                                                tabIndex={0}
                                                role="button"
                                                aria-label={`Preview attachment: ${a.file_name}`}
                                                onClick={() => handlePreviewFile(a, m.attachments)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter' || e.key === ' ') handlePreviewFile(a, m.attachments);
                                                }}
                                              >
                                                {isImg ? (
                                                  <img
                                                    src={imageSrc}
                                                    alt={a.file_name}
                                                    className="object-cover w-full h-full group-hover:opacity-80 transition"
                                                    onError={(e) => {
                                                      // Fallback for failed image loads
                                                      const target = e.target as HTMLImageElement;
                                                      target.style.display = 'none';
                                                      target.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                  />
                                                ) : (
                                                  <div className="flex items-center gap-3 w-full p-2 hover:bg-muted/50 rounded-lg transition-colors">
                                                    <FileText className="w-5 h-5 text-primary shrink-0" />
                                                    <div className="flex flex-col justify-center min-w-0">
                                                      <span className="text-sm font-medium text-foreground truncate">{a.file_name}</span>
                                                      <span className="text-xs text-muted-foreground">{formatFileSize(a.file_size)}</span>
                                                    </div>
                                                  </div>                                                
                                                )}
                                                <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  {!isOptimistic && (
                                                    <button
                                                      className="bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                                                      onClick={e => {
                                                        e.stopPropagation();
                                                        window.open(`${import.meta.env.VITE_API_URL}/attachments/${a.id}/download`, '_blank');
                                                      }}
                                                      tabIndex={-1}
                                                      aria-label={`Download ${a.file_name}`}
                                                    >
                                                      <Download className="w-4 h-4" />
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4 lg:p-8">
                          <MessageSquare className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400 mb-2" />
                          <p className="text-xs lg:text-sm text-gray-500">
                            No public messages yet
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Start the conversation with the client
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Reply Form */}
              <div className="border-t border-gray-200 p-3 lg:p-4 bg-white absolute bottom-0 left-0 right-0">
                <form onSubmit={handleSubmit} className="space-y-3">
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
                              Write a reply...
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
                      </div>
                    </LexicalComposer>
                  </div>

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
                      {selectedFiles.length > 0 && (
                      <div className="flex flex-wrap">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="inline-flex items-center gap-1.5 rounded text-xs text-gray-700 max-w-full relative">
                            {isImageFileByName(file.name) ? (
                              <div className="relative">
                                <img src={URL.createObjectURL(file)} alt={file.name} className="h-12 m-2 w-auto text-gray-500 flex-shrink-0 rounded-lg" />
                              </div>
                            ) : (
                              <div className="bg-gray-200 rounded-sm m-2 flex items-center px-2 gap-1.5 h-12 w-auto">
                                <Paperclip className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                <span className="truncate inline-block max-w-[150px] sm:max-w-[100px]">
                                  {file.name}
                                </span>
                              </div>
                            )}
                              <button
                                  type="button"
                                  className="text-gray-500 hover:text-gray-700 absolute top-0 right-0 bg-white rounded-full p-1 bg-gray-200  "
                                  onClick={() => handleRemoveFile(index)}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex-1" />
                      <Button
                        type="submit"
                        size="sm"
                        className="h-8 text-xs gap-1.5 w-full sm:w-auto"
                        disabled={
                          isSubmitting ||
                          (!editorContent.raw.trim() &&
                            selectedFiles.length === 0) ||
                          ticketData?.status === "complete" ||
                          ticketData?.status === "archived"
                        }
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="hidden sm:inline">Sending...</span>
                            <span className="sm:hidden">Send</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3 w-3" />
                            <span className="hidden sm:inline">Send</span>
                            <span className="sm:hidden">Send</span>
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
        <aside
          className={cn(
            "shrink-0 bg-white border-l border-gray-200 transition-all duration-300 attachments-section",
            showRightSidebar
              ? "w-[400px] lg:w-[460px] xl:w-[500px]"
              : "w-0 overflow-hidden",
          )}
        >
          <div className="">
             <ClientCard
                ticketId={id || ""}
                clientName={ticketData?.client_name || ""}
                clientEmail={ticketData?.client_email || ""}
              />

              {/* Attachments */}
              <div className="p-3 lg:p-4">
                <AttachmentsPanel
                  attachments={attachmentsData?.data || []}
                  isLoading={isLoadingAttachments}
                  isError={isErrorAttachments}
                  onDownload={downloadAttachment.mutate}
                  downloadingFiles={downloadingFiles}
                  onPreviewFile={handlePreviewFile}
                />
              </div>
          </div>
        </aside>

        {/* File Preview Modal */}
        <FilePreviewModal
          open={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewFiles([]);
            setPreviewIndex(0);
          }}
          files={previewFiles || []}
          initialIndex={previewIndex}     
          />

        {/* Upload Attachment Dialog */}
        <UploadAttachmentDialog
          open={false}
          onOpenChange={() => {}}
          ticketId={id || ""}
        />
      </div>
    </div>
  );
}
