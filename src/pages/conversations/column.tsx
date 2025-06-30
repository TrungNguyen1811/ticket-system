import { Ticket } from "@/types/ticket";
import { ColumnDef } from "@tanstack/react-table";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Settings, ArrowUpDown, Eye, Building2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { TicketStatusDisplay } from "@/components/shared/StatusBadge";
import { useState } from "react";

export function getConversationColumns(): ColumnDef<Ticket>[] {
  return [
    {
      id: "title",
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate hover:text-primary transition-colors">
                {ticket.title}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                #{ticket.id}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <TicketStatusDisplay status={row.original.status} />;
      },
    },
    {
      id: "assignee",
      accessorKey: "staff.name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Assignee
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const staff = row.original.staff;
        return (
          <div className="flex items-center gap-2">
            <UserAvatar name={staff?.name || "Unassigned"} size="sm" />
            <span className="text-sm text-muted-foreground truncate">
              {staff?.name || "Unassigned"}
            </span>
          </div>
        );
      },
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.created_at), "MMM dd, yyyy, hh:mm a")}
        </span>
      ),
    },
    {
      id: "updated_at",
      accessorKey: "updated_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Updated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.updated_at), "MMM dd, yyyy, hh:mm a")}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => (
        <div className="flex items-center gap-2 min-w-0">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate block max-w-[180px]">
            Actions
          </span>
        </div>
      ),
      cell: ({ row }) => {
        const ticket = row.original;
        const [hovered, setHovered] = useState(false);
        return (
          <div className="flex items-center gap-4">
            <div
              className={`action-button ${hovered ? "hovered" : ""}`}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <Link
                to={`/communication/conversation/${ticket.id}`}
                className="flex items-center gap-1 rounded-md cursor-pointer px-2 hover:bg-slate-200"
              >
                <div className="icon-container">
                  <div className="hover-icon text-blue-500">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div className="default-icon">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
                <span className="text-muted-foreground truncate block max-w-[180px] ml-1 p-1">
                  View
                </span>
              </Link>
            </div>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
