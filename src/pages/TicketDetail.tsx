"use client"

import { CommandEmpty } from "@/components/ui/command"

import { useState, useEffect, useRef } from "react"
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
  Calendar,
  Filter,
  File,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Trash
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandList, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ticketService, UpdateTicketData } from "@/services/ticket.service"
import { DataResponse, Response } from "@/types/reponse"
import { Attachment, Ticket, TicketAuditLog } from "@/types/ticket"
import { Comment, CommentFormData } from "@/types/comment"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import commentService from "@/services/comment.services"
import { CommentList } from "@/components/editor/CommentList"
import attachmentService from "@/services/attachment"
import logService from "@/services/log.service"
import { AuditLogTable } from "@/components/editor/AuditLogTable"
import { STATUS_OPTIONS } from "@/lib/constants"
import { User } from "@/types/user"
import { userService } from "@/services/user.service"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"



// Mock attachments for demo
const MOCK_ATTACHMENTS = [
  {
    id: "att1",
    filename: "screenshot.png",
    size: 1240000,
    type: "image/png",
    created_at: "2025-06-01T10:30:00Z",
    user_id: "user1",
  },
  {
    id: "att2",
    filename: "error_log.txt",
    size: 45000,
    type: "text/plain",
    created_at: "2025-06-01T11:15:00Z",
    user_id: "user2",
  },
  {
    id: "att3",
    filename: "system_report.pdf",
    size: 2800000,
    type: "application/pdf",
    created_at: "2025-06-02T09:20:00Z",
    user_id: "user3",
  },
  {
    id: "att4",
    filename: "database_backup.sql",
    size: 8500000,
    type: "application/sql",
    created_at: "2025-06-02T14:45:00Z",
    user_id: "user2",
  },
  {
    id: "att5",
    filename: "user_manual.docx",
    size: 3700000,
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    created_at: "2025-06-03T08:10:00Z",
    user_id: "user4",
  },
]

// Helper: kiểm tra có cần xem thêm không (dựa vào số dòng)
function isDescriptionClamped(text: string, maxLines = 4) {
  // Tạm thời: nếu có hơn 300 ký tự hoặc có hơn 4 dòng thì xem là cần xem thêm
  return text.split("\n").length > maxLines || text.length > 300
}

