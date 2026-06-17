import type { ComplaintCategory, ComplaintPriority, ComplaintStatus } from "@/types/enums";

export type ComplaintSlaBreachType = "FIRST_RESPONSE" | "RESOLUTION";

export interface ComplaintSlaBreachItem {
  id: string;
  title: string;
  status: ComplaintStatus;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  createdAt: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  breachTypes: ComplaintSlaBreachType[];
}

export interface ComplaintSlaSummary {
  slaFirstResponseHours: number;
  slaResolutionHours: number;
  totalComplaints: number;
  violationsCount: number;
  slaComplianceRate: number | null;
  reopenedComplaintsCount: number;
  breachedComplaints: ComplaintSlaBreachItem[];
}
