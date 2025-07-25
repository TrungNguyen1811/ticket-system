import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../ui/command";
import { ChevronDown } from "lucide-react";
import { Ticket } from "@/types/ticket";
import { STATUS_OPTIONS } from "@/lib/constants";
import { TicketStatusDisplay } from "../shared/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { Status } from "@/types/ticket";

const ChangeStatus = ({
  isStatusOpen,
  setIsStatusOpen,
  isLoadingUsers,
  ticketData,
  selectedStatus,
  handleStatusSelect,
  setSelectedStatus,
  isTicketComplete = false,
}: {
  isStatusOpen: boolean;
  setIsStatusOpen: (open: boolean) => void;
  isLoadingUsers: boolean;
  ticketData: Ticket;
  selectedStatus: Status;
  handleStatusSelect: (status: Status) => void;
  setSelectedStatus: (status: Status) => void;
  isTicketComplete?: boolean;
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isHolder = ticketData?.holder?.id === user?.id;
  const canArchive = isAdmin || isHolder;

  return (
    <Popover open={isStatusOpen} onOpenChange={setIsStatusOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isStatusOpen}
          className="w-full justify-between"
          disabled={isLoadingUsers || isTicketComplete}
        >
          {selectedStatus ? (
            <TicketStatusDisplay status={selectedStatus} variant="iconLabel" />
          ) : (
            <TicketStatusDisplay
              status={ticketData.status}
              variant="iconLabel"
            />
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border rounded-md shadow-md">
        <Command>
          <CommandList>
            <CommandGroup>
              {STATUS_OPTIONS.map((status) => {
                // Skip archived status if user doesn't have permission
                if (status.value === "archived" && !canArchive) {
                  return null;
                }

                return (
                  <CommandItem
                    key={status.value}
                    value={status.value}
                    onSelect={() => {
                      setSelectedStatus(status.value as Status);
                      handleStatusSelect(status.value as Status);
                    }}
                    disabled={
                      isTicketComplete || selectedStatus === status.value
                    }
                    className="cursor-pointer hover:bg-muted"
                  >
                    <TicketStatusDisplay
                      status={status.value}
                      variant="iconLabel"
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ChangeStatus;
