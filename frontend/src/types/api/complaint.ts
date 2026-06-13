import type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from "@/types/enums";

export interface ComplaintAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  organizationId: string;
  createdByMembershipId: string;
  assignedToMembershipId: string | null;
  assetId: string | null;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  resolvedAt: string | null;
  closedAt: string | null;
  assignedAt: string | null;
  firstResponseAt: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: ComplaintAttachment[];
}

export interface CreateComplaintInput {
  title: string;
  description: string;
  category: ComplaintCategory;
  priority?: ComplaintPriority;
  assetId?: string;
}
