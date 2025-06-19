import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { ChevronDown } from "lucide-react"
import { Check } from "lucide-react"
import { Ticket } from "@/types/ticket"
import { STATUS_OPTIONS, SHOW_STATUS_OPTIONS } from "@/lib/constants"
import { getStatusIcon } from "./shared/StatusBadge"
import { useAuth } from "@/contexts/AuthContext"
import { Status } from "@/types/ticket"


const ChangeStatus = ({
    isStatusOpen,
    setIsStatusOpen,
    isLoadingUsers,
    ticketData,
    selectedStatus,
    handleStatusSelect,
    setSelectedStatus,
    isTicketComplete = false
}: {
    isStatusOpen: boolean,
    setIsStatusOpen: (open: boolean) => void,
    isLoadingUsers: boolean,
    ticketData: Ticket ,
    selectedStatus: Status  ,
    handleStatusSelect: (status: Status) => void,
    setSelectedStatus: (status: Status) => void,
    isTicketComplete?: boolean
}) => {
    const { user } = useAuth()
    const isAdmin = user?.role === "admin"
    const isHolder = ticketData?.holder?.id === user?.id
    const canArchive = isAdmin || isHolder

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
                            <div className="flex items-center">
                              {getStatusIcon(selectedStatus)}
                              <span className="ml-2">
                                {SHOW_STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}
                              </span>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                {getStatusIcon(ticketData.status)}
                              <span className="ml-2">
                                {SHOW_STATUS_OPTIONS.find(s => s.value === ticketData.status)?.label}
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
                              {STATUS_OPTIONS.map((status) => {
                                // Skip archived status if user doesn't have permission
                                if (status.value === "archived" && !canArchive) {
                                  return null
                                }
                                
                                return (
                                  <CommandItem
                                    key={status.value}
                                    value={status.value}
                                    onSelect={() => {
                                      setSelectedStatus(status.value as Status)
                                      handleStatusSelect(status.value as Status)
                                    }}
                                    disabled={isTicketComplete}
                                  >
                                    <div className="flex items-center">
                                      {getStatusIcon(status.value)}
                                      <span className="ml-2">{status.label}</span>
                                      {status.value === ticketData.status && <Check className="h-4 w-4 ml-2 text-green-500" />}
                                    </div>
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
    )
}

export default ChangeStatus;