import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";

export type BillingMode = "CALENDAR_MONTH" | "OCCUPANCY_ANCHOR" | "CUSTOM_DAY";
export type BillingAppliesTo = "ALL_ACTIVE_OCCUPANCIES" | "ALL_ACTIVE_UNITS";
export type BillingRecurrence = "MONTHLY" | "ONE_TIME";
export type BillingBillTo = "RESIDENT" | "OWNER" | "TENANT";
export type BillingChargeType =
  | "RENT"
  | "MAINTENANCE"
  | "UTILITY"
  | "PENALTY"
  | "DEPOSIT"
  | "PARKING"
  | "AMENITY"
  | "OTHER";

export interface BillingRule {
  id: string;
  chargeType: BillingChargeType;
  recurrence: BillingRecurrence;
  defaultAmount: number | null;
  dueDayOfMonth: number | null;
  appliesTo: BillingAppliesTo;
  billTo: BillingBillTo;
  active: boolean;
}

export interface UpsertBillingRuleInput {
  chargeType: BillingChargeType;
  recurrence: BillingRecurrence;
  defaultAmount?: number;
  dueDayOfMonth?: number;
  appliesTo: BillingAppliesTo;
  billTo: BillingBillTo;
  active?: boolean;
}

export const billingRulesApi = {
  list: (orgId: string) =>
    apiRequest<BillingRule[]>(apiConfig.baseUrl, `/organizations/${orgId}/billing-rules`),

  upsert: (orgId: string, body: UpsertBillingRuleInput) =>
    apiRequest<BillingRule>(apiConfig.baseUrl, `/organizations/${orgId}/billing-rules`, {
      method: "PUT",
      body,
    }),
};
