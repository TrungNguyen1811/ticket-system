"use client"

import { CommandEmpty } from "@/components/ui/command"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { mockTickets, mockUsers, mockClients, mockComments, mockAuditLogs } from "@/mock/data"
import { formatDate, getStatusColor } from "@/lib/utils"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { StatusBadge } from "@/components/shared/StatusBadge"
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
  Trash
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandList, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ticketService, UpdateTicketData } from "@/services/ticket.service"
import { DataResponse, Response } from "@/types/reponse"
import { Attachment, Ticket, TicketAuditLog } from "@/types/ticket"
import { Comment, CommentFormData } from "@/types/comment"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { commentService } from "@/services/comment.services"
import { CommentList } from "@/components/editor/CommentList"
import attachmentService from "@/services/attachment"
import logService from "@/services/log.service"
import { AuditLogTable } from "@/components/editor/AuditLogTable"
import { STATUS_OPTIONS } from "@/lib/constants"
import { User } from "@/types/user"
import { userService } from "@/services/user.service"
import { useTicketMutations } from "@/hooks/useTicketMutations"
import { useTicketRealtime } from "@/hooks/useTicketRealtime"
import { useCommentRealtime } from "@/hooks/useCommentRealtime"
import { useLogRealtime } from "@/hooks/userLogRealtime"
import { useTicketComments } from "@/hooks/useTicketComments"
import { useTicketLogs } from "@/hooks/useTicketLogs"


