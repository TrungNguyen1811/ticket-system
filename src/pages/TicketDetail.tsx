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
  File
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

// Mock categories for demo
const CATEGORIES = [
  { id: "cat1", name: "Hardware Issue" },
  { id: "cat2", name: "Software Problem" },
  { id: "cat3", name: "Network Issue" },
  { id: "cat4", name: "Account Access" },
  { id: "cat5", name: "Feature Request" },
  { id: "cat6", name: "General Inquiry" },
  { id: "cat7", name: "Billing Question" },
  { id: "cat8", name: "Security Concern" },
]

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

export function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attachmentSearchTerm, setAttachmentSearchTerm] = useState("")
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<{
    type: "status" | "category"
    value: string
  } | null>(null)

  const ticket = mockTickets.find((t) => t.id === id)
  const ticketComments = mockComments.filter((c) => c.ticket_id === id)
  const ticketAuditLogs = mockAuditLogs.filter((a) => a.ticket_id === id)
  const attachments = MOCK_ATTACHMENTS

  const [editedTicket, setEditedTicket] = useState({
    title: ticket?.title || "",
    description: ticket?.description || "",
  })

  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isEditing])

  if (!ticket) {
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

  const getUserName = (userId: string) => {
    return mockUsers.find((u) => u.id === userId)?.name || "Unknown"
  }

  const getClientName = (clientId: string) => {
    return mockClients.find((c) => c.id === clientId)?.name || "Unknown"
  }

  const handleAddComment = (commentData: any) => {
    // In a real app, this would make an API call
    console.log("Adding comment:", commentData)
    setDialogOpen(null)
    toast({
      title: "Comment Added",
      description: "Your comment has been added successfully.",
    })
  }

  const handleUploadAttachment = (files: FileList) => {
    // In a real app, this would upload files
    console.log("Uploading files:", files)
    setDialogOpen(null)
    toast({
      title: "Files Uploaded",
      description: `${files.length} file(s) uploaded successfully.`,
    })
  }

  const handleAssignStaff = (staffId: string) => {
    // In a real app, this would update the ticket
    console.log("Assigning staff:", staffId)
    setDialogOpen(null)
    toast({
      title: "Staff Assigned",
      description: `Ticket assigned to ${getUserName(staffId)}.`,
    })
  }

  const handleStatusChange = (newStatus: string) => {
    // Show confirmation dialog
    setPendingChanges({ type: "status", value: newStatus })
    setShowConfirmDialog(true)
  }

  const handleCategoryChange = (categoryId: string) => {
    // Show confirmation dialog
    setPendingChanges({ type: "category", value: categoryId })
    setShowConfirmDialog(true)
    setCategoryOpen(false)
  }

  const confirmChanges = () => {
    if (!pendingChanges) return

    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      if (pendingChanges.type === "status") {
        toast({
          title: "Status Updated",
          description: `Ticket status changed to ${pendingChanges.value}.`,
        })
      } else {
        const category = CATEGORIES.find((c) => c.id === pendingChanges.value)
        setSelectedCategory(pendingChanges.value)
        toast({
          title: "Category Updated",
          description: `Ticket category changed to ${category?.name}.`,
        })
      }

      setShowConfirmDialog(false)
      setPendingChanges(null)
      setLoading(false)
    }, 1000)
  }

  const cancelChanges = () => {
    setShowConfirmDialog(false)
    setPendingChanges(null)
  }

  const handleSaveEdit = () => {
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsEditing(false)
      setLoading(false)
      toast({
        title: "Ticket Updated",
        description: "Ticket details have been updated successfully.",
      })
    }, 1000)
  }

  const filteredAttachments = attachments.filter((attachment) =>
    attachment.filename.toLowerCase().includes(attachmentSearchTerm.toLowerCase()),
  )

  const getFileIcon = (fileType: string) => {
    const type = fileType.split("/")[0]
    switch (type) {
      case "image":
        return <ImageIcon className="h-5 w-5 text-blue-500" />
      case "text":
        return <FileText className="h-5 w-5 text-green-500" />
      case "application":
        if (fileType.includes("pdf")) {
          return <FileText className="h-5 w-5 text-red-500" />
        }
        return <File className="h-5 w-5 text-orange-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "In Progress":
        return <RefreshCw className="h-4 w-4 text-yellow-600" />
      case "Done":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "Cancelled":
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
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
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Ticket Information */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b pb-4">
              <div className="space-y-2">
                {isEditing ? (
                  <Input
                    ref={titleInputRef}
                    value={editedTicket.title}
                    onChange={(e) => setEditedTicket({ ...editedTicket, title: e.target.value })}
                    className="text-xl font-bold"
                    placeholder="Ticket title"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs font-normal">
                        #{ticket.id}
                      </Badge>
                      <StatusBadge status={ticket.status} />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Created {formatDate(ticket.created_at)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Updated {formatDate(ticket.updated_at)}
                  </div>
                  <div className="flex items-center">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Holder: {getUserName(ticket.holder_id)}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 flex items-center">Description</h3>
                {isEditing ? (
                  <Textarea
                    value={editedTicket.description}
                    onChange={(e) => setEditedTicket({ ...editedTicket, description: e.target.value })}
                    className="min-h-[150px]"
                    placeholder="Ticket description"
                  />
                ) : (
                  <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md border">
                    {ticket.description}
                  </div>
                )}
              </div>

              {/* Client Information */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Client Information</h3>
                <div className="bg-gray-50 p-4 rounded-md border">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <UserAvatar name={getClientName(ticket.client_id)} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getClientName(ticket.client_id)}</p>
                      <p className="text-sm text-gray-500">
                        {mockClients.find((c) => c.id === ticket.client_id)?.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen("assign")}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Staff
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => handleStatusChange("Open")} className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange("In Progress")} className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange("Done")} className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                      Done
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("Cancelled")}
                      className="flex items-center text-red-600"
                    >
                      <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                      Cancelled
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <Tag className="h-4 w-4 mr-2" />
                      {selectedCategory ? CATEGORIES.find((c) => c.id === selectedCategory)?.name : "Set Category"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search categories..." />
                      <CommandList>
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          {CATEGORIES.map((category) => (
                            <CommandItem
                              key={category.id}
                              value={category.name}
                              onSelect={() => handleCategoryChange(category.id)}
                            >
                              {category.name}
                              {selectedCategory === category.id && <CheckCircle2 className="ml-auto h-4 w-4" />}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Attachments */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-lg font-medium">Attachments</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setDialogOpen("attachment")}>
                <Paperclip className="h-4 w-4 mr-2" />
                Add Files
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

              <ScrollArea className="h-[400px] pr-4">
                {filteredAttachments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Paperclip className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No attachments found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          {getFileIcon(attachment.type)}
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{attachment.filename}</p>
                            <div className="flex items-center text-xs text-gray-500 space-x-2">
                              <span>{formatFileSize(attachment.size)}</span>
                              <span>•</span>
                              <span>{getUserName(attachment.user_id)}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs - Comments and Audit Logs */}
      <Tabs defaultValue="comments" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="comments" className="relative">
              Comments
              <Badge className="ml-2 bg-primary text-primary-foreground">{ticketComments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="audit">
              Audit Logs
              <Badge className="ml-2 bg-primary text-primary-foreground">{ticketAuditLogs.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen("attachment")}>
              <Paperclip className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <Button size="sm" onClick={() => setDialogOpen("comment")}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </div>
        </div>

        <TabsContent value="comments">
          <Card>
            <CardContent className="p-6">
              <ScrollArea className="h-[400px]">
                <div className="space-y-6">
                  {ticketComments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-lg font-medium">No comments yet</p>
                      <p className="text-sm mt-1">Be the first to add a comment to this ticket</p>
                      <Button className="mt-4" onClick={() => setDialogOpen("comment")}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Comment
                      </Button>
                    </div>
                  ) : (
                    ticketComments.map((comment) => (
                      <div key={comment.id} className="flex space-x-4">
                        <UserAvatar name={getUserName(comment.user_id)} />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{getUserName(comment.user_id)}</span>
                              <Badge variant="outline" className="text-xs font-normal">
                                {mockUsers.find((u) => u.id === comment.user_id)?.role}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
                          </div>
                          <div className="text-gray-700 bg-gray-50 p-4 rounded-lg border">{comment.content}</div>

                          {comment.attachments && comment.attachments.length > 0 && (
                            <div className="pt-2">
                              <p className="text-sm text-gray-500 mb-2">Attachments:</p>
                              <div className="flex flex-wrap gap-2">
                                {comment.attachments.map((attachment: any, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-center space-x-2 bg-gray-100 rounded-md px-3 py-1 text-sm"
                                  >
                                    <Paperclip className="h-3 w-3 text-gray-500" />
                                    <span className="truncate max-w-[150px]">{attachment.filename}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Activity History</h3>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-6 border-l border-gray-200" />

                  <div className="space-y-6">
                    {ticketAuditLogs.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Clock className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p>No audit logs available</p>
                      </div>
                    ) : (
                      ticketAuditLogs.map((log) => (
                        <div key={log.id} className="relative pl-12">
                          <div className="absolute left-[22px] -translate-x-1/2 bg-white p-1 rounded-full border border-gray-200">
                            {getStatusIcon(log.action)}
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <UserAvatar name={getUserName(log.user_id)} size="sm" />
                                <span className="font-medium">{getUserName(log.user_id)}</span>
                              </div>
                              <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                            </div>

                            <p className="text-gray-700">
                              <span className="font-medium">{log.action}</span>
                              {log.old_value && log.new_value && (
                                <>
                                  {" from "}
                                  <Badge variant="outline" className={cn(getStatusColor(log.old_value), "font-normal")}>
                                    {log.old_value}
                                  </Badge>
                                  {" to "}
                                  <Badge variant="outline" className={cn(getStatusColor(log.new_value), "font-normal")}>
                                    {log.new_value}
                                  </Badge>
                                </>
                              )}
                              {log.new_value && !log.old_value && (
                                <>
                                  {" to "}
                                  <Badge variant="outline" className={cn(getStatusColor(log.new_value), "font-normal")}>
                                    {log.new_value}
                                  </Badge>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
        onSubmit={handleUploadAttachment}
      />

      <AssignStaffDialog
        open={dialogOpen === "assign"}
        onOpenChange={(open) => !open && setDialogOpen(null)}
        currentStaffId={ticket.staff_id}
        onSubmit={handleAssignStaff}
      />

      <ChangeStatusDialog
        open={dialogOpen === "status"}
        onOpenChange={(open) => !open && setDialogOpen(null)}
        currentStatus={ticket.status}
        onSubmit={handleStatusChange}
      />

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-2">Confirm Changes</h3>
            <p className="text-gray-600 mb-4">
              {pendingChanges?.type === "status"
                ? `Are you sure you want to change the status to "${pendingChanges.value}"?`
                : `Are you sure you want to change the category to "${CATEGORIES.find((c) => c.id === pendingChanges?.value)?.name}"?`}
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={cancelChanges} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={confirmChanges} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
