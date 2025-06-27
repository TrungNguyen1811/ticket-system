"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Search } from "lucide-react";
import type { User } from "@/types/user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useDebounce } from "@/utils/useDebouce";
import { getUserColumns } from "./column";
import { DataTable } from "./data-table";
import { VisibilityState } from "@tanstack/react-table";

const ROLE_OPTIONS = [
  {
    value: "admin" as const,
    label: "Admin",
    description: "Full system access and control",
  },
  {
    value: "user" as const,
    label: "User",
    description: "Standard user access",
  },
];

type UserRole = "admin" | "user";

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [newRole, setNewRole] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  // Fetch users with React Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ["users", page, perPage, debouncedSearchTerm, selectedRole],
    queryFn: () =>
      userService.getUsers({
        limit: perPage,
        page,
        isPaginate: true,
        role: selectedRole === "all" ? undefined : selectedRole,
        search: debouncedSearchTerm,
      }),
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: (data: { userId: string; role: UserRole; _method: "PUT" }) =>
      userService.updateUserRole(data.userId, {
        role: data.role,
        _method: data._method,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Role updated",
        description: response.message,
      });
      setIsRoleDialogOpen(false);
      setIsConfirmDialogOpen(false);
      setSelectedUser(null);
      setNewRole("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response.data.message,
        variant: "destructive",
      });
    },
  });

  // Action callbacks for DataTable
  const handleRoleUpdate = (user: User) => {
    setSelectedUser(user);
    setNewRole((user.role as UserRole) || "");
    setIsRoleDialogOpen(true);
  };
  const handleDeactivate = (user: User) => {
    toast({
      title: "Deactivate User",
      description: `Feature not implemented for ${user.name}`,
      variant: "destructive",
    });
  };

  const columns = getUserColumns({
    onUpdateRole: handleRoleUpdate,
    onDeactivate: handleDeactivate,
  });

  const total = data && data.data ? data.data.pagination?.total || 0 : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">User management</h1>
        <p className="text-muted-foreground">
          Manage your users and their account permissions here
        </p>
      </div>
      <div className="rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-2 py-4 bg-muted/50 rounded-t-xl">
          {/* Search & Filter */}
          <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
            {/* Search input */}
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Role select */}
            <Select
              value={selectedRole}
              onValueChange={(value: UserRole | "all") => {
                setSelectedRole(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            {/* Column visibility toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="ml-auto bg-white border border-gray-200 shadow-sm w-24 hover:bg-white hover:border-secondary-300 hover:shadow-none"
                >
                  Hidden
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {columns
                  .filter((column) => column.id !== "actions")
                  .map((column) => {
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
          </div>
        </div>

        <div className="p-0">
          <DataTable
            columns={columns}
            data={data && data.data ? data.data.data : []}
            isLoading={isLoading}
            isError={isError}
            page={page}
            perPage={perPage}
            total={total}
            onPageChange={setPage}
            onPerPageChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
          />
        </div>
      </div>

      {/* Role Update Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.name}. This will affect their
              system permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newRole}
                onValueChange={(value: UserRole | "") => setNewRole(value)}
              >
                <SelectTrigger className="h-14">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">
                          {role.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {role.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsRoleDialogOpen(false);
                setIsConfirmDialogOpen(true);
              }}
              disabled={!newRole || newRole === selectedUser?.role}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change {selectedUser?.name}'s role from{" "}
              <Badge
                variant="secondary"
                className={
                  selectedUser?.role === "admin"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                }
              >
                {selectedUser?.role}
              </Badge>{" "}
              to{" "}
              <Badge
                variant="secondary"
                className={
                  newRole === "admin"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                }
              >
                {newRole}
              </Badge>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUser && newRole) {
                  updateRoleMutation.mutate({
                    userId: selectedUser.id,
                    role: newRole as UserRole,
                    _method: "PUT",
                  });
                }
              }}
              disabled={updateRoleMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {updateRoleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Role"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
