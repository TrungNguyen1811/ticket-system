"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Status, Ticket } from "@/types/ticket";
import { useQuery } from "@tanstack/react-query";
import { Response, DataResponse } from "@/types/reponse";
import { ticketService } from "@/services/ticket.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/utils/useDebouce";
import { getConversationColumns } from "./column";
import { DataTable } from "./data-table";
import { VisibilityState } from "@tanstack/react-table";

export default function Conversation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<Status | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "updated">("newest");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data: tickets,
    isLoading,
    isError,
    refetch,
  } = useQuery<Response<DataResponse<Ticket[]>>>({
    queryKey: [
      "tickets",
      page,
      perPage,
      debouncedSearchTerm,
      selectedStatus,
      sortBy,
    ],
    queryFn: () =>
      ticketService.getTickets({
        page,
        limit: perPage,
        search: debouncedSearchTerm || undefined,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        sort_by:
          sortBy === "newest"
            ? "created_at"
            : sortBy === "oldest"
              ? "created_at"
              : "updated_at",
        sort_order: sortBy === "oldest" ? "asc" : "desc",
      }),
  });

  const handleRefresh = () => {
    refetch();
  };

  const columns = getConversationColumns();

  const ticketsData = tickets?.data.data || [];
  const total = tickets?.data.pagination?.total || 0;

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Conversations</h1>
        <p className="text-muted-foreground">Manage and track all your conversations in one place</p>
      </div>
      
      <div className="rounded-xl shadow-sm">
        <div className="bg-muted/50 rounded-t-xl px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
            {/* Search input */}
            <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-md"
              />
            </div>

            {/* Status filter */}
            <Select
              value={selectedStatus}
              onValueChange={(value: Status | "all") => {
                setSelectedStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] rounded-md">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort by */}
            <Select
              value={sortBy}
              onValueChange={(value: "newest" | "oldest" | "updated") => {
                setSortBy(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] rounded-md">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="updated">Recently Updated</SelectItem>
              </SelectContent>
            </Select>

            {/* Column visibility toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto bg-white border border-gray-200 shadow-sm w-24 hover:bg-white hover:border-secondary-300 hover:shadow-none">
                  Hidden
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {columns
                  .filter((column) => column.id !== "actions")
                  .map((column: any) => {
                    const colId = column.id;
                    return (
                      <DropdownMenuCheckboxItem
                        key={colId}
                        className="capitalize"
                        checked={columnVisibility[colId as string] !== false}
                        onCheckedChange={(value) =>
                          setColumnVisibility({
                            ...columnVisibility,
                            [colId as string]: !!value,
                          })
                        }
                      >
                        {colId}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="rounded-md"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="p-0">
          <DataTable
            columns={columns}
            data={ticketsData}
            isLoading={isLoading}
            isError={isError}
            page={page}
            perPage={perPage}
            total={total}
            onPageChange={setPage}
            onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
          />
        </div>
      </div>
    </div>
  );
}
