"use client";

import { Mail, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { membershipsApi } from "@/lib/api/memberships";

interface PropertyTeamCardProps {
  orgId: string | undefined;
  title?: string;
}

export function PropertyTeamCard({ orgId, title = "Property team" }: PropertyTeamCardProps) {
  const { authReady } = useAuthReady();
  const { data: team = [], isLoading } = useQuery({
    queryKey: orgId ? ["org-team", orgId] : ["org-team", "disabled"],
    queryFn: () => membershipsApi.team(orgId!),
    enabled: authReady && Boolean(orgId),
  });

  if (!orgId) return null;
  if (isLoading) return <Skeleton className="h-32 w-full rounded-xl" />;
  if (team.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Contact your property team for maintenance, billing, or emergencies.
        </p>
        <ul className="divide-y rounded-lg border">
          {team.map((member) => (
            <li key={`${member.email}-${member.roleName}`} className="space-y-1 px-3 py-3 text-sm">
              <p className="font-medium">
                {member.fullName}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {member.ownerRole ? "Owner" : member.roleName}
                </span>
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Mail className="size-3" />
                  {member.email}
                </span>
                {member.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3" />
                    {member.phone}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
