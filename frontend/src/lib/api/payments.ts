import { apiConfig } from "@/config/api";
import { apiDownloadBlob, apiRequest } from "@/lib/api/client";

export type PaymentStatus = "PAID" | "PENDING" | "PARTIAL" | "OVERDUE";

export type ChargeType =
  | "RENT"
  | "MAINTENANCE"
  | "UTILITY"
  | "PENALTY"
  | "DEPOSIT"
  | "PARKING"
  | "AMENITY"
  | "OTHER";

export type InvoiceStatus = "GENERATED" | "SHARED" | "REVOKED";

export interface PaymentRecord {
  id: string;
  membershipId: string;
  residentName: string;
  residentEmail: string;
  residentPhone: string | null;
  billingMonth: string;
  amount: number;
  amountPaid: number;
  dueDate: string;
  status: PaymentStatus;
  chargeType: ChargeType;
  description: string | null;
  notes: string | null;
  paidAt: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: InvoiceStatus | null;
  invoiceShared: boolean;
}

export interface InvoiceRecord {
  id: string;
  paymentId: string;
  invoiceNumber: string;
  verificationToken: string | null;
  status: InvoiceStatus;
  generatedAt: string;
  sharedAt: string | null;
  verifyUrl: string;
}

export interface InvoiceVerification {
  invoiceNumber: string | null;
  organizationName: string | null;
  residentName: string | null;
  invoiceDate: string | null;
  amount: number | null;
  amountPaid: number | null;
  paymentStatus: PaymentStatus | null;
  verificationStatus: InvoiceStatus | null;
  result: string;
}

export interface CheckoutResponse {
  paymentSessionId: string;
  orderId: string;
}

export interface CreateManualChargeInput {
  chargeType: ChargeType;
  amount: number;
  description?: string;
  dueDate: string;
  membershipIds: string[];
}

async function downloadBlob(path: string, filename: string) {
  return apiDownloadBlob(apiConfig.baseUrl, path, filename);
}

export const paymentsApi = {
  list: (orgId: string) =>
    apiRequest<PaymentRecord[]>(apiConfig.baseUrl, `/organizations/${orgId}/payments`),

  listMine: (orgId: string) =>
    apiRequest<PaymentRecord[]>(apiConfig.baseUrl, `/organizations/${orgId}/payments/mine`),

  createManual: (orgId: string, body: CreateManualChargeInput) =>
    apiRequest<PaymentRecord[]>(apiConfig.baseUrl, `/organizations/${orgId}/payments/manual`, {
      method: "POST",
      body,
    }),

  record: (
    orgId: string,
    paymentId: string,
    body: { status: PaymentStatus; amountPaid: number; notes?: string },
  ) =>
    apiRequest<PaymentRecord>(apiConfig.baseUrl, `/organizations/${orgId}/payments/${paymentId}`, {
      method: "PATCH",
      body,
    }),

  generateInvoice: (orgId: string, paymentId: string) =>
    apiRequest<InvoiceRecord>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/payments/${paymentId}/invoice`,
      { method: "POST" },
    ),

  shareInvoice: (orgId: string, paymentId: string) =>
    apiRequest<InvoiceRecord>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/payments/${paymentId}/invoice/share`,
      { method: "POST" },
    ),

  downloadInvoice: (orgId: string, paymentId: string, filename: string) =>
    downloadBlob(`/organizations/${orgId}/payments/${paymentId}/invoice/pdf`, filename),

  verifyInvoice: (invoiceNumber: string, token: string) =>
    apiRequest<InvoiceVerification>(
      apiConfig.baseUrl,
      `/public/invoices/verify?n=${encodeURIComponent(invoiceNumber)}&t=${encodeURIComponent(token)}`,
      { skipAuth: true },
    ),

  checkout: (orgId: string, paymentId: string, amount: number) =>
    apiRequest<CheckoutResponse>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/payments/${paymentId}/checkout`,
      { method: "POST", body: { amount } },
    ),

  verifyPayment: (orgId: string, paymentId: string, orderId: string) =>
    apiRequest<PaymentRecord>(
      apiConfig.baseUrl,
      `/organizations/${orgId}/payments/${paymentId}/verify/${orderId}`,
      { method: "POST" },
    ),
};
