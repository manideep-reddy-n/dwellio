import { apiConfig } from "@/config/api";
import { apiRequest } from "@/lib/api/client";
import type { OrganizationStatus } from "@/types/enums";

export type VerificationRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MORE_INFO_REQUIRED";

export type VerificationDocumentType =
  | "BUSINESS_REGISTRATION"
  | "TRADE_LICENSE"
  | "PROPERTY_PROOF"
  | "OWNER_ID"
  | "ASSOCIATION_REGISTRATION"
  | "MANAGEMENT_AUTHORIZATION"
  | "OTHER";

export interface VerificationDocument {
  id: string;
  documentType: VerificationDocumentType;
  fileUrl: string;
  uploadedAt: string;
}

export interface VerificationRequest {
  id: string | null;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationStatus: OrganizationStatus;
  submittedByMembershipId: string | null;
  status: VerificationRequestStatus | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  documents: VerificationDocument[];
}

export interface AdminVerificationRequestSummary {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationType: string;
  organizationStatus: OrganizationStatus;
  status: VerificationRequestStatus;
  submittedAt: string | null;
  documentCount: number;
}

export const verificationDocumentLabels: Record<VerificationDocumentType, string> = {
  BUSINESS_REGISTRATION: "Business registration",
  TRADE_LICENSE: "Trade license",
  PROPERTY_PROOF: "Property proof",
  OWNER_ID: "Owner ID",
  ASSOCIATION_REGISTRATION: "Association registration",
  MANAGEMENT_AUTHORIZATION: "Management authorization",
  OTHER: "Other",
};

export const verificationApi = {
  getRequest: (orgId: string, token: string) =>
    apiRequest<VerificationRequest>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/verification-request`,
      { token },
    ),

  submitRequest: (orgId: string, token: string, notes?: string) =>
    apiRequest<VerificationRequest>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/verification-request`,
      { method: "POST", token, body: notes ? { notes } : {} },
    ),

  uploadDocument: async (
    orgId: string,
    token: string,
    file: File,
    documentType: VerificationDocumentType,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    const response = await fetch(
      `${apiConfig.baseUrl}/organizations/${orgId}/verification-documents`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(
        typeof body.message === "string" ? body.message : "Upload failed",
      );
    }
    return response.json() as Promise<VerificationDocument>;
  },

  deleteDocument: (documentId: string, token: string) =>
    apiRequest<void>(apiConfig.baseUrl, `/verification-documents/${documentId}`, {
      method: "DELETE",
      token,
    }),
};
