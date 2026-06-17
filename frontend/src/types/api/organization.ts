import type {
  AccommodationMode,
  HostelAudience,
  OrganizationStatus,
  OrganizationType,
} from "@/types/enums";

export interface Organization {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: OrganizationType;
  hostelAudience: HostelAudience | null;
  accommodationMode: AccommodationMode;
  status: OrganizationStatus;
  city: string;
  area: string | null;
  state: string | null;
  postalCode: string | null;
  addressLine: string | null;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string | null;
  contactEmail: string | null;
  defaultMonthlyRent: number | null;
  logoUrl: string | null;
  slaFirstResponseHours: number;
  slaResolutionHours: number;
  billingMode: "CALENDAR_MONTH" | "OCCUPANCY_ANCHOR" | "CUSTOM_DAY";
  billingCustomDay: number | null;
  profileCompletenessScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  type: OrganizationType;
  hostelAudience?: HostelAudience;
  description?: string;
  city: string;
  area?: string;
  state?: string;
  postalCode?: string;
  addressLine?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  contactEmail?: string;
  defaultMonthlyRent?: number;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  city?: string;
  area?: string;
  state?: string;
  postalCode?: string;
  addressLine?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  contactEmail?: string;
  defaultMonthlyRent?: number;
  slaFirstResponseHours?: number;
  slaResolutionHours?: number;
  billingMode?: "CALENDAR_MONTH" | "OCCUPANCY_ANCHOR" | "CUSTOM_DAY";
  billingCustomDay?: number;
}
