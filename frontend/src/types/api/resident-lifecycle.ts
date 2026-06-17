import type { StaffOccupancy } from "@/types/api/accommodation";
import type { MembershipStatus } from "@/types/api/membership";
import type { PaymentRecord } from "@/lib/api/payments";
import type { LedgerEntry } from "@/lib/api/ledger";
import type { Review } from "@/types/api/review";
import type { ComplaintCategory, ComplaintPriority, ComplaintStatus } from "@/types/enums";

export interface ResidentLifecycleMembership {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userPhone: string | null;
  roleName: string;
  status: MembershipStatus;
  joinedAt: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export interface ResidentFinancialSummary {
  outstandingBalance: number;
  pendingPaymentsCount: number;
  totalBilled: number;
  totalPaid: number;
}

export interface ResidentComplaintSummary {
  id: string;
  title: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  createdAt: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  slaBreached?: boolean;
}

export interface ResidentComplaintMetrics {
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
  avgFirstResponseHours: number | null;
  avgResolutionDays: number | null;
}

export interface ResidentLifecycleProfile {
  membership: ResidentLifecycleMembership;
  currentOccupancy: StaffOccupancy | null;
  accommodationHistory: StaffOccupancy[];
  financialSummary: ResidentFinancialSummary;
  payments: PaymentRecord[];
  ledgerEntries: LedgerEntry[];
  complaints: ResidentComplaintSummary[];
  complaintMetrics: ResidentComplaintMetrics;
  reviews: Review[];
}
