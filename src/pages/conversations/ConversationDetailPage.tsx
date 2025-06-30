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
  Loader,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import attachmentService from "@/services/attachment.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Response, DataResponse } from "@/types/response";
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
import { ReadOnlyEditor } from "@/components/editor/ReadOnlyEditor";
import { useAuth } from "@/contexts/AuthContext";
import { ClearEditorPlugin } from "@/components/editor/ClearEditorPlugin";
import { mailService } from "@/services/mail.service";
import { Mail, MailFormData } from "@/types/mail";
import { useTicket } from "@/hooks/ticket/useTicket";
import { useMailTicket } from "@/hooks/mail/useMailTicket";
import { AttachmentsPanel } from "@/components/attachments/AttachmentsPanel";
import { ClientCard } from "../tickets/ticket-detail/ClientCard";
import { FilePreviewModal } from "@/components/attachments/FilePreviewModal";
import { UploadAttachmentDialog } from "@/components/attachments/UploadAttachmentDialog";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import configTheme from "@/components/theme/configTheme";
import ListMaxIndentLevelPlugin from "@/components/editor/ListMaxIndentLevelPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import PlaygroundAutoLinkPlugin from "@/components/editor/AutoLinkPlugin";
import { OnChangePlugin } from "@/components/editor/OnChangePlugin";
import { ParagraphNode } from "lexical";
import {TablePlugin} from '@lexical/react/LexicalTablePlugin';
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { convertLexicalToEmailHtml } from "@/utils/lexicalConverter";
import { 
  isImageFile, 
  isImageFileByName, 
  formatFileSize, 
  useScrollToBottom 
} from "@/hooks/conversation/useConversationUtils";
import { useOptimisticUpdates } from "@/hooks/conversation/useOptimisticUpdates";
import InlineImagePlugin, { INSERT_IMAGE_COMMAND } from "@/components/editor/InlineImagePlugin";
import { ImageNode } from "@/components/editor/InlineImageNodes";

const initialConfig = {
  namespace: "ConversationInputEditor",
  onError: (error: Error) => { console.error(error); },
  theme: configTheme,
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    AutoLinkNode,
    LinkNode,
    ParagraphNode,
    TableNode, TableCellNode, TableRowNode,
    ImageNode,
  ],
};

export function fixAttachmentImageSrc(html: string) {
  // Giả sử API_URL là biến môi trường hoặc hằng số
  const API_URL = import.meta.env.VITE_API_URL || "";
  // Thay thế src="attachments/xxx" thành src="API_URL/attachments/xxx"
  return html.replace(
    /src=["']attachments\/([^"']+)["']/g,
    `src="${API_URL}/attachments/$1"`,
  );
}

type AttachmentItem = {
  file: File;
  url: string; // objectURL
  isInline: boolean;
};

type InlineImageItem = {
  file: File;
  url: string; // objectURL
  uploadedUrl?: string; // URL public sau khi upload
  attachmentId?: string; // id trả về từ API
};

