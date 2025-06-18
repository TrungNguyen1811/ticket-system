"use client"

import { CommandEmpty } from "@/components/ui/command"

import { useState, useEffect, useCallback } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { formatDate, getStatusColor } from "@/lib/utils"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { getStatusIcon, StatusBadge } from "@/components/shared/StatusBadge"
import { AddCommentDialog } from "@/dialogs/AddCommentDialog"
import { UploadAttachmentDialog } from "@/dialogs/UploadAttachmentDialog"
import { AssignStaffDialog } from "@/dialogs/AssignStaffDialog"
import { ChangeStatusDialog } from "@/dialogs/ChangeStatusDialog" 
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  UserPlus,
  RefreshCw,
  MessageSquare,
  Paperclip,
  Save,
  X,
  Edit2,
  Tag,
  Search,
  FileText,
  ImageIcon,
  Download,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  Filter,
  File,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Trash,
  Check
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandList, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { DataResponse, Response } from "@/types/reponse"
import { Attachment, Status, Ticket, TicketAuditLog } from "@/types/ticket"
import { Comment, CommentFormData } from "@/types/comment"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"  
import { CommentList } from "@/components/editor/CommentList"
import attachmentService from "@/services/attachment.service"
import { logService } from "@/services/log.service"
import { AuditLogTable } from "@/components/editor/AuditLogTable"
import { STATUS_OPTIONS } from "@/lib/constants"
import { User } from "@/types/user"
import { userService } from "@/services/user.service"
import { useTicketMutations } from "@/hooks/useTicketMutations"
import { useTicketComments } from "@/hooks/useTicketComments"
import { useTicketLogs } from "@/hooks/useTicketLogs"
import { useTicket } from "@/hooks/useTicket"
import { useAuth } from "@/contexts/AuthContext"
import { SHOW_STATUS_OPTIONS } from "@/lib/constants"
import { AttachmentList } from "@/components/editor/AttachmentList"
import AssigneeUser from "@/components/AssigneeUser"
import ChangeStatus from "@/components/ChangeStatus"


