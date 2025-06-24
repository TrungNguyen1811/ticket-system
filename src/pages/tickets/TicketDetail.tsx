"use client";

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { TicketStatusDisplay } from "@/components/shared/StatusBadge";
import { UploadAttachmentDialog } from "@/dialogs/UploadAttachmentDialog";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  MessageSquare,
  Loader2,
  Clock,
  Calendar as CalendarIcon,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DataResponse, Response } from "@/types/reponse";
import { Attachment, Status, Ticket } from "@/types/ticket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import attachmentService from "@/services/attachment.service";
import { AuditLogTable } from "@/components/ticket/AuditLogTable";
import { STATUS_OPTIONS } from "@/lib/constants";
import { User } from "@/types/user";
import { userService } from "@/services/user.service";
import { useTicket } from "@/hooks/ticket/useTicket";
import { useTicketLogs } from "@/hooks/ticket/useTicketLogs";
import { AttachmentsPanel } from "@/components/attachments/AttachmentsPanel";
import { FilePreviewModal } from "@/components/attachments/FilePreviewModal";

// ===== COMPONENTS =====

// 1. TicketHeaderSection Component
interface TicketHeaderSectionProps {
  ticket: Ticket;
  isEditingTitle: boolean;
  editedTitle: string;
  savingTitle: boolean;
  onTitleChange: (value: string) => void;
  onTitleBlur: () => void;
  onTitleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onEditTitle: () => void;
}

