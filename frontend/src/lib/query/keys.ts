export const queryKeys = {
  all: ["dwellio"] as const,

  auth: {
    me: () => [...queryKeys.all, "auth", "me"] as const,
  },

  me: {
    memberships: () => [...queryKeys.all, "me", "memberships"] as const,
    membershipBySlug: (slug: string) =>
      [...queryKeys.all, "me", "memberships", "slug", slug] as const,
  },

  marketplace: {
    org: (slug: string) => [...queryKeys.all, "marketplace", "org", slug] as const,
    explore: (filters: Record<string, string>) =>
      [...queryKeys.all, "marketplace", "explore", filters] as const,
  },

  organizations: {
    detail: (orgId: string) => [...queryKeys.all, "organizations", orgId] as const,
    bySlug: (slug: string) => [...queryKeys.all, "organizations", "slug", slug] as const,
  },

  notifications: {
    inbox: (params?: { organizationId?: string; unreadOnly?: boolean; page?: number }) =>
      [...queryKeys.all, "notifications", params ?? {}] as const,
    unreadCount: () => [...queryKeys.all, "notifications", "unread-count"] as const,
  },

  dashboard: (orgId: string) => [...queryKeys.all, "dashboard", orgId] as const,

  liveOps: (orgId: string) => [...queryKeys.all, "live-ops", orgId] as const,

  complaints: {
    all: (orgId: string, filters?: Record<string, string>) =>
      [...queryKeys.all, "complaints", orgId, filters ?? {}] as const,
    mine: (orgId: string) => [...queryKeys.all, "complaints", orgId, "mine"] as const,
    detail: (orgId: string, complaintId: string) =>
      [...queryKeys.all, "complaints", orgId, complaintId] as const,
  },

  announcements: {
    list: (orgId: string) => [...queryKeys.all, "announcements", orgId] as const,
    detail: (orgId: string, id: string) =>
      [...queryKeys.all, "announcements", orgId, id] as const,
  },

  joinRequests: (orgId: string) => [...queryKeys.all, "join-requests", orgId] as const,

  occupancies: {
    all: (orgId: string) => [...queryKeys.all, "occupancies", orgId] as const,
    mine: (orgId: string) => [...queryKeys.all, "occupancies", orgId, "mine"] as const,
  },

  reviews: {
    list: (orgId: string) => [...queryKeys.all, "reviews", orgId, "list"] as const,
    mine: (orgId: string) => [...queryKeys.all, "reviews", orgId, "mine"] as const,
  },

  roles: (orgId: string) => [...queryKeys.all, "roles", orgId] as const,

  assets: (orgId: string) => [...queryKeys.all, "assets", orgId] as const,

  buildings: (orgId: string) => [...queryKeys.all, "buildings", orgId] as const,

  resident: {
    home: (orgId: string) => [...queryKeys.all, "resident", orgId, "home"] as const,
  },

  visualization: (orgId: string) => [...queryKeys.all, "visualization", orgId] as const,

  memberships: (orgId: string) => [...queryKeys.all, "memberships", orgId] as const,
} as const;