function isDescriptionClamped(text: string, maxLines = 4) {
  return text.split("\n").length > maxLines || text.length > 300
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attachmentSearchTerm, setAttachmentSearchTerm] = useState("")
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isStaffOpen, setIsStaffOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<string>("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [savingTitle, setSavingTitle] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [pendingStaff, setPendingStaff] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmType, setConfirmType] = useState<"status" | "staff" | null>(null)
  const [isViewingLogs, setIsViewingLogs] = useState(false)
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set())
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set())

  const mutations = useTicketMutations()

  // Use custom hooks for comments and logs
  const { 
    comments,
    pagination: commentsPagination,
    isLoading: isLoadingComments,
    page: commentPage,
    perPage: commentPerPage,
    setPage: setCommentPage,
    setPerPage: setCommentPerPage
  } = useTicketComments({ ticketId: id || "" })

  const {
    logs,
    isLoading: isLoadingTicketLogs
  } = useTicketLogs({ ticketId: id || "" })

  const { ticket: ticketData, isLoading: isLoadingTicket, isError: isErrorTicket, handleUpdate, handleAssign, handleChangeStatus, markAsUpdated } = useTicket({ ticketId: id || "" })

  const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers } = useQuery<Response<DataResponse<User[]>>>({
    queryKey: ["users"],
    queryFn: () => userService.getUsers({
      isPaginate: false,
      role: "user",
    }),
  })

  const { data: attachmentsData, isLoading: isLoadingAttachments, isError: isErrorAttachments } = useQuery<Response<Attachment[]>>({
    queryKey: ["ticket-attachments", id],
    queryFn: () => attachmentService.getAttachments(id || ""),
  })

  // Download attachment
  const downloadAttachment = useMutation({
    mutationFn: (attachmentId: string) => attachmentService.downloadAttachment(attachmentId),
    onMutate: (attachmentId) => {
      setDownloadingFiles(prev => new Set(prev).add(attachmentId));
    },
    onSuccess: (data, attachmentId) => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = ''; // Let the browser determine the filename
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setDownloadingFiles(prev => {
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
  })

  // Delete attachment
  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: string) => attachmentService.deleteAttachment(attachmentId),
    onMutate: (attachmentId) => {
      setDeletingFiles(prev => new Set(prev).add(attachmentId));
    },
    onSuccess: (_, attachmentId) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-attachments", id] })

      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      })
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
      })
      setDeletingFiles(prev => {
        const next = new Set(prev);
        next.delete(attachmentId);
        return next;
      });
    }
  })

  // Auto-save title and description
  useEffect(() => {
    if (ticketData) {
      setEditedTitle(ticketData.title)
      setEditedDescription(ticketData.description)
    }
  }, [ticketData])

  // Update selectedStatus and selectedStaff when ticket data changes
  useEffect(() => {
      if (ticketData) {
        setSelectedStatus(ticketData.status);
        setSelectedStaff(ticketData.staff?.id || "");
      }
  }, [ticketData]);
  
  const handleStatusChange = (status: string) => {
    if (!id) return
    markAsUpdated(id);
    handleChangeStatus({
      status: status as "new" | "in_progress" | "pending" | "assigned" | "complete" | "archived",
      _method: "PUT"
    })
  }
  const handleStaffAssign = (staffId: string) => {
    if (!id) return
    markAsUpdated(id);

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
    })
  }
  const handleAddComment = async (data: { editorContent: { raw: string; html: string }; attachments?: File[] }) => {
    if (!id) return

    try {
      const formData = new FormData()
      formData.append("content", data.editorContent.raw)
  
      if (data.attachments?.length) {
        data.attachments.forEach((file) => {
          formData.append("attachments[]", file)
        })
      }
  
      await mutations.createComment.mutateAsync({ id, data: formData as CommentFormData })

      // // Invalidate both comments and attachments queries to update UI
      // queryClient.invalidateQueries({ queryKey: ["ticket-comments", id] })
      // if (data.attachments?.length) {
      //   queryClient.invalidateQueries({ queryKey: ["ticket-attachments", id] })
      // }

      toast({
        title: "Success",
        description: "Comment created successfully",
        action: commentPage !== 1 ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCommentPage(1)}
          >
            View Latest
          </Button>
        ) : undefined
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  }

  // Save handlers
  const handleSaveDescription = async () => {
    if (!id) return
    try {
      markAsUpdated(id);
      handleUpdate({
        description: editedDescription,
        _method: "PUT"
      })
      setIsEditingDescription(false)
    } catch {
      toast({ title: "Error", description: "Failed to update description", variant: "destructive" })
    }
  }
  const handleTitleBlur = async () => {
    if (!id || editedTitle.trim() === ticketData?.title) {
      setIsEditingTitle(false)
      return
    }
    setSavingTitle(true)
    try {
      markAsUpdated(id);
      handleUpdate({
        title: editedTitle,
        _method: "PUT"
      })
    } catch {
      toast({ title: "Error", description: "Failed to update title", variant: "destructive" })
      setEditedTitle(ticketData?.title || "")
    } finally {
      setSavingTitle(false)
      setIsEditingTitle(false)
    }
  }
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur()
    } else if (e.key === "Escape") {
      setEditedTitle(ticketData?.title || "")
      setIsEditingTitle(false)
    }
  }

  // Confirm status change
  const handleStatusSelect = (status: string) => {
    if (status === "complete" || status === "archived") {
      setPendingStatus(status)
      setConfirmType("status")
      setConfirmDialogOpen(true)
    } else {
      handleStatusChange(status)
    }
  }
  const handleStaffSelect = (staffId: string) => {
    handleStaffAssign(staffId)
  }

  // Confirm staff change
  const handleConfirmChange = () => {
    if (confirmType === "status" && pendingStatus) {
      handleStatusChange(pendingStatus)
    }
    setConfirmDialogOpen(false)
    setPendingStatus(null)
    setConfirmType(null)
  }
  const handleCancelChange = () => {
    // Reset selectedStatus to original value
    if (ticketData) {
      setSelectedStatus(ticketData.status);
    }
    setConfirmDialogOpen(false);
    setPendingStatus(null);
    setConfirmType(null);
  }

  // Optimistic status 
  const handleOptimisticStatusChange = (status: string) => {
    setSelectedStatus(status);
  };
  const handleOptimisticStaffChange = (staffId: string) => {
    setSelectedStaff(staffId);
  };

  // Loading ticket
  if (isLoadingTicket) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    )
  }

  if (isErrorTicket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Error Loading Ticket</h2>
        <p className="mt-2 text-gray-600">There was an error loading the ticket details. Please try again later.</p>
        <Button asChild className="mt-6">
          <Link to="/tickets">Back to Tickets</Link>
        </Button>
      </div>
    )
  }

  if (!ticketData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Ticket not found</h2>
        <p className="mt-2 text-gray-600">The ticket you're looking for doesn't exist or has been deleted.</p>
        <Button asChild className="mt-6">
          <Link to="/tickets">Back to Tickets</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Fixed height */}
      <div className="flex-none border-b">
        <div className="flex items-center justify-between">
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

      {/* Main Content - Scrollable */}
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Ticket Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="bg-gray-50 border-b pb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 ">
                      {isEditingTitle ? (
                        <Input
                          value={editedTitle}
                          onChange={e => setEditedTitle(e.target.value)}
                          className="text-xl font-bold focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none"
                          maxLength={200}
                          autoFocus
                          onBlur={handleTitleBlur}
                          onKeyDown={handleTitleKeyDown}
                          disabled={savingTitle}
                        />
                      ) : (
                        <h1
                          className="text-xl font-bold text-gray-900 cursor-pointer hover:underline"
                          onClick={() => setIsEditingTitle(true)}
                          title="Click to edit title"
                        >
                          {savingTitle ? <span className="text-sm text-gray-500">Đang lưu...</span> : ticketData.title}
                        </h1>
                      )}
                    </div>
                    
                  </div>
                  <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs font-normal">
                        #{ticketData.id}
                      </Badge>
                      <StatusBadge status={ticketData.status} />
                    </div>
                  <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-2">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Created {formatDate(ticketData.created_at)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Updated {formatDate(ticketData.updated_at)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 flex items-center">Description</h3>
                  {isEditingDescription ? (
                    <div>
                      <Textarea
                        value={editedDescription}
                        onChange={e => setEditedDescription(e.target.value)}
                        className="bg-gray-50 p-4 rounded-md border min-h-[100px] max-h-[300px] resize-y text-base"
                        autoFocus
                        maxLength={2000}
                        style={{ lineHeight: '1.6', fontFamily: 'inherit' }}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={handleSaveDescription} disabled={loading || !editedDescription.trim()}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setIsEditingDescription(false); setEditedDescription(ticketData?.description || "") }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 w-full">
                      <div
                        className={cn(
                          "text-gray-700 bg-gray-50 p-4 rounded-md border cursor-pointer transition-all duration-200 w-full break-words break-all whitespace-pre-line text-base",
                          !showFullDescription && isDescriptionClamped(editedDescription) && "line-clamp-4"
                        )}
                        onClick={() => setIsEditingDescription(true)}
                        title="Click to edit description"
                        style={{ minHeight: 48, wordBreak: 'break-word', overflowWrap: 'break-word' }}
                      >
                        {editedDescription}
                      </div>
                      {isDescriptionClamped(editedDescription) && (
                        <Button
                          variant="link"
                          size="sm"
                          className="self-start px-0 text-blue-500 mt-1"
                          onClick={e => { e.stopPropagation(); setShowFullDescription(v => !v) }}
                        >
                          {showFullDescription ? "Hide" : "Show more"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Client Information */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Client Information</h3>
                  <div className="bg-gray-50 p-4 rounded-md border flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <UserAvatar name={ticketData.client_name} />
                      <div>
                        <p className="font-medium text-gray-900">{ticketData.client_name}</p>
                        <p className="text-sm text-gray-500">{ticketData.client_email}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="ml-auto" onClick={() => navigate(`/communication/conversation/${ticketData.id}`)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                        View Conversation
                    </Button>
                  </div>
                </div>

                {/* Status and Staff Assignment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Status</h3>
                    <ChangeStatus
                      isStatusOpen={isStatusOpen}
                      setIsStatusOpen={setIsStatusOpen}
                      isLoadingUsers={isLoadingUsers}
                      ticketData={ticketData}
                      selectedStatus={selectedStatus as Status}
                      handleStatusSelect={handleStatusSelect}
                      setSelectedStatus={setSelectedStatus}
                    />
                  </div>

                  {/* Staff Assignment */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Assigned To</h3>
                    {/* Assignee User */}
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
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Attachments */}
          <div>
            <AttachmentList
              attachments={attachmentsData?.data || []}
              isLoading={isLoadingAttachments}
              isError={isErrorAttachments}
              onDownload={downloadAttachment.mutate}
              onDelete={deleteAttachment.mutate}
              downloadingFiles={downloadingFiles}
              deletingFiles={deletingFiles}
            />
          </div>
        </div>

        {/* Activity Section */}
        <Card>
          <CardHeader className="flex-shrink-0 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Activity</CardTitle>
              <div className="flex items-center space-x-2">
                <Button 
                  variant={!isViewingLogs ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setIsViewingLogs(false)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments
                </Button>
                <Button 
                  variant={isViewingLogs ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setIsViewingLogs(true)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Logs
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isViewingLogs ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => setDialogOpen("comment")}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Comment
                    </Button>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {comments.length} comments
                  </Badge>
                </div>
                <CommentList 
                  ticketId={id || ""} 
                  pagination={{
                    page: commentPage,
                    perPage: commentPerPage,
                    setPage: setCommentPage,
                    setPerPage: setCommentPerPage
                  }} 
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-end">                 
                  <Badge variant="outline" className="text-xs">
                    {logs?.data?.data?.length} logs
                  </Badge>
                </div>
                {isLoadingTicketLogs ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <AuditLogTable 
                    ticketId={id || ""} 
                    currentUserId={ticketData?.holder?.id || ""}
                    currentStatus={ticketData?.status || ""}
                    onStatusChange={handleOptimisticStatusChange}
                    onStaffChange={handleOptimisticStaffChange}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddCommentDialog
        open={dialogOpen === "comment"}
        onOpenChange={(open) => !open && setDialogOpen(null)}
        onSubmit={handleAddComment}
        ticketId={id}
      />

      <UploadAttachmentDialog
        open={dialogOpen === "attachment"}
        onOpenChange={(open) => !open && setDialogOpen(null)}
        ticketId={id || ""}
      />

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="max-w-md w-full rounded-xl p-6 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="text-yellow-500 w-10 h-10 mb-2" />
            <AlertDialogHeader className="w-full">
              <AlertDialogTitle className="text-lg font-bold text-gray-900 mb-1">Confirm Change</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 mb-4">
                {confirmType === "status" && pendingStatus && (
                  <>Are you sure you want to change the status to <b>{STATUS_OPTIONS.find(s => s.value === pendingStatus)?.label}</b>?</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-center gap-4 w-full mt-2">
              <AlertDialogCancel onClick={handleCancelChange} className="px-6 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmChange} className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Confirm</AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
