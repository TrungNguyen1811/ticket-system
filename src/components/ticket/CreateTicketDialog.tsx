"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { createTicketSchema } from "@/schema/ticket.schema";
import { CreateTicketSchema } from "@/schema/ticket.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronsUpDown, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useDebounce } from "@/hooks/utils/useDebouce";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTicketSchema) => void;
  isLoading?: boolean;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: CreateTicketDialogProps) {
  const { toast } = useToast();

  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [isClientOpen, setIsClientOpen] = useState(false);
  const { data: clientData, isLoading: isLoadingClient } = useQuery({
    queryKey: ["client", debouncedSearch],
    queryFn: () =>
      userService.getClients({
        page: 1,
        limit: 1000,
        search: debouncedSearch,
      }),
  });

  const form = useForm<CreateTicketSchema>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      client_email: "",
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = async (data: CreateTicketSchema) => {
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
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
              render={({ field }) => {
                const selectedClient = clientData?.data?.data.find(
                  (client) => client.email === field.value,
                );
                const isCustomEmail = field.value && !selectedClient;
                
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Client Email *</FormLabel>
                    <Popover open={isClientOpen} onOpenChange={setIsClientOpen}>
                      <PopoverTrigger asChild disabled={isLoadingClient}>
                        <div className="flex items-center justify-between w-full border border-gray-200 rounded-md p-2 cursor-pointer hover:border-gray-300 transition-colors">
                          <div className="flex items-center">
                            <UserAvatar
                              name={selectedClient?.name || field.value || "Unassigned"}
                              size="sm"
                            />
                            <div className="ml-2 flex flex-col">
                              <span className="text-sm font-medium">
                                {selectedClient?.name || field.value || "Select client"}
                              </span>
                              {selectedClient && (
                                <span className="text-xs text-gray-500">
                                  {selectedClient.email}
                                </span>
                              )}
                              {isCustomEmail && (
                                <span className="text-xs text-blue-600">
                                  Custom email
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search clients or type email and press Enter..."
                            className="h-9"
                            value={search}
                            onValueChange={setSearch}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const email = search.trim();
                                if (email && isValidEmail(email)) {
                                  form.setValue("client_email", email);
                                  setSearch("");
                                  setIsClientOpen(false);
                                }
                              }
                            }}
                          />
                          <CommandList>
                            {isLoadingClient ? (
                              <div className="flex items-center justify-center p-3">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="ml-2 text-sm text-gray-500">Loading clients...</span>
                              </div>
                            ) : (
                              <>
                                {clientData?.data?.data.length === 0 && search.trim() && (
                                  <CommandEmpty>
                                    <div className="text-center p-3">
                                      <p className="text-sm text-gray-600">No client found</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Press Enter to use "{search.trim()}" as client email
                                      </p>
                                    </div>
                                  </CommandEmpty>
                                )}
                                {clientData?.data?.data.length === 0 && !search.trim() && (
                                  <CommandEmpty>
                                    <div className="text-center p-3">
                                      <p className="text-sm text-gray-600">No clients available</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Type an email and press Enter to add a new client
                                      </p>
                                    </div>
                                  </CommandEmpty>
                                )}
                                {clientData?.data?.data && clientData.data.data.length > 0 && (
                                  <CommandGroup>
                                    <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                                      Existing Clients
                                    </div>
                                    {clientData.data.data.map((client) => (
                                      <CommandItem
                                        key={client.id}
                                        value={`${client.id} ${client.name} ${client.email}`}
                                        onSelect={() => {
                                          form.setValue("client_email", client.email);
                                          setSearch("");
                                          setIsClientOpen(false);
                                        }}
                                        className="flex items-center justify-between"
                                      >
                                        <div className="flex items-center">
                                          <UserAvatar name={client.name} size="sm" />
                                          <div className="ml-2">
                                            <span className="text-sm font-medium">{client.name}</span>
                                            <div className="text-xs text-gray-500">{client.email}</div>
                                          </div>
                                        </div>
                                        {client.email === field.value && (
                                          <Check className="h-4 w-4 text-green-500" />
                                        )}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                                {search.trim() && isValidEmail(search.trim()) && (
                                  <CommandGroup>
                                    <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                                      Add New Client
                                    </div>
                                    <CommandItem
                                      value={`new-${search.trim()}`}
                                      onSelect={() => {
                                        form.setValue("client_email", search.trim());
                                        setSearch("");
                                        setIsClientOpen(false);
                                      }}
                                      className="flex items-center justify-between"
                                    >
                                      <div className="flex items-center">
                                        <UserAvatar name={search.trim()} size="sm" />
                                        <div className="ml-2">
                                          <span className="text-sm font-medium">{search.trim()}</span>
                                          <div className="text-xs text-blue-600">New client</div>
                                        </div>
                                      </div>
                                      <div className="text-xs text-gray-400">Press Enter</div>
                                    </CommandItem>
                                  </CommandGroup>
                                )}
                              </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
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
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  ""
                )}
                Create Ticket
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
