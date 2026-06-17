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
  expectedRevenueMonth: number | null;
  collectedRevenueMonth: number | null;
  outstandingRevenueMonth: number | null;
  collectionRate: number | null;
  defaultersCount: number;
  revenueTrend: RevenueTrendPoint[];
  forecastRevenueNextMonth: number | null;
  moveInsMonth: number;
  moveOutsMonth: number;
  avgStayDays: number | null;
  turnoverRate: number | null;
  pendingPaymentsCount: number;
  slaFirstResponseHours: number;
  slaResolutionHours: number;
  slaComplianceRate: number | null;
  slaViolationsCount: number;
  reopenedComplaintsCount: number;
  avgBreakfastRating: number | null;
  avgLunchRating: number | null;
  avgDinnerRating: number | null;
  mealRatingsTrend: MealRatingTrendPoint[];
  refreshedAt: string;
}

export interface MealRatingTrendPoint {
  date: string;
  avgRating: number | null;
}

export interface RevenueTrendPoint {
  month: string;
  expected: number;
  collected: number;
}
