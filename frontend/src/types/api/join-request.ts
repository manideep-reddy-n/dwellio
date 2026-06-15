export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface JoinRequest {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  userPhone: string | null;
  status: JoinRequestStatus;
  message: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}
