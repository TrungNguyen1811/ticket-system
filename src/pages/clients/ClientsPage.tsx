"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { DataTable } from "./data-table";
import { getUserColumns } from "./column";
import { VisibilityState } from "@tanstack/react-table";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const {
    data: clients,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: () => userService.getClients({}),
  });

  const filteredClients = clients?.data?.data?.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const total = clients?.data?.pagination?.total || 0;

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">
          Manage your client organizations
        </p>
      </div>
      <div className="">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-2 py-4 bg-muted/50 rounded-t-xl">
          {/* Search & Filter */}
          <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
            {/* Search input */}
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

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
                {getUserColumns().map((column) => {
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
            columns={getUserColumns()}
            data={filteredClients || []}
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
    </div>
  );
}
