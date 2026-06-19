"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPagedTable } from "@/components/admin/admin-paged-table";
import { adminPlatformApi } from "@/lib/api/admin-platform";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");

  const users = useQuery({
    queryKey: ["admin", "users", page, query],
    queryFn: () => adminPlatformApi.listUsers({ page, size: 20, query }),
  });

  const action = useMutation({
    mutationFn: ({ userId, type }: { userId: string; type: "suspend" | "activate" | "ban" }) => {
      if (type === "suspend") return adminPlatformApi.suspendUser(userId);
      if (type === "ban") return adminPlatformApi.banUser(userId);
      return adminPlatformApi.activateUser(userId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User updated");
    },
    onError: () => toast.error("Action failed"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-muted-foreground">Platform-wide user directory and account controls.</p>
      </div>

      <AdminPagedTable
        isLoading={users.isLoading}
        isError={users.isError}
        onRetry={() => void users.refetch()}
        columns={["Name", "Email", "Status", "Actions"]}
        page={page}
        totalPages={users.data?.totalPages ?? 1}
        onPageChange={setPage}
        searchValue={query}
        onSearchChange={(v) => {
          setQuery(v);
          setPage(0);
        }}
        rows={
          users.data?.content.map((user) => [
            <span key="name" className="font-medium">
              <Link href={`/admin/users/${user.id}`} className="hover:text-teal-700 hover:underline">
                {user.fullName}
              </Link>
            </span>,
            user.email,
            <Badge key="status" variant={user.active ? "default" : "destructive"}>
              {user.active ? "Active" : "Suspended"}
              {user.platformAdmin ? " · Admin" : ""}
            </Badge>,
            <div key="actions" className="flex flex-wrap gap-1">
              {user.active ? (
                <>
                  <Button size="sm" variant="outline" disabled={action.isPending} onClick={() => action.mutate({ userId: user.id, type: "suspend" })}>
                    Suspend
                  </Button>
                  <Button size="sm" variant="destructive" disabled={action.isPending} onClick={() => action.mutate({ userId: user.id, type: "ban" })}>
                    Ban
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" disabled={action.isPending} onClick={() => action.mutate({ userId: user.id, type: "activate" })}>
                  Activate
                </Button>
              )}
            </div>,
          ]) ?? []
        }
      />
    </div>
  );
}