export function TicketDetail() {
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

  const { data: commentsData, isLoading: isLoadingComments, isError: isErrorComments } = useQuery<Response<DataResponse<Comment[]>>>({
    queryKey: ["ticket-comments", id],
    queryFn: () => commentService.getCommentsTicket(id || ""),
  })

  const { data: attachmentsData, isLoading: isLoadingAttachments, isError: isErrorAttachments } = useQuery<Response<DataResponse<Attachment[]>>>({
    queryKey: ["ticket-attachments", id],
    queryFn: () => attachmentService.getAttachments(id || ""),
  })

  const { data: logsData, isLoading: isLoadingLogs, isError: isErrorLogs } = useQuery<Response<DataResponse<TicketAuditLog[]>>>({
    queryKey: ["ticket-logs", id],
    queryFn: () => logService.getTicketLogs(id || ""),
  })


  // Download attachment
  const downloadAttachment = useMutation({
    mutationFn: (attachmentId: string) => attachmentService.downloadAttachment(attachmentId),
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(data)
      window.open(url, '_blank');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download attachment",
        variant: "destructive",
      })
    }
  })

  const handleDownloadAttachment = (attachmentId: string) => {
    downloadAttachment.mutate(attachmentId)
  }

  // Delete attachment
  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: string) => attachmentService.deleteAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-attachments", id] })
      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete attachment",
        variant: "destructive",
      })
    }
  })

  // Get ticket audit logs
  useEffect(() => {
    if (ticket?.data) {
      setEditedTitle(ticket.data.title)
      setEditedDescription(ticket.data.description)
    }
  }, [ticket?.data])

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketData }) => ticketService.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] })
      toast({
        title: "Success",
        description: "Ticket updated successfully",
      })
      setIsStatusOpen(false)
      setIsStaffOpen(false)
      setSelectedStatus("")
      setSelectedStaff("")
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      })
    },
  })

  const handleStatusChange = (status: string) => {
    if (!id) return
    updateTicketMutation.mutate({
      id,
      data: {
        status: status as "new" | "in_progress" | "waiting" | "assigned" | "complete" | "force_closed",
        _method: "PUT"
      }
    })
  }

  const handleStaffAssign = (staffId: string) => {
    if (!id) return
    updateTicketMutation.mutate({
      id,
      data: {
        staff_id: staffId,
        _method: "PUT"
      }
    })
  }

  const handleAddComment = async (data: { content: string; attachments?: File[] }) => {
    if (!id) return
    try {
      const formData = new FormData()
      formData.append("content", data.content)
      
      if (data.attachments?.length) {
        data.attachments.forEach((file) => {
          formData.append("attachments[]", file)
        })
      }

      await commentService.createComment(id, formData as CommentFormData)
      queryClient.invalidateQueries({ queryKey: ["ticket-comments", id] })
      toast({
        title: "Success",
        description: "Comment added successfully",
      })
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
  const handleSaveTitle = async () => {
    if (!id) return
    try {
      await ticketService.updateTicket(id, { title: editedTitle, _method: "PUT" })
      queryClient.invalidateQueries({ queryKey: ["ticket", id] })
      setIsEditingTitle(false)
      toast({ title: "Success", description: "Title updated successfully" })
    } catch {
      toast({ title: "Error", description: "Failed to update title", variant: "destructive" })
    }
  }
  const handleSaveDescription = async () => {
    if (!id) return
    try {
      await ticketService.updateTicket(id, { description: editedDescription, _method: "PUT" })
      queryClient.invalidateQueries({ queryKey: ["ticket", id] })
      setIsEditingDescription(false)
      toast({ title: "Success", description: "Description updated successfully" })
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
      await ticketService.updateTicket(id, { title: editedTitle, _method: "PUT" })
      queryClient.invalidateQueries({ queryKey: ["ticket", id] })
      toast({ title: "Success", description: "Title updated successfully" })
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

  const hasNextPage = commentsData?.data.data.length === 10
  const isFetchingNextPage = commentsData?.data.data.length === 10

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/tickets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Link>
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setDialogOpen("comment")}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Comment
          </Button>
          {/* <Button variant="outline" onClick={() => setDialogOpen("attachment")}>
            <Paperclip className="h-4 w-4 mr-2" />
            Add Files
          </Button> */}
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-col h-[calc(100vh-120px)]">
        <ResizablePanelGroup
          direction="vertical"
          className="flex-1"
        >
          <ResizablePanel defaultSize={62} minSize={16}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-1">
              {/* Left Column - Ticket Information */}
              <div className="lg:col-span-2">
                <Card className="overflow-hidden h-full flex flex-col">
                  <CardHeader className="bg-gray-50 border-b pb-4 flex-shrink-0">
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
                          <Calendar className="h-4 w-4 mr-1" />
                          Created {formatDate(ticket.data.created_at)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Updated {formatDate(ticket.data.updated_at)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6 flex-1 overflow-y-auto">
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
                            >
                              {selectedStaff ? (
                                <div className="flex items-center">
                                  <UserAvatar name={selectedStaff} size="sm" />
                                  <span className="ml-2">{selectedStaff}</span>
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
                                  {usersData?.data.data.map((user) => (
                                  <CommandItem
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
                                ))}
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
                <Card className="h-full flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 flex-shrink-0">
                    <CardTitle className="text-lg font-medium">Attachments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 overflow-y-auto">
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
                      {Array.isArray(attachmentsData?.data.data) && attachmentsData?.data.data.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                          <a 
                            href={attachment.filename} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={() => handleDownloadAttachment(attachment.id)} 
                            className="flex items-center gap-2 text-blue-500 hover:underline"
                          >
                            <File className="h-4 w-4" />
                            {attachment.filename}
                          </a>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteAttachment.mutate(attachment.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-gray-200 my-2" />

          <ResizablePanel defaultSize={40} minSize={30}>
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0 pb-2">
                <Tabs defaultValue="comments" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="comments" className="flex-1">Comments</TabsTrigger>
                    <TabsTrigger value="logs" className="flex-1">Logs</TabsTrigger>
                  </TabsList>
                  <CardContent className="flex-1 overflow-y-auto p-0">
                    <TabsContent value="comments" className="h-full m-0">
                      <CommentList ticketId={id || ""} currentUserId={ticket.data.holder_id} />
                    </TabsContent>
                    <TabsContent value="logs" className="h-full m-0">
                      <AuditLogTable logs={logsData?.data.data || []} ticketId={id || ""} currentUserId={ticket.data.staff_id} />
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </CardHeader>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Dialogs */}
      <AddCommentDialog
        open={dialogOpen === "comment"}
        onOpenChange={(open) => !open && setDialogOpen(null)}
        onSubmit={handleAddComment}
        ticketId={id}
      />

      {/* <UploadAttachmentDialog
        open={dialogOpen === "attachment"}
        onOpenChange={(open) => !open && setDialogOpen(null)}
        onSubmit={handleUploadAttachment}
      /> */}

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
                  <>Are you sure you want to assign to <b>{pendingStaff}</b>?</>
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
