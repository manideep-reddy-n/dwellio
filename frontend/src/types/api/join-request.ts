export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface JoinRequest {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  status: JoinRequestStatus;
  message: string | null;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}
