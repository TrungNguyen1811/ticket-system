import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { Command } from "../ui/command";
import { Button } from "../ui/button";
import { UserAvatar } from "../shared/UserAvatar";
import { ChevronDown } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Check } from "lucide-react";
import { CommandItem } from "../ui/command";
import { User } from "@/types/user";
import { DataResponse, Response } from "@/types/response";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { useState } from "react";
import { useDebounce } from "@/hooks/utils/useDebouce";

const AssigneeUser = ({
  isStaffOpen,
  setIsStaffOpen,
  isLoadingUsers,
  usersData,
  selectedStaff,
  handleStaffSelect,
  isErrorUsers,
  isTicketComplete = false,
  setSelectedStaff,
}: {
  isStaffOpen: boolean;
  setIsStaffOpen: (open: boolean) => void;
  isLoadingUsers: boolean;
  usersData: Response<DataResponse<User[]>> | undefined;
  selectedStaff: User | null;
  handleStaffSelect: (staffId: string) => void;
  isErrorUsers: boolean;
  isTicketComplete?: boolean;
  setSelectedStaff: (staff: User | null) => void;
}) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isAssigning, setIsAssigning] = useState(false);

  const { data: usersSearchData, isLoading: isLoadingUsersSearch } = useQuery({
    queryKey: ["users-search", debouncedSearch],
    queryFn: () =>
      userService.getUsers({
        page: 1,
        limit: 1000,
        search: debouncedSearch,
      }),
    enabled: debouncedSearch.length > 0,
  });

  const displayUsers =
    debouncedSearch.length > 0 && usersSearchData?.data.data
      ? usersSearchData.data.data
      : usersData?.data.data || [];

  return (
    <Popover open={isStaffOpen} onOpenChange={setIsStaffOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isStaffOpen}
          className="w-full justify-between"
          disabled={isLoadingUsers || isTicketComplete}
        >
          {isAssigning ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            <>
              <div className="flex items-center">
                <UserAvatar
                  name={selectedStaff?.name || "Unassigned"}
                  size="sm"
                />
                <span className="ml-2">
                  {selectedStaff?.name || "Unassigned"}
                </span>
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 border rounded-md shadow-md">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search staff..."
            className="h-8"
            value={search}
            onValueChange={(value) => setSearch(value)}
            disabled={isTicketComplete}
          />
          <CommandList>
            {isLoadingUsers ||
            (debouncedSearch.length > 0 && isLoadingUsersSearch) ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : isErrorUsers ? (
              <div className="p-2 text-sm text-red-500">
                Failed to load users
              </div>
            ) : displayUsers.length === 0 ? (
              <CommandEmpty>No staff found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {displayUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`${user.id} ${user.name}`}
                    onSelect={async () => {
                      if (!isTicketComplete) {
                        try {
                          setIsAssigning(true);
                          await handleStaffSelect(user.id);
                          setIsStaffOpen(false);
                          setSelectedStaff(user);
                        } catch (error) {
                        } finally {
                          setIsAssigning(false);
                        }
                      }
                    }}
                    disabled={isTicketComplete || selectedStaff?.id === user.id}
                    className="cursor-pointer hover:bg-muted"
                  >
                    <div className="flex items-center">
                      <UserAvatar name={user.name} size="sm" />
                      <span className="ml-2">{user.name}</span>
                      {user.id === selectedStaff?.id && (
                        <Check className="h-4 w-4 ml-2 text-green-500" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AssigneeUser;
