import { CommandEmpty, CommandGroup, CommandInput, CommandList } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { Command } from "./ui/command";
import { Button } from "./ui/button";
import { UserAvatar } from "./shared/UserAvatar";
import { ChevronDown } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Check } from "lucide-react";
import { CommandItem } from "./ui/command";
import { User } from "@/types/user";
import { DataResponse, Response } from "@/types/reponse";
import { mockConversation } from "@/pages/ConversationDetail";

const AssigneeUser = ({
    isStaffOpen,
    setIsStaffOpen,
    isLoadingUsers,
    usersData,
    selectedStaff,
    conversation,
    handleStaffSelect,
    isErrorUsers
}: {
    isStaffOpen: boolean,
    setIsStaffOpen: (open: boolean) => void,
    isLoadingUsers: boolean,
    usersData: Response<DataResponse<User[]>> | undefined,
    selectedStaff: string | null,
    conversation?: mockConversation ,
    handleStaffSelect: (staffId: string) => void,
    isErrorUsers: boolean
}) => {

    
    return (
        <Popover open={isStaffOpen} onOpenChange={setIsStaffOpen}>
            <PopoverTrigger asChild>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={isStaffOpen}
                className="w-full justify-between"
                disabled={isLoadingUsers}
            >
                <div className="flex items-center">
                <UserAvatar 
                    name={usersData?.data.data.find(user => user.id === selectedStaff)?.name  || "Unassigned"} 
                    size="sm" 
                />
                <span className="ml-2">
                    {usersData?.data.data.find(user => user.id === selectedStaff)?.name || "Unassigned"}
                </span>
                </div>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 z-50">
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
                        onSelect={() => handleStaffSelect(user.id)}
                        >
                        <div className="flex items-center">
                            <UserAvatar name={user.name} size="sm" />
                            <span className="ml-2">{user.name}</span>
                            {user.id === selectedStaff && (
                            <Check className="h-4 w-4 ml-2 text-green-500" />
                            )}
                        </div>
                        </CommandItem>
                    ))
                    )}
                </CommandGroup>
                </CommandList>
            </Command>
            </PopoverContent>
      </Popover>
    )
}

export default AssigneeUser;