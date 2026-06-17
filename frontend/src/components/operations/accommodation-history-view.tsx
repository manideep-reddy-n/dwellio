"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/format/datetime";
import { formatInr } from "@/lib/format/currency";
import type { StaffOccupancy } from "@/types/api/accommodation";

interface AccommodationHistoryViewProps {
  records: StaffOccupancy[] | undefined;
  isLoading?: boolean;
  showResident?: boolean;
}

const classificationLabels: Record<NonNullable<StaffOccupancy["occupancyClassification"]>, string> = {
  RESIDENT: "Resident",
  OWNER_OCCUPIED: "Owner occupied",
  TENANT_OCCUPIED: "Tenant occupied",
  VACANT: "Vacant",
};

export function AccommodationHistoryView({
  records,
  isLoading,
  showResident,
}: AccommodationHistoryViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!records?.length) {
    return <EmptyState title="No accommodation history" description="Past and current stays will appear here." />;
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <Card key={record.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              {showResident && <p className="font-medium">{record.residentName}</p>}
              <p className="text-sm">
                {record.bedLabel ?? record.unitIdentifier ?? "—"}
                {record.monthlyRent != null && (
                  <span className="text-muted-foreground"> · {formatInr(record.monthlyRent)}/mo</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(record.moveInDate)}
                {record.moveOutDate ? ` → ${formatDate(record.moveOutDate)}` : " → present"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {record.occupancyClassification && (
                <Badge variant="outline">
                  {classificationLabels[record.occupancyClassification]}
                </Badge>
              )}
              <Badge variant={record.current ? "default" : "secondary"}>
                {record.current ? "Current" : "Past"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
