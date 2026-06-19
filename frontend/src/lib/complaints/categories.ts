import type { ComplaintCategory, OrganizationType } from "@/types/enums";
import { complaintCategoryLabels } from "@/lib/resident/labels";

const HOSTEL_STYLE_ONLY: ComplaintCategory[] = ["FOOD", "HOUSEKEEPING"];

export function complaintCategoriesForOrgType(
  organizationType: OrganizationType | undefined,
): ComplaintCategory[] {
  const all = Object.keys(complaintCategoryLabels) as ComplaintCategory[];
  if (organizationType === "GATED_COMMUNITY") {
    return all.filter((c) => !HOSTEL_STYLE_ONLY.includes(c));
  }
  return all;
}

export function defaultComplaintCategory(
  organizationType: OrganizationType | undefined,
): ComplaintCategory {
  const allowed = complaintCategoriesForOrgType(organizationType);
  if (allowed.includes("MAINTENANCE")) return "MAINTENANCE";
  return allowed[0] ?? "OTHER";
}
