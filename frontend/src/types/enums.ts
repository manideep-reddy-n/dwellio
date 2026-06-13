export type OrganizationType =
  | "HOSTEL"
  | "PG"
  | "CO_LIVING"
  | "GATED_COMMUNITY";

export type OrganizationStatus = "PENDING" | "VERIFIED" | "SUSPENDED" | "ARCHIVED";

export type AccommodationMode = "BED_BASED" | "UNIT_BASED";

export type NotificationType =
  | "JOIN_REQUEST_APPROVED"
  | "JOIN_REQUEST_REJECTED"
  | "COMPLAINT_CREATED"
  | "COMPLAINT_ASSIGNED"
  | "COMPLAINT_RESOLVED"
  | "COMPLAINT_REOPENED"
  | "ANNOUNCEMENT_PUBLISHED"
  | "OCCUPANCY_ALLOCATED"
  | "OCCUPANCY_TRANSFERRED"
  | "REVIEW_REPORTED"
  | "SYSTEM";

export type NotificationStatus = "UNREAD" | "READ";

export type ComplaintCategory =
  | "WIFI"
  | "FOOD"
  | "HOUSEKEEPING"
  | "MAINTENANCE"
  | "ELECTRICITY"
  | "PLUMBING"
  | "SECURITY"
  | "NOISE"
  | "PAYMENT"
  | "OTHER";

export type ComplaintStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED";

export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AnnouncementType =
  | "GENERAL"
  | "MAINTENANCE"
  | "EVENT"
  | "PAYMENT_REMINDER";

export type OccupancyTarget = "BED" | "UNIT";
