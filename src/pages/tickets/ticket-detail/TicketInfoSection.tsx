import { Ticket, Status } from "@/types/ticket";
import { User } from "@/types/user";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import AssigneeUser from "@/components/ticket/AssigneeUser";
import ChangeStatus from "@/components/ticket/ChangeStatus";

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
  
export const TicketInfoSection: React.FC<TicketInfoSectionProps> = ({
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
    const [isStaffOpen, setIsStaffOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<Status>(ticket.status);
    const [selectedStaff, setSelectedStaff] = useState<User | null>(ticket.staff);
  
    return (
      <div className="p-6 pt-0 h-[65vh]">
        <div className="pb-3">
          <div className="text-base font-medium">Ticket Information</div>
        </div>
        <div className="pt-3 space-y-6">
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
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
    );
  };