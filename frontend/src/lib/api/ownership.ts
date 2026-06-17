import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";

export type BillingResponsibility = "OWNER" | "TENANT" | "RESIDENT";

export interface OwnershipRecord {
  id: string;
  unitSpaceId: string;
  unitIdentifier: string;
  ownerName: string;
  ownerEmail: string | null;
  ownerPhone: string | null;
  billingResponsibility: BillingResponsibility;
  effectiveFrom: string;
  effectiveTo: string | null;
  notes: string | null;
}

export interface CreateOwnershipInput {
  unitSpaceId: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  billingResponsibility: BillingResponsibility;
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
}

export const ownershipApi = {
  list: (orgId: string, unitSpaceId?: string) => {
    const qs = unitSpaceId ? `?unitSpaceId=${unitSpaceId}` : "";
    return apiRequest<OwnershipRecord[]>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/ownership${qs}`,
    );
  },

  create: (orgId: string, body: CreateOwnershipInput) =>
    apiRequest<OwnershipRecord>(apiConfig.baseUrl, `/organizations/${orgId}/ownership`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
