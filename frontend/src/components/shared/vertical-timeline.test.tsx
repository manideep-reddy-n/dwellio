import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VerticalTimeline } from "@/components/shared/vertical-timeline";
import type { ActivityEvent } from "@/lib/api/timeline";

const sampleEvents: ActivityEvent[] = [
  {
    id: "evt-1",
    membershipId: "mem-1",
    residentName: "Asha Kumar",
    eventCategory: "BILLING",
    eventType: "CHARGE_GENERATED",
    title: "Charge generated",
    description: "Monthly rent — ₹8,000",
    metadata: {},
    occurredAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "evt-2",
    membershipId: "mem-1",
    residentName: "Asha Kumar",
    eventCategory: "ACCOMMODATION",
    eventType: "OCCUPANCY_ALLOCATED",
    title: "Allocated to bed",
    description: "Bed A, Room 101",
    metadata: {},
    occurredAt: "2026-06-01T09:00:00Z",
  },
];

describe("VerticalTimeline", () => {
  it("renders empty state when there are no events", () => {
    render(<VerticalTimeline events={[]} />);
    expect(screen.getByText("No activity recorded yet.")).toBeInTheDocument();
  });

  it("renders event titles and descriptions", () => {
    render(<VerticalTimeline events={sampleEvents} showResident />);
    expect(screen.getByText("Charge generated")).toBeInTheDocument();
    expect(screen.getByText("Monthly rent — ₹8,000")).toBeInTheDocument();
    expect(screen.getByText("Allocated to bed")).toBeInTheDocument();
    expect(screen.getAllByText("Asha Kumar")).toHaveLength(2);
  });
});