// Helper: kiểm tra có cần xem thêm không (dựa vào số dòng)
function isDescriptionClamped(text: string, maxLines = 4) {
  // Tạm thời: nếu có hơn 300 ký tự hoặc có hơn 4 dòng thì xem là cần xem thêm
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
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attachmentSearchTerm, setAttachmentSearchTerm] = useState("")
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isStaffOpen, setIsStaffOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedStaff, setSelectedStaff] = useState<string>("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [savingTitle, setSavingTitle] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [pendingStaff, setPendingStaff] = useState<string | null>(null)
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
    pagination: logsPagination,
    isLoading: isLoadingTicketLogs
  } = useTicketLogs({ ticketId: id || "" })

  const handleTicketUpdate = useCallback((data: Ticket) => {
    try {
      queryClient.setQueryData<Response<Ticket>>(
        ["ticket", id],
        (oldData) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: { ...oldData.data, ...data }
          };
        }
      );
    } catch (error) {
      console.error("Failed to update ticket cache:", error);
    }
  }, [queryClient, id]);
  
  // Subscribe to ticket updates
  useTicketRealtime(id || "", handleTicketUpdate);

  const handleCommentUpdate = useCallback((data: Comment) => {
    // Get current comments data to check pagination
    const currentData = queryClient.getQueryData<Response<DataResponse<Comment[]>>>(
      ["ticket-comments", id, commentPage, commentPerPage]
    );

    // Only update if we're on the first page (newest comments)
    const shouldUpdate = currentData?.data && commentPage === 1;

    if (shouldUpdate) {
      console.log("handleCommentUpdate", data);
      queryClient.setQueryData<Response<DataResponse<Comment[]>>>(
        ["ticket-comments", id, commentPage, commentPerPage],
        (oldData) => {
          if (!oldData?.data) return oldData;
          
          // Check if comment already exists
          const commentExists = oldData.data.data.some(comment => comment.id === data.id);
          if (commentExists) return oldData;

          const newTotal = (oldData.data.pagination?.total || 0) + 1;
          
          // Add new comment at the beginning since backend sorts by newest first
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: [data, ...oldData.data.data],
              pagination: {
                ...oldData.data.pagination,
                total: newTotal,
                page: oldData.data.pagination?.page || 1,
                perPage: oldData.data.pagination?.perPage || commentPerPage
              }
            }
          };
        }
      );
    } else {
      // Just invalidate the query to refetch data
      queryClient.invalidateQueries({ queryKey: ["ticket-comments", id] });
    }
  }, [queryClient, id, commentPage, commentPerPage]);

  useCommentRealtime(id || "", handleCommentUpdate);


  const { data: ticket, isLoading: isLoadingTicket, isError: isErrorTicket } = useQuery<Response<Ticket>>({
    queryKey: ["ticket", id],
    queryFn: () => ticketService.getTicket(id || ""),
  })

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

  // Get ticket audit logs
  useEffect(() => {
    if (ticket?.data) {
      setEditedTitle(ticket.data.title)
      setEditedDescription(ticket.data.description)
    }
  }, [ticket?.data])


  const handleStatusChange = (status: string) => {
    if (!id) return
    mutations.changeStatus.mutate({
      id,
      data: {
        status: status as "new" | "in_progress" | "waiting" | "assigned" | "complete" | "force_closed",
        _method: "PUT"
      }
    })
  }

  const handleStaffAssign = (staffId: string) => {
    if (!id) return
    mutations.assign.mutate({
      id,
      data: {
        staff_id: staffId,
        _method: "PUT"
      }
    })
  }

  const handleAddComment = async (data: { editorContent: { raw: string; html: string }; attachments?: File[] }) => {
    if (!id) return
  
    try {
      const formData = new FormData()
      formData.append("content", data.editorContent.html)
  
      if (data.attachments?.length) {
        data.attachments.forEach((file) => {
          formData.append("attachments[]", file)
        })
      }
  
      mutations.createComment.mutate({ id: id || "", data: formData as CommentFormData })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    }
  }
  
  // const handleUploadAttachment = async (files: FileList) => {
  //   if (!id) return
  //   try {
  //     const fileArray = Array.from(files)
  //     await ticketService.uploadAttachments(id, fileArray)
  //     queryClient.invalidateQueries({ queryKey: ["ticket", id] })
  //     toast({
  //       title: "Success",
  //       description: "Attachment uploaded successfully",
  //     })
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to upload attachment",
  //       variant: "destructive",
  //     })
  //   }
  // }

  // Save handlers

  const handleSaveDescription = async () => {
    if (!id) return
    try {
      mutations.update.mutate({
        id,
        data: {
          description: editedDescription,
          _method: "PUT"
        }
      })
      setIsEditingDescription(false)
    } catch {
      toast({ title: "Error", description: "Failed to update description", variant: "destructive" })
    }
  }

  // Auto-save title on blur or Enter
  const handleTitleBlur = async () => {
    if (!id || editedTitle.trim() === ticket?.data?.title) {
      setIsEditingTitle(false)
      return
    }
    setSavingTitle(true)
    try {
      mutations.update.mutate({
        id,
        data: {
          title: editedTitle,
          _method: "PUT"
        }
      })
    } catch {
      toast({ title: "Error", description: "Failed to update title", variant: "destructive" })
      setEditedTitle(ticket?.data?.title || "")
    } finally {
      setSavingTitle(false)
      setIsEditingTitle(false)
    }
  }
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur()
    } else if (e.key === "Escape") {
      setEditedTitle(ticket?.data?.title || "")
      setIsEditingTitle(false)
    }
  }

  // Xác nhận đổi status
  const handleStatusSelect = (status: string) => {
    setPendingStatus(status)
    setConfirmType("status")
    setConfirmDialogOpen(true)
  }
  const handleStaffSelect = (staffId: string) => {
    setPendingStaff(staffId)
    setConfirmType("staff")
    setConfirmDialogOpen(true)
  }
  const handleConfirmChange = () => {
    if (confirmType === "status" && pendingStatus) {
      handleStatusChange(pendingStatus)
    } else if (confirmType === "staff" && pendingStaff) {
      handleStaffAssign(pendingStaff)
    }
    setConfirmDialogOpen(false)
    setPendingStatus(null)
    setPendingStaff(null)
    setConfirmType(null)
  }
  const handleCancelChange = () => {
    setConfirmDialogOpen(false)
    setPendingStatus(null)
    setPendingStaff(null)
    setConfirmType(null)
  }

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

  if (!ticket?.data) {
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

  const getStatusIcon = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status)
    if (!statusOption) return <AlertCircle className="h-4 w-4 text-gray-600" />
    
    return (
      <div className={cn(
        "h-2 w-2 rounded-full",
        statusOption.color === "blue" && "bg-blue-500",
        statusOption.color === "yellow" && "bg-yellow-500",
        statusOption.color === "orange" && "bg-orange-500",
        statusOption.color === "purple" && "bg-purple-500",
        statusOption.color === "green" && "bg-green-500",
        statusOption.color === "red" && "bg-red-500",
      )} />
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
                          {savingTitle ? <span className="text-sm text-gray-500">Đang lưu...</span> : ticket.data.title}
                        </h1>
                      )}
                    </div>
                    
                  </div>
                  <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs font-normal">
                        #{ticket.data.id}
                      </Badge>
                      <StatusBadge status={ticket.data.status} />
                    </div>
                  <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-2">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Created {formatDate(ticket.data.created_at)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Updated {formatDate(ticket.data.updated_at)}
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
                        <Button size="sm" variant="ghost" onClick={() => { setIsEditingDescription(false); setEditedDescription(ticket?.data?.description || "") }}>
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
                          {showFullDescription ? "Thu gọn" : "Xem thêm"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Client Information */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Client Information</h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <div className="flex items-center space-x-3">
                      <UserAvatar name={ticket.data.client_name} />
                      <div>
                        <p className="font-medium text-gray-900">{ticket.data.client_name}</p>
                        <p className="text-sm text-gray-500">{ticket.data.client_email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Staff Assignment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Status</h3>
                    <Popover open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isStatusOpen}
                          className="w-full justify-between"
                          disabled={isLoadingUsers}
                        >
                          {selectedStatus ? (
                            <div className="flex items-center">
                              {getStatusIcon(selectedStatus)}
                              <span className="ml-2">
                                {STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              {getStatusIcon(ticket.data.status)}
                              <span className="ml-2">
                                {STATUS_OPTIONS.find(s => s.value === ticket.data.status)?.label}
                              </span>
                            </div>
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search status..." />
                          <CommandList>
                            <CommandEmpty>No status found.</CommandEmpty>
                            <CommandGroup>
                              {STATUS_OPTIONS.map((status) => (
                                <CommandItem
                                  key={status.value}
                                  value={status.value}
                                  onSelect={() => {
                                    setSelectedStatus(status.value)
                                    handleStatusSelect(status.value)
                                  }}
                                >
                                  <div className="flex items-center">
                                    {getStatusIcon(status.value)}
                                    <span className="ml-2">{status.label}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Staff Assignment */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Assigned To</h3>
                    <Popover open={isStaffOpen} onOpenChange={setIsStaffOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isStaffOpen}
                          className="w-full justify-between"
                          disabled={isLoadingUsers}
                        >
                          {selectedStaff ? (
                            <div className="flex items-center">
                              <UserAvatar name={usersData?.data.data.find(user => user.id === selectedStaff)?.name || "Unassigned"} size="sm" />
                              <span className="ml-2">{usersData?.data.data.find(user => user.id === selectedStaff)?.name || "Unassigned"}</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <UserAvatar name={ticket.data.staff?.name || "Unassigned"} size="sm" />
                              <span className="ml-2">{ticket.data.staff?.name || "Unassigned"}</span>
                            </div>
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search staff..." />
                          <CommandList>
                            <CommandEmpty>No staff found.</CommandEmpty>
                            <CommandGroup>
                              {isLoadingUsers ? (
                                <div className="flex items-center justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : isErrorUsers ? (
                                <div className="p-2 text-sm text-red-500">Failed to load users</div>
                              ) : (
                                usersData?.data.data.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    value={user.id}
                                    onSelect={() => {
                                      setSelectedStaff(user.id)
                                      handleStaffSelect(user.id)
                                    }}
                                  >
                                    <div className="flex items-center">
                                      <UserAvatar name={user.name} size="sm" />
                                      <span className="ml-2">{user.name}</span>
                                    </div>
                                  </CommandItem>
                                ))
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Attachments */}
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-medium">Attachments</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDialogOpen("attachment")}
                  className="h-8"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search attachments..."
                    value={attachmentSearchTerm}
                    onChange={(e) => setAttachmentSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-2">
                  {isLoadingAttachments ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : isErrorAttachments ? (
                    <div className="text-center p-4 text-red-500">
                      Failed to load attachments
                    </div>
                  ) : Array.isArray(attachmentsData?.data) && attachmentsData?.data.length > 0 ? (
                    <div className="grid gap-2">
                      {attachmentsData.data
                        .filter((attachment: Attachment) => 
                          attachment.file_name.toLowerCase().includes(attachmentSearchTerm.toLowerCase())
                        )
                        .map((attachment: Attachment) => (
                          <div 
                            key={attachment.id} 
                            className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50 hover:bg-gray-50 transition-colors overflow-hidden"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                              <div className="flex-shrink-0">
                                {attachment.content_type.startsWith('image/') ? (
                                  <ImageIcon className="h-5 w-5 text-blue-500" />
                                ) : (
                                  <FileText className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <a
                                  href={attachment.file_path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block truncate text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
                                >
                                  {attachment.file_name}
                                </a>
                                <p className="truncate text-xs text-gray-500">
                                  {formatFileSize(attachment.file_size)} • {formatDate(attachment.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  downloadAttachment.mutate(attachment.id);
                                }}
                                disabled={downloadingFiles.has(attachment.id)}
                                className="h-8 w-8 p-0"
                              >
                                {downloadingFiles.has(attachment.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteAttachment.mutate(attachment.id);
                                }}
                                disabled={deletingFiles.has(attachment.id)}
                                className="h-8 w-8 p-0 hover:text-red-500"
                              >
                                {deletingFiles.has(attachment.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 border-2 border-dashed rounded-lg bg-gray-50/50">
                      <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No attachments found</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setDialogOpen("attachment")}
                        className="mt-2"
                      >
                        Upload files
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                    {logs.length} logs
                  </Badge>
                </div>
                {isLoadingTicketLogs ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <AuditLogTable 
                    logs={logs} 
                    ticketId={id || ""} 
                    currentUserId={ticket.data.staff?.id || ""} 
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
                {confirmType === "staff" && pendingStaff && (
                  <>Are you sure you want to assign to <b>{usersData?.data.data.find(user => user.id === pendingStaff)?.name || "Unassigned"}</b>?</>
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
