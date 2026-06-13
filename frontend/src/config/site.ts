export const siteConfig = {
  name: "Dwellio",
  description: "Find and manage stays — hostels, PGs, co-living, and gated communities.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
