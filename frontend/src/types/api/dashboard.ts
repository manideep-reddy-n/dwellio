import type { AccommodationMode, ComplaintCategory } from "@/types/enums";

export interface ComplaintCategoryCount {
  category: ComplaintCategory;
  count: number;
}

export interface OrganizationMetrics {
  organizationId: string;
  accommodationMode: AccommodationMode;
  activeResidentCount: number;
  avgRating: number | null;
  reviewCount: number;
  avgResolutionDays: number | null;
  resolutionRate: number | null;
  openComplaintCount: number;
  avgFirstResponseHours: number | null;
  complaintCategoryDistribution: ComplaintCategoryCount[];
  satisfactionScore: number | null;
  searchRankScore: number | null;
  totalRooms: number | null;
  vacantRooms: number | null;
  partialRooms: number | null;
  occupiedRooms: number | null;
  blockedRooms: number | null;
  totalBeds: number | null;
  availableBeds: number | null;
  occupiedBeds: number | null;
  blockedBeds: number | null;
  totalUnits: number | null;
  availableUnits: number | null;
  occupiedUnits: number | null;
  blockedUnits: number | null;
  occupancyRate: number | null;
  refreshedAt: string;
}
