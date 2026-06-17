import type { OrganizationType } from "@/types/enums";

export const FOOD_MENU_ORG_TYPES: OrganizationType[] = ["HOSTEL", "PG", "CO_LIVING"];

export function supportsFoodMenu(type: OrganizationType | undefined): boolean {
  return type != null && FOOD_MENU_ORG_TYPES.includes(type);
}