const TicketHeaderSection: React.FC<TicketHeaderSectionProps> = ({
  ticket,
  isEditingTitle,
  editedTitle,
  savingTitle,
  onTitleChange,
  onTitleBlur,
  onTitleKeyDown,
  onEditTitle,
}) => {
  const isReadOnly = ticket.status === "complete" || ticket.status === "archived";

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditingTitle ? (
                <Input
                  value={editedTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="text-lg font-semibold focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none"
                  maxLength={200}
                  autoFocus
                  onBlur={onTitleBlur}
                  onKeyDown={onTitleKeyDown}
                />
              ) : (
                <h1
                  className="text-lg font-semibold text-foreground cursor-pointer hover:underline transition-colors"
                  onClick={() => !isReadOnly && onEditTitle()}
                  title={isReadOnly ? undefined : "Click to edit title"}
                >
                  {savingTitle ? (
                    <span className="text-sm text-muted-foreground">
                      Saving...
                    </span>
                  ) : (
                    ticket.title
                  )}
                </h1>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-x-6 gap-y-1">
            <div className="flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              Created {formatDate(ticket.created_at)}
            </div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Updated {formatDate(ticket.updated_at)}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

// 2. TicketInfoSection Component
interface TicketInfoSectionProps {
  ticket: Ticket;
  isEditingDescription: boolean;
  editedDescription: string;
  showFullDescription: boolean;
  onDescriptionChange: (value: string) => void;
  onSaveDescription: () => void;
  onCancelDescription: () => void;
  onEditDescription: () => void;
  onToggleDescription: () => void;
  isDescriptionClamped: boolean;
  onStatusChange: (status: string) => void;
  onStaffAssign: (staffId: string) => void;
  usersData: any;
  isLoadingUsers: boolean;
  isErrorUsers: boolean;
  navigate: (path: string) => void;
}

const TicketInfoSection: React.FC<TicketInfoSectionProps> = ({
  ticket,
  isEditingDescription,
  editedDescription,
  showFullDescription,
  onDescriptionChange,
  onSaveDescription,
  onCancelDescription,
  onEditDescription,
  onToggleDescription,
  isDescriptionClamped,
  onStatusChange,
  onStaffAssign,
  usersData,
  isLoadingUsers,
  isErrorUsers,
  navigate,
}) => {
  const isReadOnly = ticket.status === "complete" || ticket.status === "archived";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Ticket Information</CardTitle>
      </CardHeader>
      <CardContent className="pt-3 space-y-6">
        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Description
          </label>
          {isEditingDescription ? (
            <div className="space-y-3">
              <Textarea
                value={editedDescription}
                onChange={(e) => onDescriptionChange(e.target.value)}
                className="min-h-[120px] max-h-[300px] resize-y text-sm"
                autoFocus
                maxLength={2000}
                disabled={isReadOnly}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={onSaveDescription}
                  disabled={!editedDescription.trim()}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelDescription}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div
                className={cn(
                  "text-sm text-foreground bg-muted/30 p-4 rounded-lg border cursor-pointer transition-all duration-200 break-words whitespace-pre-line",
                  !showFullDescription &&
                    isDescriptionClamped &&
                    "line-clamp-4",
                )}
                onClick={() => !isReadOnly && onEditDescription()}
                title={isReadOnly ? undefined : "Click to edit description"}
              >
                {editedDescription}
              </div>
              {isDescriptionClamped && (
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 text-primary text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleDescription();
                  }}
                >
                  {showFullDescription ? "Show less" : "Show more"}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Status and Staff Assignment */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Status */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </label>
            <Select
              value={ticket.status}
              onValueChange={onStatusChange}
              disabled={isReadOnly}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <TicketStatusDisplay status={status.value} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Staff Assignment */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Assigned To
            </label>
            <Select
              value={ticket.staff?.id || ""}
              onValueChange={onStaffAssign}
              disabled={isReadOnly || isLoadingUsers}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                {usersData?.data?.data?.map((user: User) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <UserAvatar name={user.name} size="sm" />
                      <span className="text-sm">{user.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 3. ClientCard Component
interface ClientCardProps {
  clientName: string;
  clientEmail: string;
  ticketId: string;
}

const ClientCard: React.FC<ClientCardProps> = ({ clientName, clientEmail, ticketId }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white">
      <div className="pt-0">
        <div className="flex flex-col items-center space-x-3 p-4 bg-muted/30 rounded-lg border">
            <UserAvatar name={clientName} size="2xl" />
            <div className="flex flex-col items-center p-2">
                <p className="text-sm font-medium text-foreground">
                    {clientName}
                </p>  
                <p className="text-xs text-muted-foreground">
                    {clientEmail}
                </p>
            </div>
            <div className="flex flex-col items-center justify-end mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/communication/conversation/${ticketId}`)}
                className="rounded-full bg-secondary-200 h-10 w-10"  
              >
                <MessageSquare className="h-6 w-6" />
              </Button>
              <p className="text-xs">
                Conversation
              </p>
            </div>
        </div>
      </div>
    </div>
  );
};



// ===== MAIN COMPONENT =====

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Hooks
  const { logs, isLoading: isLoadingTicketLogs } = useTicketLogs({
    ticketId: id || "",
  });

  const {
    ticket: ticketData,
    isLoading: isLoadingTicket,
    isError: isErrorTicket,
    handleUpdate,
    handleAssign,
    handleChangeStatus,
    markAsUpdated,
  } = useTicket({ ticketId: id || "" });

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
  } = useQuery<Response<DataResponse<User[]>>>({
    queryKey: ["users"],
    queryFn: () =>
      userService.getUsers({
        isPaginate: false,
        role: "user",
      }),
  });

  const {
    data: attachmentsData,
    isLoading: isLoadingAttachments,
    isError: isErrorAttachments,
  } = useQuery<Response<Attachment[]>>({
    queryKey: ["ticket-attachments", id],
    queryFn: () => attachmentService.getAttachments(id || ""),
  });

  // Download attachment
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
      toast({
        title: "Success",
        description: "Attachment downloaded successfully",
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

  // Auto-save title and description
  useEffect(() => {
    if (ticketData) {
      setEditedTitle(ticketData.title);
      setEditedDescription(ticketData.description);
    }
  }, [ticketData]);

  // Helper functions
  const isDescriptionClamped = (text: string, maxLines = 4) => {
    return text.split("\n").length > maxLines || text.length > 300;
  };

  const handleStatusChange = (status: string) => {
    if (!id) return;
    markAsUpdated(id);
    handleChangeStatus({
      status: status as Status,
      _method: "PUT",
    });
  };

  const handleStaffAssign = (staffId: string) => {
    if (!id) return;
    markAsUpdated(id);
    handleAssign({
      staff_id: staffId,
      _method: "PUT",
    });
  };

  const handleTitleBlur = async () => {
    if (!id || editedTitle.trim() === ticketData?.title) {
      setIsEditingTitle(false);
      return;
    }
    setSavingTitle(true);
    try {
      markAsUpdated(id);
      handleUpdate({
        title: editedTitle,
        _method: "PUT",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update title",
        variant: "destructive",
      });
      setEditedTitle(ticketData?.title || "");
    } finally {
      setSavingTitle(false);
      setIsEditingTitle(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setEditedTitle(ticketData?.title || "");
      setIsEditingTitle(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!id) return;
    try {
      markAsUpdated(id);
      handleUpdate({
        description: editedDescription,
        _method: "PUT",
      });
      setIsEditingDescription(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to update description",
        variant: "destructive",
      });
    }
  };

  const handlePreviewFile = (attachment: Attachment) => {
    setPreviewFile(attachment);
    setIsPreviewOpen(true);
  };

  const startIndex = attachmentsData?.data?.findIndex(
    (attachment) => attachment.id === previewFile?.id
  );

  // Loading states
  if (isLoadingTicket) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (isErrorTicket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Error Loading Ticket
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          There was an error loading the ticket details. Please try again later.
        </p>
        <Button asChild>
          <Link to="/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Ticket not found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The ticket you're looking for doesn't exist or has been deleted.
        </p>
        <Button asChild>
          <Link to="/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex-none border-b bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/tickets">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tickets
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Ticket Header */}
            <TicketHeaderSection
              ticket={ticketData}
              isEditingTitle={isEditingTitle}
              editedTitle={editedTitle}
              savingTitle={savingTitle}
              onTitleChange={setEditedTitle}
              onTitleBlur={handleTitleBlur}
              onTitleKeyDown={handleTitleKeyDown}
              onEditTitle={() => setIsEditingTitle(true)}
            />

            {/* Ticket Information */}
            <TicketInfoSection
              ticket={ticketData}
              isEditingDescription={isEditingDescription}
              editedDescription={editedDescription}
              showFullDescription={showFullDescription}
              onDescriptionChange={setEditedDescription}
              onSaveDescription={handleSaveDescription}
              onCancelDescription={() => {
                setIsEditingDescription(false);
                setEditedDescription(ticketData?.description || "");
              }}
              onEditDescription={() => setIsEditingDescription(true)}
              onToggleDescription={() => setShowFullDescription(!showFullDescription)}
              isDescriptionClamped={isDescriptionClamped(editedDescription)}
              onStatusChange={handleStatusChange}
              onStaffAssign={handleStaffAssign}
              usersData={usersData}
              isLoadingUsers={isLoadingUsers}
              isErrorUsers={isErrorUsers}
              navigate={navigate}
            />

            {/* Audit Logs */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Audit Logs</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {logs?.data?.data?.length || 0} logs
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingTicketLogs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="bg-muted/20 rounded-lg  border-0 overflow-hidden">
                    <AuditLogTable
                      ticketId={id || ""}
                      currentUserId={ticketData?.holder?.id || ""}
                      currentStatus={ticketData?.status || ""}
                      onStatusChange={() => {}} // Disabled - only edit in main section
                      onStaffChange={() => {}} // Disabled - only edit in main section
                      isTicketComplete={ticketData.status === "complete" || ticketData.status === "archived"}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            {/* Client Information */}
            <ClientCard
              ticketId={id || ""}
              clientName={ticketData.client_name}
              clientEmail={ticketData.client_email}
            />

            {/* Attachments */}
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
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        open={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewFile(null);
        }}
        files={attachmentsData?.data || []}
        initialIndex={startIndex !== undefined && startIndex >= 0 ? startIndex : 0}     
         />

      {/* Upload Attachment Dialog */}
      <UploadAttachmentDialog
        open={false}
        onOpenChange={() => {}}
        ticketId={id || ""}
      />
    </div>
  );
}
