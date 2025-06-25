import { Ticket } from "@/types/ticket";
import { ColumnDef } from "@tanstack/react-table";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Settings,
  ArrowUpDown,
  Eye,
  Building2,
  Edit,
  UserPlus,
  RefreshCw,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { TicketStatusDisplay } from "@/components/shared/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface TicketTableActionProps {
  onViewDetail: (ticket: Ticket) => void;
  onEdit: (ticket: Ticket) => void;
  onAssign: (ticket: Ticket) => void;
  onStatusChange: (ticket: Ticket) => void;
  isLoadingStates: {
    update: boolean;
    assign: boolean;
    changeStatus: boolean;
  };
}

export function getTicketColumns(
  actions: TicketTableActionProps,
): ColumnDef<Ticket>[] {
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
                <Link to={`/tickets/${ticket.id}`}>{ticket.title}</Link>
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
      id: "client",
      accessorKey: "client_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Client
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">
              {ticket.client_name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {ticket.client_email}
            </div>
          </div>
        );
      },
    },
    {
      id: "holder",
      accessorKey: "holder.name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Holder
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const holder = row.original.holder;
        return (
          <div className="flex items-center gap-2">
            <UserAvatar name={holder?.name || "Unassigned"} size="sm" />
            <span className="text-sm text-muted-foreground truncate">
              {holder?.name || "Unassigned"}
            </span>
          </div>
        );
      },
    },
    {
      id: "staff",
      accessorKey: "staff.name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Staff
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
        return (
          <div className="flex items-center gap-2">
            <Link to={`/tickets/${ticket.id}`}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Eye className="h-4 w-4" />
                View
              </div>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => actions.onEdit(ticket)}
                  disabled={
                    actions.isLoadingStates.update ||
                    ticket.status === "complete" ||
                    ticket.status === "archived"
                  }
                >
                  {actions.isLoadingStates.update ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Edit className="h-4 w-4 mr-2" />
                  )}
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => actions.onAssign(ticket)}
                  disabled={
                    actions.isLoadingStates.assign ||
                    ticket.status === "complete" ||
                    ticket.status === "archived"
                  }
                >
                  {actions.isLoadingStates.assign ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Assign
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => actions.onStatusChange(ticket)}
                  disabled={
                    actions.isLoadingStates.changeStatus ||
                    ticket.status === "archived"
                  }
                >
                  {actions.isLoadingStates.changeStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Change Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
