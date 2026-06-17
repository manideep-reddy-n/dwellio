import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConsolidatedOpsDashboard } from "@/components/operations/consolidated-ops-dashboard";
import type { OrganizationMetrics } from "@/types/api/dashboard";

const revenueMetrics: OrganizationMetrics = {
  organizationId: "org-1",
  accommodationMode: "BED_BASED",
  activeResidentCount: 12,
  avgRating: 4.2,
  reviewCount: 8,
  avgResolutionDays: 2,
  resolutionRate: 90,
  openComplaintCount: 1,
  avgFirstResponseHours: 4,
  complaintCategoryDistribution: [],
  satisfactionScore: 82,
  searchRankScore: 75,
  totalRooms: 10,
  vacantRooms: 2,
  partialRooms: 1,
  occupiedRooms: 7,
  blockedRooms: 0,
  totalBeds: 20,
  availableBeds: 4,
  occupiedBeds: 16,
  blockedBeds: 0,
  totalUnits: null,
  availableUnits: null,
  occupiedUnits: null,
  blockedUnits: null,
  occupancyRate: 80,
  expectedRevenueMonth: 96000,
  collectedRevenueMonth: 72000,
  outstandingRevenueMonth: 24000,
  collectionRate: 75,
  defaultersCount: 2,
  revenueTrend: [
    { month: "2026-01-01", expected: 90000, collected: 85000 },
    { month: "2026-02-01", expected: 92000, collected: 88000 },
  ],
  forecastRevenueNextMonth: 98000,
  moveInsMonth: 3,
  moveOutsMonth: 1,
  avgStayDays: 120,
  turnoverRate: 8,
  pendingPaymentsCount: 5,
  slaFirstResponseHours: 24,
  slaResolutionHours: 72,
  slaComplianceRate: 95,
  slaViolationsCount: 0,
  reopenedComplaintsCount: 0,
  avgBreakfastRating: null,
  avgLunchRating: null,
  avgDinnerRating: null,
  mealRatingsTrend: [],
  refreshedAt: "2026-06-01T00:00:00Z",
};

describe("ConsolidatedOpsDashboard", () => {
  it("renders revenue KPI cards when revenue metrics are present", () => {
    render(
      <ConsolidatedOpsDashboard
        metrics={revenueMetrics}
        orgSlug="demo-hostel"
        orgType="HOSTEL"
        orgVerified
      />,
    );

    expect(screen.getByText("Financial operations")).toBeInTheDocument();
    expect(screen.getByText("Expected (month)")).toBeInTheDocument();
    expect(screen.getByText("₹96,000")).toBeInTheDocument();
    expect(screen.getByText("Collected (month)")).toBeInTheDocument();
    expect(screen.getByText("₹72,000")).toBeInTheDocument();
    expect(screen.getByText("2 defaulters")).toBeInTheDocument();
    expect(screen.getByText("Revenue trend (6 months)")).toBeInTheDocument();
  });
});
