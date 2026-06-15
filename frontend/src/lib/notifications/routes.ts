import type { Notification } from "@/types/api/notification";
import type { NotificationType } from "@/types/enums";

type Payload = Record<string, unknown> | null | undefined;

function slugFromPayload(payload: Payload): string | null {
  const slug = payload?.organizationSlug;
  return typeof slug === "string" ? slug : null;
}

function targetFromPayload(payload: Payload): string | null {
  const path = payload?.targetPath;
  return typeof path === "string" ? path : null;
}

/** Resolve href from a WebSocket toast payload (partial notification). */
export function getNotificationHrefFromPayload(
  type: NotificationType,
  payloadJson?: Payload,
): string | null {
  const target = targetFromPayload(payloadJson);
  if (target) return target;
  return getNotificationHrefByType(type, slugFromPayload(payloadJson), payloadJson);
}

/** Deep-link target for a notification row or bell item. */
export function getNotificationHref(notification: Notification): string | null {
  const target = targetFromPayload(notification.payloadJson);
  if (target) return target;
  return getNotificationHrefByType(
    notification.type,
    slugFromPayload(notification.payloadJson),
    notification.payloadJson,
  );
}

function getNotificationHrefByType(
  type: NotificationType,
  orgSlug: string | null,
  payload?: Payload,
): string | null {
  switch (type) {
    case "JOIN_REQUEST_SUBMITTED":
      return orgSlug ? `/app/${orgSlug}/operations/join-requests` : "/app/organizations";
    case "LEAVE_REQUEST_SUBMITTED":
      return orgSlug ? `/app/${orgSlug}/operations/residents` : "/app/organizations";
    case "JOIN_REQUEST_APPROVED":
      return orgSlug ? `/app/${orgSlug}/resident` : "/app/organizations";
    case "JOIN_REQUEST_REJECTED":
    case "AVAILABILITY_OPEN":
      return orgSlug ? `/${orgSlug}` : "/explore";
    case "COMPLAINT_CREATED":
    case "COMPLAINT_ASSIGNED":
      return orgSlug ? `/app/${orgSlug}/operations/complaints` : null;
    case "COMPLAINT_RESOLVED":
    case "COMPLAINT_REOPENED":
      return orgSlug ? `/app/${orgSlug}/resident/complaints` : null;
    case "ANNOUNCEMENT_PUBLISHED":
      return orgSlug ? `/app/${orgSlug}/resident/announcements` : null;
    case "OCCUPANCY_ALLOCATED":
    case "OCCUPANCY_TRANSFERRED":
      return orgSlug ? `/app/${orgSlug}/resident/accommodation` : null;
    case "REVIEW_REPORTED":
      return orgSlug ? `/app/${orgSlug}/operations/reviews` : null;
    case "PAYMENT_DUE":
    case "PAYMENT_RECORDED":
    case "INVOICE_SHARED":
      return orgSlug ? `/app/${orgSlug}/resident/payments` : "/app/profile";
    case "FOOD_MENU_UPDATED":
      return orgSlug ? `/app/${orgSlug}/resident#menu` : null;
    case "LEAVE_REQUEST_APPROVED":
    case "LEAVE_REQUEST_REJECTED":
      return "/app/profile";
    case "ORGANIZATION_VERIFIED":
    case "ORGANIZATION_VERIFICATION_SUBMITTED":
    case "ORGANIZATION_VERIFICATION_REJECTED":
    case "ORGANIZATION_VERIFICATION_MORE_INFO":
      return orgSlug ? `/app/${orgSlug}/operations/settings` : "/app/organizations";
    case "ORGANIZATION_SUSPENDED":
      return orgSlug ? `/app/${orgSlug}/operations` : "/app/organizations";
    case "SUSPENSION_APPEAL_SUBMITTED":
      return orgSlug ? `/app/${orgSlug}/operations` : "/app/organizations";
    case "SYSTEM":
      return "/app/notifications";
    default:
      return null;
  }
}
