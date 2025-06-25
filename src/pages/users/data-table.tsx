"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  columnVisibility: VisibilityState;
  setColumnVisibility: (columnVisibility: VisibilityState) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  isError = false,
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
  columnVisibility,
  setColumnVisibility,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: (updaterOrValue) => {
      if (typeof updaterOrValue === "function") {
        setColumnVisibility(updaterOrValue(columnVisibility));
      } else {
        setColumnVisibility(updaterOrValue);
      }
    },
    onSortingChange: setSorting,
    state: {
      sorting,
      pagination: {
        pageIndex: page - 1,
        pageSize: perPage,
      },
      columnVisibility,
    },
    manualPagination: true,
    pageCount: Math.ceil(total / perPage),
  });

  // Pagination logic
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / perPage)),
    [total, perPage],
  );

  // Helper for pagination buttons
  function renderPageButtons() {
    if (totalPages <= 1) return null;

    const PaginationButton = ({
      label,
      active,
      onClick,
    }: {
      label: string;
      active?: boolean;
      onClick?: () => void;
    }) => (
      <button
        onClick={onClick}
        className={`px-2 py-1 text-sm rounded border ${
          active
            ? "bg-white border-primary"
            : "text-muted-foreground hover:bg-muted/70"
        } transition-colors`}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </button>
    );

    const buttons: React.ReactNode[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <PaginationButton
            key={i}
            label={i.toString()}
            active={i === page}
            onClick={() => onPageChange(i)}
          />,
        );
      }
    } else {
      const showStartEllipsis = page > 3;
      const showEndEllipsis = page < totalPages - 2;

      // Always show first page
      buttons.push(
        <PaginationButton
          key={1}
          label="1"
          active={page === 1}
          onClick={() => onPageChange(1)}
        />,
      );

      if (showStartEllipsis) {
        buttons.push(
          <span
            key="start-ellipsis"
            className="px-2 text-sm text-muted-foreground"
          >
            ...
          </span>,
        );
      }

      // Show up to 3 middle pages (ensure current page always shown)
      for (let i = page - 1; i <= page + 1; i++) {
        if (i > 1 && i < totalPages) {
          buttons.push(
            <PaginationButton
              key={i}
              label={i.toString()}
              active={i === page}
              onClick={() => onPageChange(i)}
            />,
          );
        }
      }

      if (showEndEllipsis) {
        buttons.push(
          <span
            key="end-ellipsis"
            className="px-2 text-sm text-muted-foreground"
          >
            ...
          </span>,
        );
      }

      // Always show last page
      buttons.push(
        <PaginationButton
          key={totalPages}
          label={totalPages.toString()}
          active={page === totalPages}
          onClick={() => onPageChange(totalPages)}
        />,
      );
    }

    return <div className="flex gap-1 flex-wrap">{buttons}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-b-xl">
      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap px-6 py-3 text-sm font-semibold text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(perPage)].map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j} className="px-6 py-3">
                      <Skeleton className="h-6 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                    <span className="text-red-500">Failed to load data.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/60 transition-colors group"
                >
                  {row.getVisibleCells().map((cell, idx) => (
                    <TableCell
                      key={cell.id}
                      className={`px-6 py-3 whitespace-nowrap ${idx === 1 ? "truncate max-w-[200px]" : "truncate max-w-[240px]"} `}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 py-4">
        <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
          Showing {total === 0 ? 0 : (page - 1) * perPage + 1} to{" "}
          {Math.min(page * perPage, total)} of {total} results
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm">Rows per page</span>
          <Select
            value={perPage.toString()}
            onValueChange={(v) => onPerPageChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-[70px] rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            className="px-2 py-1 text-sm border rounded disabled:opacity-50 bg-white hover:bg-muted/70"
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            &lt;
          </button>
          {renderPageButtons()}
          <button
            className="px-2 py-1 text-sm border rounded disabled:opacity-50 bg-white hover:bg-muted/70"
            onClick={() => onPageChange(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
