import type { AccommodationMode, HostelAudience, OrganizationType } from "@/types/enums";

export interface PublicOrganizationMetrics {
  activeResidentCount: number;
  avgRating: number | null;
  reviewCount: number;
  avgResolutionDays: number | null;
  resolutionRate: number | null;
  openComplaintCount: number;
  avgFirstResponseHours: number | null;
  availableBeds: number | null;
  availableUnits: number | null;
  totalBeds: number | null;
  totalUnits: number | null;
  refreshedAt?: string;
  searchRankScore?: number | null;
}

export interface PublicOrganizationResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: OrganizationType;
  hostelAudience?: HostelAudience | null;
  accommodationMode: AccommodationMode;
  city: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string | null;
  contactEmail: string | null;
  metrics: PublicOrganizationMetrics;
  verified: boolean;
  logoUrl: string | null;
  amenities?: PublicAmenity[];
}

export interface PublicAmenity {
  name: string;
  icon: string | null;
}

export interface PublicOrganizationSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: OrganizationType;
  hostelAudience?: HostelAudience | null;
  accommodationMode: AccommodationMode;
  city: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  metrics: PublicOrganizationMetrics;
  verified: boolean;
  logoUrl: string | null;
}

export interface PublicReview {
  id: string;
  residentName: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface MarketplaceSearchParams {
  city?: string;
  type?: OrganizationType;
  q?: string;
}
