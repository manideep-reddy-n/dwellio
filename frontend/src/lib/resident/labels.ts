import type {
  AnnouncementType,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from "@/types/enums";

export const complaintCategoryLabels: Record<ComplaintCategory, string> = {
  WIFI: "Wi-Fi",
  FOOD: "Food",
  HOUSEKEEPING: "Housekeeping",
  MAINTENANCE: "Maintenance",
  ELECTRICITY: "Electricity",
  PLUMBING: "Plumbing",
  SECURITY: "Security",
  NOISE: "Noise",
  PAYMENT: "Payment",
  OTHER: "Other",
};

export const complaintStatusLabels: Record<ComplaintStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
};

export const complaintPriorityLabels: Record<ComplaintPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const announcementTypeLabels: Record<AnnouncementType, string> = {
  GENERAL: "General",
  MAINTENANCE: "Maintenance",
  EVENT: "Event",
  PAYMENT_REMINDER: "Payment reminder",
};

export const complaintCategories = Object.keys(complaintCategoryLabels) as ComplaintCategory[];
export const complaintPriorities = Object.keys(complaintPriorityLabels) as ComplaintPriority[];
