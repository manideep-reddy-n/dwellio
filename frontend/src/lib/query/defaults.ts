export const queryDefaults = {
  staleTime: {
    marketplace: 60_000,
    dashboard: 30_000,
    liveOps: 15_000,
    notifications: 20_000,
    static: 300_000,
  },
  gcTime: 600_000,
  retry: 1,
} as const;
