import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LedgerView } from "@/components/operations/ledger-view";
import type { LedgerEntry } from "@/lib/api/ledger";

const sampleEntries: LedgerEntry[] = [
  {
    id: "entry-2",
    membershipId: "mem-1",
    residentName: "Asha Kumar",
    paymentId: "pay-1",
    entryType: "PAYMENT_RECEIVED",
    amount: 8000,
    balanceAfter: 0,
    description: "Monthly rent",
    referenceMonth: "2026-06-01",
    createdAt: "2026-06-05T10:00:00Z",
  },
  {
    id: "entry-1",
    membershipId: "mem-1",
    residentName: "Asha Kumar",
    paymentId: "pay-1",
    entryType: "CHARGE_GENERATED",
    amount: 8000,
    balanceAfter: 8000,
    description: "Monthly rent",
    referenceMonth: "2026-06-01",
    createdAt: "2026-06-01T10:00:00Z",
  },
];

describe("LedgerView", () => {
  it("shows empty state without entries", () => {
    render(<LedgerView entries={[]} />);
    expect(screen.getByText("No ledger entries")).toBeInTheDocument();
  });

  it("shows current balance and entry rows", () => {
    render(<LedgerView entries={sampleEntries} showResident />);
    expect(screen.getByText("Current balance")).toBeInTheDocument();
    expect(screen.getAllByText("₹0").length).toBeGreaterThan(0);
    expect(screen.getByText("Payment")).toBeInTheDocument();
    expect(screen.getByText("Charge")).toBeInTheDocument();
    expect(screen.getAllByText("Asha Kumar")).toHaveLength(2);
  });
});
