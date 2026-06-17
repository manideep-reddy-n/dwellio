import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";

export type LedgerEntryType =
  | "CHARGE_GENERATED"
  | "PAYMENT_RECEIVED"
  | "REFUND"
  | "PENALTY_APPLIED"
  | "ADJUSTMENT";

export interface LedgerEntry {
  id: string;
  membershipId: string;
  residentName: string;
  paymentId: string | null;
  entryType: LedgerEntryType;
  amount: number;
  balanceAfter: number;
  description: string | null;
  referenceMonth: string | null;
  createdAt: string;
}

export const ledgerApi = {
  list: (orgId: string, membershipId?: string) => {
    const qs = membershipId ? `?membershipId=${membershipId}` : "";
    return apiRequest<LedgerEntry[]>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/ledger${qs}`,
    );
  },

  listMine: (orgId: string) =>
    apiRequest<LedgerEntry[]>(apiConfig.baseUrl, `/organizations/${orgId}/ledger/mine`),
};