function AttachmentItem({ attachment, isOptimistic, onPreview, isImg }: {
  attachment: any,
  isOptimistic: boolean,
  onPreview: () => void,
  isImg: boolean
}) {
  const [imgError, setImgError] = useState(false);

  if (isImg && imgError) return null;

  const imageSrc = isOptimistic
    ? attachment.file_path
    : `${import.meta.env.VITE_API_URL}/attachments/${attachment.id}`;

  return (
    <div
      key={attachment.id}
      className={cn(
        "relative flex flex-row items-end justify-start border rounded-lg bg-white shadow-sm overflow-hidden cursor-pointer transition hover:shadow-md",
        isImg ? "h-48 w-fit" : "h-14 w-fit",
      )}
      tabIndex={0}
      role="button"
      aria-label={`Preview attachment: ${attachment.file_name}`}
      onClick={onPreview}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onPreview();
      }}
    >
      {isImg ? (
        <div className="relative group w-full h-full">
          <img
            src={imageSrc}
            alt={attachment.file_name}
            className="object-cover w-full h-full group-hover:opacity-80 transition"
            onError={() => setImgError(true)}
          />
          <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isOptimistic && (
              <button
                className="bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    `${import.meta.env.VITE_API_URL}/attachments/${attachment.id}/download`,
                    "_blank",
                  );
                }}
                tabIndex={-1}
                aria-label={`Download ${attachment.file_name}`}
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative group">
          <div className="flex items-center gap-3 p-2 rounded-lg transition-colors group-hover:bg-muted/50">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-sm font-normal text-foreground truncate">
                {attachment.file_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(attachment.file_size)}
              </span>
            </div>
          </div>
          <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isOptimistic && (
              <button
                className="bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    `${import.meta.env.VITE_API_URL}/attachments/${attachment.id}/download`,
                    "_blank",
                  );
                }}
                tabIndex={-1}
                aria-label={`Download ${attachment.file_name}`}
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConversationDetail() {
  // Router and context hooks
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // State management
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
  
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(
    new Set(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [previewFiles, setPreviewFiles] = useState<Attachment[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Mail[]>([]);
  const [isReloading, setIsReloading] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [inlineImages, setInlineImages] = useState<InlineImageItem[]>([]);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom hooks
  const { scrollToBottomWithDelay, scrollToBottomImmediate } = useScrollToBottom(scrollRef);
  
  const { 
    optimisticObjectUrls, 
    createOptimisticMail, 
    cleanupOptimisticUrls 
  } = useOptimisticUpdates();

  // Data fetching
  const {
    data: attachmentsData,
    isLoading: isLoadingAttachments,
    isError: isErrorAttachments,
  } = useQuery<Response<Attachment[]>>({
    queryKey: ["ticket-attachments", id],
    queryFn: () => attachmentService.getAttachments(id || ""),
  });

  const { ticket: ticketData } = useTicket({ ticketId: id || "" });

  const {
    mails: mailsData,
    isLoading: isLoadingMails,
    hasNewMails: hasNewMailNotification,
    setHasNewMails: setNewMailNotification,
  } = useMailTicket({ ticketId: id || "", limit: 20, cursor: undefined });

  // Mutations
  const downloadAttachment = useMutation({
    mutationFn: (attachmentId: string) =>
      attachmentService.downloadAttachment(attachmentId),
    onMutate: (attachmentId: any) => {
      setDownloadingFiles((prev) => new Set(prev).add(attachmentId));
    },
    onSuccess: (data: any, attachmentId:any) => {
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
    onError: (_, attachmentId: any) => {
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

  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [shouldAutoScroll, mailsData]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all tracked object URLs to prevent memory leaks
      optimisticObjectUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [optimisticObjectUrls]);

  // Cleanup optimistic object URLs when mails data updates (optimistic updates replaced)
  useEffect(() => {
    cleanupOptimisticUrls(mailsData || []);
  }, [mailsData, cleanupOptimisticUrls]);

  // Initialize messages from mailsData
  useEffect(() => {
    if (mailsData) {
      setMessages(prev => {
        // Lấy các optimistic messages chưa được thay thế
        const optimistic = prev.filter(
          m => m.id.startsWith("temp-") &&
            !mailsData.some(real =>
              real.body === m.body &&
              Math.abs(new Date(real.created_at).getTime() - new Date(m.created_at).getTime()) < 60000
            )
        );
        // Gộp mailsData (real) với optimistic còn lại
        return [...mailsData, ...optimistic];
      });
      setOldestMessageId(mailsData[0]?.id || null);
      setHasMoreMessages(mailsData.length >= 20);
      scrollToBottomWithDelay(100);
    }
  }, [mailsData, scrollToBottomWithDelay]);

  // Infinite scroll: fetch older messages
  const fetchOlderMessages = useCallback(async () => {
    if (!id || isFetching || !hasMoreMessages || !oldestMessageId) return;

    console.log("🔄 Attempting to fetch older messages:", {
      id,
      isFetching,
      hasMoreMessages,
      oldestMessageId,
      currentMessagesCount: messages.length,
    });

    setIsFetching(true);

    const container = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLDivElement | null;
    const prevHeight = container?.scrollHeight ?? 0;

    try {
      const res = await mailService.getMails(id, {
        cursor: oldestMessageId,
        limit: 20,
      });
      const older = res.data.data;
      console.log("📨 Fetched older messages:", {
        cursor: oldestMessageId,
        resultCount: older.length,
        result: older.map((m) => ({
          id: m.id,
          from: m.from_email,
          created: m.created_at,
        })),
      });

      if (older.length === 0) {
        console.log(
          "✅ No more messages to load, setting hasMoreMessages to false",
        );
        setHasMoreMessages(false);
      } else {
        // Check for duplicates before adding
        const existingIds = new Set(messages.map((m) => m.id));
        const newMessages = older.filter((m) => !existingIds.has(m.id));

        if (newMessages.length > 0) {
          console.log("➕ Adding new messages:", newMessages.length);
          setMessages((prev) => [...newMessages, ...prev]);
          setOldestMessageId(newMessages[newMessages.length - 1]?.id);

          // Maintain scroll position
          setTimeout(() => {
            if (container) {
              const newHeight = container.scrollHeight;
              container.scrollTop = newHeight - prevHeight;
            }
          }, 0);
        } else {
          console.log(
            "⚠️ All fetched messages are duplicates, setting hasMoreMessages to false",
          );
          setHasMoreMessages(false);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching older messages:", error);
      // On error, don't set hasMoreMessages to false immediately
      // Let user retry by scrolling again
    } finally {
      setIsFetching(false);
    }
  }, [id, isFetching, hasMoreMessages, oldestMessageId, messages]);

  // Attach scroll event to ScrollArea viewport
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport) return;

    const handle = (e: Event) => {
      const target = e.target as HTMLDivElement;
      if (target.scrollTop < 100 && !isFetching && hasMoreMessages) {
        fetchOlderMessages();
      }
    };

    viewport.addEventListener("scroll", handle);
    return () => viewport.removeEventListener("scroll", handle);
  }, [isFetching, hasMoreMessages, fetchOlderMessages]);

  // Real-time: append new mail to messages
  useEffect(() => {
    // This effect is for real-time updates (see useMailTicket/useMailRealtime)
    // If mailsData has a new message at the end, append it
    if (mailsData && messages.length > 0) {
      const lastLocal = messages[messages.length - 1];
      const lastRemote = mailsData[mailsData.length - 1];
      if (lastRemote && lastRemote.id !== lastLocal.id) {
        setMessages((prev) => [...prev, lastRemote]);
        // Optionally scroll to bottom if user is at the bottom
        const container = scrollRef.current?.querySelector(
          "[data-radix-scroll-area-viewport]",
        ) as HTMLDivElement | null;
        if (
          container &&
          container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
            100
        ) {
          setTimeout(() => {
            container.scrollTop = container.scrollHeight;
          }, 0);
        }
      }
    }
  }, [mailsData]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoadingMails && messages.length > 0) {
      const container = scrollRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLDivElement | null;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [isLoadingMails, messages.length]);

  // Auto scroll when new messages arrive from realtime
  useEffect(() => {
    if (mailsData && mailsData.length > 0 && messages.length > 0) {
      // Check if there's a new message at the end
      const lastLocalMessage = messages[messages.length - 1];
      const lastRemoteMessage = mailsData[mailsData.length - 1];
      
      if (lastRemoteMessage && lastRemoteMessage.id !== lastLocalMessage.id) {
        // New message arrived, scroll to bottom
        scrollToBottomWithDelay(100);
      }
    }
  }, [mailsData, messages, scrollToBottomWithDelay]);

  // Handlers
  const handleReloadPublicChat = useCallback(async () => {
    setIsReloading(true);
    try {
      // Reset states first
      setMessages([]);
      setHasMoreMessages(true);
      setOldestMessageId(null);
      setIsFetching(false);
      setNewMailNotification(false);
      
      // Invalidate queries to fetch fresh data
      await queryClient.invalidateQueries({ 
        queryKey: ["ticket-mails", id],
        exact: false 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ["ticket-attachments", id],
      });
      
      toast({
        title: "Chat refreshed",
        description: "Public chat has been updated",
      });
    } finally {
      setIsReloading(false);
    }
  }, [queryClient, id, toast, setNewMailNotification]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorContent.raw.trim() && inlineImages.length === 0) {
      toast({ title: "Validation Error", description: "Please enter a message or attach files.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    // 1. Tạo optimistic mail và cập nhật UI ngay
    const optimisticMail = createOptimisticMail(
      user,
      ticketData,
      editorContent.html,
      [
        ...inlineImages.map(img => img.file),
        ...attachments.filter(att => !att.isInline).map(att => att.file)
      ]
    );
    setMessages(prev => [...prev, optimisticMail]);

    try {
      // 2. Upload tất cả file inlineImages
      const uploadResults = await Promise.all(
        inlineImages.map(async ({ file }) => {
          const formData = new FormData();
          formData.append('attachments[]', file);
          formData.append('file_status', "temporary");
          const res = await attachmentService.uploadAttachment(id!, formData);
          return {
            uploadedUrl: `${import.meta.env.VITE_API_URL}/attachments/${res.data[0].id}`,
            attachmentId: res.data[0].id
          };
        })
      );
      // 2. Mapping objectURL <-> uploadedUrl, attachmentId
      const urlMap: Record<string, string> = {};
      const attachmentIds: string[] = [];
      inlineImages.forEach((img, idx) => {
        urlMap[img.url] = uploadResults[idx].uploadedUrl;
        attachmentIds.push(uploadResults[idx].attachmentId);
      });
      // 3. Replace src trong HTML
      let html = editorContent.html;
      Object.entries(urlMap).forEach(([objectUrl, uploadedUrl]) => {
        html = html.replace(new RegExp(`src=["']${objectUrl}["']`, 'g'), `src="${uploadedUrl}"`);
      });
      const formData = new FormData();
      formData.append("content", html);

      attachmentIds.forEach(id => {
        formData.append("attachment_ids[]", id);
      });

      attachments.forEach(att => {
        if (!att.isInline) {
          formData.append("attachments[]", att.file);
        }
      });

      await mailService.createMail(id!, formData as MailFormData);
      // 5. Reset state
      inlineImages.forEach(img => {
        URL.revokeObjectURL(img.url);
      });
      setInlineImages([]);
      setAttachments([]);
      setEditorContent({ raw: "", html: "", text: "" });
      setShouldClearEditor(true);
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
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

  // Handle optimistic updates when mailsData changes
  useEffect(() => {
    if (mailsData && messages.length > 0) {
      // Check if there are any optimistic messages that should be replaced
      const hasOptimisticMessages = messages.some((m) =>
        m.id.startsWith("temp-"),
      );

      if (hasOptimisticMessages) {
        setMessages((prev) => {
          // Remove optimistic messages that have been replaced by real ones
          const filteredOptimistic = prev.filter(
            (msg) =>
              !msg.id.startsWith("temp-") ||
              !mailsData.some(
                (m: any) =>
                  m.body === msg.body &&
                  Math.abs(
                    new Date(m.created_at).getTime() -
                      new Date(msg.created_at).getTime(),
                  ) < 60000,
              ),
          );

          // Combine real messages with remaining optimistic ones
          const newMessages = [
            ...mailsData,
            ...filteredOptimistic.filter((m) => m.id.startsWith("temp-")),
          ];

          // Auto scroll to bottom if we have new messages
          scrollToBottomWithDelay(100);

          return newMessages;
        });
      }
    }
  }, [mailsData, messages.length]);

  function Placeholder() {
    return <div className="editor-placeholder">Send to your client...</div>;
  }

  // Add inline image
  const handleAddInlineImages = (editor: any, files: FileList) => {
    const newItems: InlineImageItem[] = [];
    Array.from(files).forEach(file => {
      if (!inlineImages.some(img => img.file.name === file.name && img.file.size === file.size)) {
        const url = URL.createObjectURL(file);
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, url);
        newItems.push({ file, url });
      }
    });
    if (newItems.length) setInlineImages(prev => [...prev, ...newItems]);
  };

  // Add attachment file
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newItems: AttachmentItem[] = [];
      Array.from(e.target.files).forEach(file => {
        if (!attachments.some(a => a.file.name === file.name && a.file.size === file.size)) {
          const url = URL.createObjectURL(file);
          newItems.push({ file, url, isInline: false });
        }
      });
      if (newItems.length) setAttachments(prev => [...prev, ...newItems]);
    }
  }, [attachments]);

  // Remove attachment
  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleRemoveInlineImage = (editor: any, url: string) => {
    setInlineImages(prev => prev.filter(img => img.url !== url));
    editor.update(() => {
      const imgs = document.querySelectorAll(`img[src="${url}"]`);
      imgs.forEach(img => img.remove());
    });
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
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex flex-col">
            <div className="flex-1 flex flex-col relative">
              {hasNewMailNotification && (
                <div className="w-full px-6 py-3 bg-blue-50 border-b border-blue-200 z-50 absolute">
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

              <div className="flex-1 overflow-auto">
                <div className="flex flex-col h-[84vh]">
                  <ScrollArea
                    ref={scrollRef}
                    className="h-[calc(100vh-400px)] px-4 lg:px-6 overflow-x-hidden"
                  >
                    <div className="space-y-4 py-6 w-full min-w-0">
                      {isFetching && (
                        <div className="flex justify-center py-2">
                          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      {isLoadingMails || isReloading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4 lg:p-8 animate-pulse">
                          <div className="w-6 h-6 mb-2 rounded-full bg-muted" />
                          <Loader2 className="animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            Loading messages...
                          </span>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4 lg:p-8">
                          <span className="text-xs lg:text-sm text-gray-500">
                            No public messages yet
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            Start the conversation with the client
                          </span>
                        </div>
                      ) : (
                        messages.map((m) => {
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
                              <UserAvatar
                                name={isOwnMessage ? m.from_name : m.from_email}
                                size="sm"
                              />
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
                                    {isOwnMessage ? m.from_name : m.from_email}
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
                                  <div
                                    className={cn(
                                      "flex flex-col gap-2 w-full",
                                      isOwnMessage
                                        ? "items-end"
                                        : "items-start",
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "break-words text-sm whitespace-pre-wrap rounded-lg p-3 border",
                                        "max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]",
                                        isOwnMessage
                                          ? "bg-blue-300 border-blue-100 text-blue-900"
                                          : "bg-gray-300 border-gray-100 text-gray-900",
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          isOwnMessage
                                            ? "flex flex-row-reverse"
                                            : "",
                                          "break-words whitespace-pre-wrap w-full overflow-hidden",
                                        )}
                                      >
                                        <ReadOnlyEditor content={m.body} />
                                      </div>
                                    </div>
                                    {m.attachments && m.attachments.length > 0 && (
                                      <div className={cn(
                                        "flex flex-col gap-1",
                                        isOwnMessage ? "items-end" : "items-start",
                                      )}>
                                        {m.attachments.map((a, idx) => {
                                          const isImg = isImageFile(a.file_extension);
                                          const isOptimistic = a.id.startsWith("temp-");
                                          return (
                                            <AttachmentItem
                                              key={a.id}
                                              attachment={a}
                                              isOptimistic={isOptimistic}
                                              isImg={isImg}
                                              onPreview={() => handlePreviewFile(a, m.attachments)}
                                            />
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
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Reply Form */}
              <div className="border-t border-gray-200 p-3 lg:p-4 bg-white absolute bottom-0 left-0 right-0">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    <LexicalComposer initialConfig={initialConfig}>
                      <div className="relative">
                        <div className="toolbar">
                          {id &&       
                          < ToolbarPlugin ticketId={id} onAddInlineImage={(editor, files) => handleAddInlineImages(editor, files)} />
                        }                        
                        </div>
                        <div className="editor-scroll-container">
                          <RichTextPlugin
                            contentEditable={
                              <ContentEditable className="lexical-content-editable" />
                            }
                            placeholder={Placeholder}
                            ErrorBoundary={LexicalErrorBoundary}
                          />
                        </div>
                        <ListPlugin />
                        <LinkPlugin />
                        <PlaygroundAutoLinkPlugin />
                        <ListMaxIndentLevelPlugin maxDepth={7} />
                        <HistoryPlugin />
                        <AutoFocusPlugin />
                        <TablePlugin />
                        <OnChangePlugin onChange={setEditorContent} />
                        <InlineImagePlugin />
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
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap">
                        {attachments.map((att, index) => (
                          <div key={index} className="inline-flex items-center gap-1.5 rounded text-xs text-gray-700 max-w-full relative">
                            {isImageFileByName(att.file.name) ? (
                              <img src={att.url} alt={att.file.name} className="h-12 m-2 w-auto text-gray-500 flex-shrink-0 rounded-lg" />
                            ) : (
                              <div className="bg-gray-200 rounded-sm m-2 flex items-center px-2 gap-1.5 h-12 w-auto">
                                <span className="truncate inline-block max-w-[150px] sm:max-w-[100px]">{att.file.name}</span>
                              </div>
                            )}
                            <button
                              type="button"
                              className="text-gray-500 hover:text-gray-700 absolute top-0 right-0 bg-white rounded-full p-1 bg-gray-200"
                              onClick={() => handleRemoveAttachment(index)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {att.isInline && <span className="text-[10px] text-blue-500 ml-1">inline</span>}
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
                          attachments.length === 0) ||
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
              ? "w-[30vw] border"
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
