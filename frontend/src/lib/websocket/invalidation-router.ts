import type { QueryClient } from "@tanstack/react-query";
import type { NotificationType } from "@/types/enums";
import { queryKeys } from "@/lib/query/keys";

type InvalidationSpec = {
  queryKeys: readonly (readonly unknown[])[];
};

/**
 * Maps WebSocket notification types to TanStack Query invalidation targets.
 * Powers the Live Operations Center and all real-time UI updates.
 */
export function getInvalidationsForNotification(
  type: NotificationType,
  organizationId?: string | null,
): InvalidationSpec {
  const org = organizationId ?? undefined;

  const withOrg = <T extends readonly unknown[]>(key: T): T => key;

  switch (type) {
    case "JOIN_REQUEST_APPROVED":
    case "JOIN_REQUEST_REJECTED":
      return {
        queryKeys: org
          ? [
              queryKeys.joinRequests(org),
              queryKeys.memberships(org),
              queryKeys.dashboard(org),
              queryKeys.liveOps(org),
            ]
          : [],
      };

    case "COMPLAINT_CREATED":
    case "COMPLAINT_ASSIGNED":
    case "COMPLAINT_RESOLVED":
    case "COMPLAINT_REOPENED":
      return {
        queryKeys: org
          ? [
              queryKeys.complaints.all(org),
              queryKeys.complaints.mine(org),
              queryKeys.resident.home(org),
              queryKeys.dashboard(org),
              queryKeys.liveOps(org),
              queryKeys.visualization(org),
            ]
          : [],
      };

    case "ANNOUNCEMENT_PUBLISHED":
      return {
        queryKeys: org
          ? [
              queryKeys.announcements.list(org),
              queryKeys.resident.home(org),
              queryKeys.liveOps(org),
            ]
          : [],
      };

    case "OCCUPANCY_ALLOCATED":
    case "OCCUPANCY_TRANSFERRED":
      return {
        queryKeys: org
          ? [
              queryKeys.occupancies.all(org),
              queryKeys.occupancies.mine(org),
              queryKeys.resident.home(org),
              queryKeys.visualization(org),
              queryKeys.dashboard(org),
              queryKeys.liveOps(org),
              queryKeys.memberships(org),
            ]
          : [],
      };

    case "REVIEW_REPORTED":
      return {
        queryKeys: org
          ? [queryKeys.dashboard(org), queryKeys.liveOps(org), queryKeys.reviews.list(org)]
          : [],
      };

    case "SYSTEM":
    default:
      return { queryKeys: [queryKeys.notifications.inbox(), queryKeys.notifications.unreadCount()] };
  }
}

export function invalidateFromNotification(
  queryClient: QueryClient,
  type: NotificationType,
  organizationId?: string | null,
) {
  const { queryKeys: keys } = getInvalidationsForNotification(type, organizationId);

  keys.forEach((key) => {
    void queryClient.invalidateQueries({ queryKey: key });
  });

  void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.inbox() });
}

/** Live Operations Center aggregate invalidation — refresh all live panels. */
export function invalidateLiveOps(queryClient: QueryClient, orgId: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.liveOps(orgId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(orgId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.complaints.all(orgId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.announcements.list(orgId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.joinRequests(orgId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.occupancies.all(orgId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.inbox({ organizationId: orgId }) });
}
