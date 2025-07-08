import { User } from "@/types/user";
import { ColumnDef } from "@tanstack/react-table";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Pencil, Trash, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface UserTableActionProps {
  onUpdateRole: (user: User) => void;
  onDeactivate: (user: User) => void;
}

export function getUserColumns(
  actions: UserTableActionProps,
): ColumnDef<User>[] {
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
              <div className="text-xs text-muted-foreground truncate">
                ID: {user.id}
              </div>
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
      id: "role",
      accessorKey: "role",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Role
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const role = row.original.role;
        let color =
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
        if (role === "admin")
          color = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
        if (role === "user")
          color =
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
        return (
          <Badge className={color} variant="secondary">
            {role}
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
      cell: ({ row }) => {
        const dateString = row.original.created_at;
        if (!dateString) {
          return <span className="text-muted-foreground text-xs">N/A</span>;
        }
        
        try {
          const date = parseISO(dateString);
          return (
            <span className="text-muted-foreground text-xs">
              {format(date, "MMM dd, yyyy, hh:mm a")}
            </span>
          );
        } catch (error) {
          return <span className="text-muted-foreground text-xs">Invalid date</span>;
        }
      },
    },
    {
      id: "updated_at",
      accessorKey: "updated_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Updated At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const dateString = row.original.updated_at;
        if (!dateString) {
          return <span className="text-muted-foreground text-xs">N/A</span>;
        }
        
        try {
          const date = parseISO(dateString);
          return (
            <span className="text-muted-foreground text-xs">
              {format(date, "MMM dd, yyyy, hh:mm a")}
            </span>
          );
        } catch (error) {
          return <span className="text-muted-foreground text-xs">Invalid date</span>;
        }
      },
    },

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
        const [hoveredItem, setHoveredItem] = useState<string | null>(null);
        return (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem className={`action-button ${hoveredItem === "edit" ? "hovered" : ""}`}
                    onMouseEnter={() => setHoveredItem("edit")}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => actions.onUpdateRole(user)}
                >
                <div className="icon-container">
                  <div className="hover-icon text-blue-500">
                    <Pencil className="h-4 w-4" />
                  </div>
                  <div className="default-icon">
                    <Pencil className="h-4 w-4" />
                  </div>
                </div>
                <span className="text-muted-foreground truncate block max-w-[180px] ml-1 p-1">
                  Edit
                </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => actions.onDeactivate(user)}
                  className={`action-button ${hoveredItem === "delete" ? "hovered" : ""}`}
                  onMouseEnter={() => setHoveredItem("delete")}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                    <div className="icon-container mr-2">
                      <div className="hover-icon text-red-500">
                        <Trash className="h-4 w-4" />
                      </div>
                      <div className="default-icon">
                        <Trash className="h-4 w-4" />
                      </div>
                    </div>
                  <span className="">
                    Delete
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          // <div className="flex items-center gap-4">
          //   {/* EDIT BUTTON */}

          //   {/* Icon xanh khi hover */}
          //   <div
          //     className={`action-button ${hovered ? "hovered" : ""}`}
          //     onMouseEnter={() => setHovered(true)}
          //     onMouseLeave={() => setHovered(false)}
          //   >
          //     <div
          //       className="flex flex-row items-center border rounded-md px-2 cursor-pointer hover:bg-slate-200"
          //       onClick={() => actions.onUpdateRole(user)}
          //     >
          //       <div className="icon-container">
          //         <div className="hover-icon text-blue-500">
          //           <Pencil className="h-4 w-4" />
          //         </div>
          //         <div className="default-icon">
          //           <Pencil className="h-4 w-4" />
          //         </div>
          //       </div>
          //       <span className="text-muted-foreground truncate block max-w-[180px] ml-1 p-1">
          //         Edit
          //       </span>
          //     </div>
          //   </div>

          //   {/* DELETE BUTTON */}
          //   {/* <div className="flex items-center gap-1 border rounded-md p-1 cursor-pointer px-2 transition-colors duration-200">
          //     <div onClick={() => actions.onDeactivate(user)}>
          //       <Trash className="h-4 w-4" />
          //     </div>
          //     <span className="text-muted-foreground truncate block max-w-[180px]">
          //       Delete
          //     </span>
          //   </div> */}
          //   <div
          //     className={`action-button ${hoveredDelete ? "hovered" : ""}`}
          //     onMouseEnter={() => setHoveredDelete(true)}
          //     onMouseLeave={() => setHoveredDelete(false)}
          //   >
          //     <div
          //       className="flex flex-row items-center border rounded-md px-2 cursor-pointer hover:bg-slate-200"
          //       onClick={() => actions.onDeactivate(user)}
          //     >
          //       <div className="icon-container">
          //         <div className="hover-icon text-red-500">
          //           <Trash className="h-4 w-4" />
          //         </div>
          //         <div className="default-icon">
          //           <Trash className="h-4 w-4" />
          //         </div>
          //       </div>
          //       <span className="text-muted-foreground truncate block max-w-[180px] ml-1 p-1">
          //         Delete
          //       </span>
          //     </div>
          //   </div>
          // </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
