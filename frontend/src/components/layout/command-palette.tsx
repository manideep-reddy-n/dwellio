"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Megaphone,
  Search,
  Users,
  Wrench,
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
import { useMyMemberships } from "@/hooks/use-memberships";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";
import { buildCommandItems } from "@/lib/navigation/command-items";
import { useOrgStore } from "@/stores/org-store";
import { useUiStore } from "@/stores/ui-store";

const orgIcons = [Building2, Users, Wrench, Megaphone];

export function CommandPalette() {
  const router = useRouter();
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const activeOrg = useOrgStore((s) => s.activeOrg);
  const { data: memberships = [] } = useMyMemberships();
  const { permissions, isOwner } = usePermissions();
  const { user } = useAuth();

  const navItems = useMemo(
    () => buildCommandItems(activeOrg?.slug, permissions, isOwner, user?.platformAdmin),
    [activeOrg?.slug, permissions, isOwner, user?.platformAdmin],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        useUiStore.getState().toggleCommandPalette();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router, setOpen],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Search organizations and navigate"
    >
      <CommandInput placeholder="Search organizations, pages, complaints…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {memberships.length > 0 && (
          <CommandGroup heading="Organizations">
            {memberships.map((membership, index) => (
              <CommandItem
                key={membership.organizationId}
                value={`${membership.organizationName} ${membership.organizationSlug} ${membership.roleName}`}
                onSelect={() =>
                  navigate(`/app/${membership.organizationSlug}/operations/live`)
                }
              >
                {(() => {
                  const Icon = orgIcons[index % orgIcons.length];
                  return <Icon className="size-4 text-muted-foreground" />;
                })()}
                <span className="flex-1">{membership.organizationName}</span>
                <span className="text-xs text-muted-foreground">{membership.roleName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          {navItems.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.label} ${item.keywords ?? ""}`}
              onSelect={() => navigate(item.href)}
            >
              <Search className="size-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
