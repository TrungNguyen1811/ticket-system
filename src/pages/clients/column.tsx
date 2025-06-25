import { Client } from "@/types/user";
import { ColumnDef } from "@tanstack/react-table";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, ArrowUpDown, Eye } from "lucide-react";
import { Link } from "react-router-dom";

export function getUserColumns(): ColumnDef<Client>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Full name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar name={user.name} />
            <div className="">
              <div className="font-medium truncate">{user.name}</div>
            </div>
          </div>
        );
      },
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <span className="text-muted-foreground truncate block">
            {row.original.email}
          </span>
        );
      },
    },
    {
      id: "tickets",
      accessorKey: "tickets",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tickets
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const tickets = row.original.tickets_count;
        return (
          <Badge className="bg-blue-100 text-blue-800" variant="outline">
            {tickets} Tickets
          </Badge>
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
          >
            Created At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: () => (
        <span className="text-muted-foreground text-xs">June 18th, 2025</span>
      ),
    },
    // {
    //   id: "updated_at",
    //   accessorKey: "updated_at",
    //   header: ({ column }) => {
    //     return (
    //       <Button
    //         variant="ghost"
    //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //       >
    //         Updated At
    //         <ArrowUpDown className="ml-2 h-4 w-4" />
    //       </Button>
    //     )
    //   },
    //   cell: ({ row }) => (
    //     <span className="text-muted-foreground text-xs">{format(row.original.updated_at, "PPP")}</span>
    //   )
    // },

    {
      id: "actions",
      header: () => (
        <div className="flex items-center gap-2 min-w-0">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground truncate block max-w-[180px]">
            Actions
          </span>
        </div>
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 border rounded-md p-1 cursor-pointer px-2 transition-colors duration-200">
              <Link to={`/communication/clients/${user.id}`}>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  View all Tickets
                </div>
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
