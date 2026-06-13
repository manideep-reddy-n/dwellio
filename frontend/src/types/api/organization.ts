import type {
  AccommodationMode,
  OrganizationStatus,
  OrganizationType,
} from "@/types/enums";

export interface Organization {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: OrganizationType;
  accommodationMode: AccommodationMode;
  status: OrganizationStatus;
  city: string;
  area: string | null;
  state: string | null;
  postalCode: string | null;
  addressLine: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  profileCompletenessScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  type: OrganizationType;
  description?: string;
  city: string;
  area?: string;
  state?: string;
  postalCode?: string;
  addressLine?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  city?: string;
  area?: string;
  state?: string;
  postalCode?: string;
  addressLine?: string;
  contactPhone?: string;
  contactEmail?: string;
}
