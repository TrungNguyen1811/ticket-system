"use client";

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadAttachmentDialog } from "@/dialogs/UploadAttachmentDialog";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DataResponse, Response } from "@/types/reponse";
import { Attachment, Status } from "@/types/ticket";
import attachmentService from "@/services/attachment.service";
import { AuditLogTable } from "@/components/ticket/AuditLogTable";
import { User } from "@/types/user";
import { userService } from "@/services/user.service";
import { useTicket } from "@/hooks/ticket/useTicket";
import { useTicketLogs } from "@/hooks/ticket/useTicketLogs";
import { AttachmentsPanel } from "@/components/attachments/AttachmentsPanel";
import { FilePreviewModal } from "@/components/attachments/FilePreviewModal";
import { TicketHeaderSection } from "@/pages/tickets/ticket-detail/TicketHeaderSection";
import { ClientCard } from "./ticket-detail/ClientCard";
import { Separator } from "@/components/ui/separator";

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<Attachment[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

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

  const handleStaffAssign = async (staffId: string) => {
    if (!id) return;
    markAsUpdated(id);
    await handleAssign({
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


  function handlePreviewFile(attachment: Attachment, scope: Attachment[]) {
    const index = scope.findIndex((f) => f.id === attachment.id);
    if (index !== -1) {
      setPreviewFiles(scope);
      setPreviewIndex(index);
      setIsPreviewOpen(true);
    }
  }

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
    <div className="min-h-screen flex flex-col ">
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
              isEditingDescription={isEditingDescription}
              editedDescription={editedDescription}
              showFullDescription={showFullDescription}
              onDescriptionChange={setEditedDescription}
              onSaveDescription={handleSaveDescription}
              onCancelDescription={() => {
                setIsEditingDescription(false); 
              }}
              onEditDescription={() => setIsEditingDescription(true)}
              onToggleDescription={() => setShowFullDescription(!showFullDescription)}
              isDescriptionClamped={isDescriptionClamped(editedDescription)}
              onStatusChange={handleStatusChange}
              onStaffAssign={handleStaffAssign}
              usersData={usersData}
              isLoadingUsers={isLoadingUsers}
              isErrorUsers={isErrorUsers}
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
          <div className="lg:col-span-1 space-y-3 bg-white border rounded-lg hover:shadow-md transition-all duration-300">
            {/* Client Information */}
            <ClientCard
              ticketId={id || ""}
              clientName={ticketData.client_name}
              clientEmail={ticketData.client_email}
            />
            <Separator className="w-[95%] mx-auto" />
            {/* Attachments */}
            <div className="p-6 pt-0 h-[65vh]">
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
      </div>

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
  );
}
