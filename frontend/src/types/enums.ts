export type HostelAudience = "BOYS" | "GIRLS" | "CO_ED";

export type OrganizationType =
  | "HOSTEL"
  | "PG"
  | "CO_LIVING"
  | "GATED_COMMUNITY";

export type OrganizationStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "SUSPENDED"
  | "REJECTED";

export type AccommodationMode = "BED_BASED" | "UNIT_BASED";

export type NotificationType =
  | "JOIN_REQUEST_APPROVED"
  | "JOIN_REQUEST_REJECTED"
  | "JOIN_REQUEST_SUBMITTED"
  | "COMPLAINT_CREATED"
  | "COMPLAINT_ASSIGNED"
  | "COMPLAINT_RESOLVED"
  | "COMPLAINT_REOPENED"
  | "ANNOUNCEMENT_PUBLISHED"
  | "OCCUPANCY_ALLOCATED"
  | "OCCUPANCY_TRANSFERRED"
  | "REVIEW_REPORTED"
  | "AVAILABILITY_OPEN"
  | "PAYMENT_DUE"
  | "PAYMENT_RECORDED"
  | "INVOICE_SHARED"
  | "LEAVE_REQUEST_SUBMITTED"
  | "LEAVE_REQUEST_APPROVED"
  | "LEAVE_REQUEST_REJECTED"
  | "FOOD_MENU_UPDATED"
  | "ORGANIZATION_VERIFIED"
  | "ORGANIZATION_VERIFICATION_SUBMITTED"
  | "ORGANIZATION_VERIFICATION_REJECTED"
  | "ORGANIZATION_VERIFICATION_MORE_INFO"
  | "ORGANIZATION_SUSPENDED"
  | "SUSPENSION_APPEAL_SUBMITTED"
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
