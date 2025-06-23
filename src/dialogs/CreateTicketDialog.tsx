"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { createTicketSchema } from "@/schema/ticket.schema"
import { CreateTicketSchema } from "@/schema/ticket.schema"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, ChevronsUpDown, Loader2 } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useDebounce } from "@/hooks/useDebouce"
import { useQuery } from "@tanstack/react-query"
import { userService } from "@/services/user.service"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"
import { UserAvatar } from "@/components/shared/UserAvatar"

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTicketSchema) => void
  isLoading?: boolean
}

export function CreateTicketDialog({ open, onOpenChange, onSubmit, isLoading = false }: CreateTicketDialogProps) {
  const { toast } = useToast()

  const [search, setSearch] = useState<string>("")
  const debouncedSearch = useDebounce(search, 500)
  const [isClientOpen, setIsClientOpen] = useState(false)
  const { data: clientData, isLoading: isLoadingClient } = useQuery({
    queryKey: ["client", debouncedSearch],
    queryFn: () => userService.getUsers({
      page: 1,
      limit: 1000,
      search: debouncedSearch
  }),
  })

  const form = useForm<CreateTicketSchema>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      client_email: "",
    }
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  const handleSubmit = async (data: CreateTicketSchema) => {
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField 
              control={form.control} 
              name="title" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter ticket title"
                      required
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <FormField
              control={form.control}
              name="client_email"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Client Email *</FormLabel>
                  <Popover open={isClientOpen} onOpenChange={setIsClientOpen}>
            <PopoverTrigger asChild  disabled={isLoadingClient} >
              <div className="flex items-center justify-between w-full border border-gray-200 rounded-md p-2">
                <div className="flex items-center">
                  <UserAvatar 
                    name={clientData?.data.data.find(client => client.email === field.value)?.name || "Unassigned"} 
                    size="sm" 
                  />
                  <span className="ml-2 text-sm">
                    {clientData?.data.data.find(client => client.email === field.value)?.name || "Unassigned"}
                  </span>
                </div>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 z-50">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Search staff..." 
                        className="h-8"
                        value={search}
                        onValueChange={(value) => {
                          setSearch(value)
                        }}
                    />
                    <CommandList>
                          {isLoadingClient ? (
                            <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        ) : clientData?.data.data.length === 0 ? (
                            <CommandEmpty>No client found.</CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {clientData?.data.data.map((client) => (
                                    <CommandItem
                                        key={client.id}
                                        value={`${client.id} ${client.name}`}
                                        onSelect={() => {
                                          form.setValue("client_email", client.email)
                                          setIsClientOpen(false)
                                        }}
                                        disabled={isLoadingClient}
                                    >
                                        <div className="flex items-center">
                                            <UserAvatar name={client.name} size="sm" />
                                            <span className="ml-2">{client.name}</span>
                                            {client.email === field.value && (
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField 
              control={form.control} 
              name="description" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the issue in detail"
                      rows={4}
                      required
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : ""}
                Create Ticket
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

