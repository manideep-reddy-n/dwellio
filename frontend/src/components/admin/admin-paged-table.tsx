"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";

interface AdminPagedTableProps {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  columns: string[];
  rows: React.ReactNode[][];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
}

export function AdminPagedTable({
  isLoading,
  isError,
  onRetry,
  columns,
  rows,
  page,
  totalPages,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
}: AdminPagedTableProps) {
  const [localSearch, setLocalSearch] = useState(searchValue ?? "");

  if (isError) return <ErrorState onRetry={onRetry} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onSearchChange && (
          <Input
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearchChange(localSearch);
            }}
            className="max-w-sm"
          />
        )}
        <div className="flex flex-wrap items-center gap-2">
          {filters}
          {onSearchChange && (
            <Button variant="secondary" size="sm" onClick={() => onSearchChange(localSearch)}>
              Search
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 font-medium text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-3">
                      <Skeleton className="h-4 w-full max-w-[12rem]" />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                  No results
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((cells, i) => (
                <tr key={i} className={cn("border-b last:border-0", i % 2 === 1 && "bg-muted/20")}>
                  {cells.map((cell, j) => (
                    <td key={j} className="px-3 py-2 align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 0}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
