import { CalendarIcon } from "lucide-react";

import { Clock } from "lucide-react";

import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Ticket, Status } from "@/types/ticket";
import { User } from "@/types/user";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import AssigneeUser from "@/components/ticket/AssigneeUser";
import ChangeStatus from "@/components/ticket/ChangeStatus";

interface TicketHeaderSectionProps {
    ticket: Ticket;
    isEditingTitle: boolean;
    editedTitle: string;
    savingTitle: boolean;
    onTitleChange: (value: string) => void;
    onTitleBlur: () => void;
    onTitleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onEditTitle: () => void;
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
  }
  
export const TicketHeaderSection: React.FC<TicketHeaderSectionProps> = ({
    ticket,
    isEditingTitle,
    editedTitle,
    savingTitle,
    onTitleChange,
    onTitleBlur,
    onTitleKeyDown,
    onEditTitle,
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
  }) => {
    const isReadOnly = ticket.status === "complete" || ticket.status === "archived";
    const [isStaffOpen, setIsStaffOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<Status>(ticket.status);
    const [selectedStaff, setSelectedStaff] = useState<User | null>(ticket.staff);

    return (
      <div className="p-6 bg-white border rounded-lg hover:shadow-md transition-all duration-300">
        <div className="pb-4">
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
                    className="text-xl font-semibold text-foreground cursor-pointer hover:underline transition-colors"
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
          <div className="pt-3 space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-foreground" >
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
                    "text-sm text-foreground p-4 rounded-lg  cursor-pointer transition-all duration-200 break-words whitespace-pre-line",
                    !showFullDescription &&
                      isDescriptionClamped &&
                      "line-clamp-4",
                    isReadOnly && "cursor-not-allowed",
                    isEditingDescription && "border bg-muted/30",
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
              <label className="text-xs font-medium uppercase tracking-wider text-foreground">
                Status
              </label>
              <ChangeStatus
                isStatusOpen={isStatusOpen}
                setIsStatusOpen={setIsStatusOpen}
                isLoadingUsers={isLoadingUsers}
                ticketData={ticket}
                selectedStatus={selectedStatus}
                handleStatusSelect={onStatusChange}
                setSelectedStatus={setSelectedStatus}
                isTicketComplete={isReadOnly}
              />  
            </div>
  
            {/* Staff Assignment */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-foreground">
                Assigned To
              </label>
              <AssigneeUser
                isStaffOpen={isStaffOpen}
                setIsStaffOpen={setIsStaffOpen}
                isLoadingUsers={isLoadingUsers}
                usersData={usersData}
                selectedStaff={selectedStaff}
                handleStaffSelect={onStaffAssign}
                isErrorUsers={isErrorUsers}
                isTicketComplete={isReadOnly}
                setSelectedStaff={setSelectedStaff}
              />
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  };    