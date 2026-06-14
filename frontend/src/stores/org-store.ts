import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccommodationMode, OrganizationType } from "@/types/enums";

export interface OrgContext {
  id: string;
  slug: string;
  name: string;
  organizationType: OrganizationType;
  logoUrl: string | null;
  accommodationMode: AccommodationMode;
  permissions: string[];
  isOwner: boolean;
  roleName: string;
}

interface OrgState {
  activeOrg: OrgContext | null;
  recentOrgSlugs: string[];
  setActiveOrg: (org: OrgContext) => void;
  clearActiveOrg: () => void;
  rememberOrg: (slug: string) => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      activeOrg: null,
      recentOrgSlugs: [],

      setActiveOrg: (org) => {
        const recent = [org.slug, ...get().recentOrgSlugs.filter((s) => s !== org.slug)].slice(0, 5);
        set({ activeOrg: org, recentOrgSlugs: recent });
      },

      clearActiveOrg: () => set({ activeOrg: null }),

      rememberOrg: (slug) => {
        const recent = [slug, ...get().recentOrgSlugs.filter((s) => s !== slug)].slice(0, 5);
        set({ recentOrgSlugs: recent });
      },
    }),
    { name: "dwellio-org" },
  ),
);
