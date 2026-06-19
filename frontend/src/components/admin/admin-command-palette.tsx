"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CircleDollarSign,
  MessageSquareWarning,
  Search,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { adminPlatformApi, type AdminSearchHit } from "@/lib/api/admin-platform";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  USER: Users,
  ORGANIZATION: Building2,
  RESIDENT: UserCheck,
  PAYMENT: CircleDollarSign,
  COMPLAINT: MessageSquareWarning,
  REVIEW: Star,
};

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminCommandPalette({ open, onOpenChange }: AdminCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      void adminPlatformApi
        .search(query.trim())
        .then((data) => {
          setResults([
            ...data.users,
            ...data.organizations,
            ...data.residents,
            ...data.payments,
            ...data.complaints,
            ...data.reviews,
          ]);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open]);

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  const grouped = {
    users: results.filter((r) => r.type === "USER"),
    organizations: results.filter((r) => r.type === "ORGANIZATION"),
    residents: results.filter((r) => r.type === "RESIDENT"),
    payments: results.filter((r) => r.type === "PAYMENT"),
    complaints: results.filter((r) => r.type === "COMPLAINT"),
    reviews: results.filter((r) => r.type === "REVIEW"),
  };

  function renderGroup(label: string, hits: AdminSearchHit[]) {
    if (hits.length === 0) return null;
    return (
      <CommandGroup heading={label}>
        {hits.map((hit) => {
          const Icon = typeIcons[hit.type] ?? Search;
          return (
            <CommandItem
              key={`${hit.type}-${hit.id}`}
              value={`${hit.type} ${hit.title} ${hit.subtitle}`}
              onSelect={() => navigate(hit.href)}
            >
              <Icon className="size-4 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{hit.title}</span>
                <span className="truncate text-xs text-muted-foreground">{hit.subtitle}</span>
              </div>
            </CommandItem>
          );
        })}
      </CommandGroup>
    );
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Platform search"
      description="Search users, organizations, payments, complaints, and reviews"
    >
      <CommandInput
        placeholder="Search the Dwellio ecosystem…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Searching…</p>}
        {!loading && query.trim().length < 2 && (
          <CommandEmpty>Type at least 2 characters to search across the platform.</CommandEmpty>
        )}
        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <CommandEmpty>No matches for &ldquo;{query}&rdquo;</CommandEmpty>
        )}
        {!loading && results.length > 0 && (
          <>
            {renderGroup("Users", grouped.users)}
            {renderGroup("Organizations", grouped.organizations)}
            {renderGroup("Residents", grouped.residents)}
            {renderGroup("Payments", grouped.payments)}
            {renderGroup("Complaints", grouped.complaints)}
            {renderGroup("Reviews", grouped.reviews)}
            <CommandSeparator />
            <CommandGroup heading="Quick navigation">
              <CommandItem onSelect={() => navigate("/admin/overview")}>Mission Control</CommandItem>
              <CommandItem onSelect={() => navigate("/admin/organizations")}>Organizations</CommandItem>
              <CommandItem onSelect={() => navigate("/admin/verification-requests")}>
                Verification queue
              </CommandItem>
              <CommandItem onSelect={() => navigate("/admin/configuration")}>Configuration</CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
