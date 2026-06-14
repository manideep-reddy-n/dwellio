import type { OrganizationType } from "@/types/enums";

export const ownerHomeQuotes = {
  eyebrow: "Operations · Residents · Accommodation",
  title: "Manage your property with clarity",
  description:
    "Track occupancy, resolve complaints faster, approve join requests, and keep residents informed — all in one place.",
} as const;

export const residentHomeQuotes = {
  eyebrow: "Your stay · Updates · Support",
  title: "Everything about your stay",
  description:
    "See announcements, track your complaints, view your room allocation, and stay connected with your property team.",
} as const;

export const ownerMarketingQuotes = {
  eyebrow: "Property management · Real-time ops · Team workflows",
  title: "Run your hostel or community like a pro",
  description:
    "Onboard residents, manage beds and units, monitor service quality, and respond to issues from a single operations hub.",
} as const;

export const residentMarketingQuotes = {
  eyebrow: "Verified stays · Trust Score · Transparent reviews",
  title: "Find your next stay with confidence",
  description:
    "Browse verified hostels, PGs, co-living spaces, and gated communities ranked by real service metrics.",
} as const;

export function hostelAudienceLabel(audience: string | null | undefined): string | null {
  if (!audience) return null;
  switch (audience) {
    case "BOYS":
      return "Boys";
    case "GIRLS":
      return "Girls";
    case "CO_ED":
      return "Co-ed";
    default:
      return null;
  }
}

export function isHostelType(type: OrganizationType): boolean {
  return type === "HOSTEL" || type === "PG";
}
