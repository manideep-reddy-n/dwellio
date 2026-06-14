import { BadgeCheck, ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { useAuth } from "@/hooks/use-auth";
import {
  verificationApi,
  verificationDocumentLabels,
  type VerificationDocumentType,
} from "@/lib/api/verification";
import { queryKeys } from "@/lib/query/keys";
import type { OrganizationStatus } from "@/types/enums";
import { apiConfig } from "@/config/api";

const statusLabels: Record<OrganizationStatus, string> = {
  DRAFT: "Draft",
  PENDING_VERIFICATION: "Pending verification",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

const requestStatusLabels = {
  PENDING: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  MORE_INFO_REQUIRED: "More information required",
} as const;

function resolveFileUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("/api/")) {
    const origin = apiConfig.baseUrl.replace(/\/api\/v1\/?$/, "");
    return `${origin}${url}`;
  }
  return `${apiConfig.baseUrl}${url}`;
}

interface VerificationCenterProps {
  orgId: string;
}

export function VerificationCenter({ orgId }: VerificationCenterProps) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<VerificationDocumentType>("TRADE_LICENSE");
  const [notes, setNotes] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.verification(orgId),
    queryFn: () => verificationApi.getRequest(orgId, accessToken!),
    enabled: Boolean(orgId && accessToken),
  });

  const submit = useMutation({
    mutationFn: () => verificationApi.submitRequest(orgId, accessToken!, notes || undefined),
    onSuccess: () => {
      toast.success("Verification request submitted");
      void queryClient.invalidateQueries({ queryKey: queryKeys.verification(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(orgId) });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const upload = useMutation({
    mutationFn: (file: File) =>
      verificationApi.uploadDocument(orgId, accessToken!, file, documentType),
    onSuccess: () => {
      toast.success("Document uploaded");
      void queryClient.invalidateQueries({ queryKey: queryKeys.verification(orgId) });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeDoc = useMutation({
    mutationFn: (documentId: string) => verificationApi.deleteDocument(documentId, accessToken!),
    onSuccess: () => {
      toast.success("Document removed");
      void queryClient.invalidateQueries({ queryKey: queryKeys.verification(orgId) });
    },
    onError: () => toast.error("Could not delete document"),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />;

  const orgStatus = data.organizationStatus;
  const canEdit =
    orgStatus === "DRAFT" ||
    orgStatus === "REJECTED" ||
    data.status === "MORE_INFO_REQUIRED";
  const canSubmit = canEdit && data.documents.length > 0;
  const isVerified = orgStatus === "VERIFIED";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BadgeCheck className="size-5 text-teal-600" />
          Verification Center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Organization status:</span>
          <Badge variant={isVerified ? "default" : "secondary"}>
            {statusLabels[orgStatus]}
          </Badge>
          {data.status && (
            <Badge variant="outline">{requestStatusLabels[data.status]}</Badge>
          )}
        </div>

        {isVerified && (
          <p className="text-sm text-teal-700 dark:text-teal-400">
            Your organization is verified on the Dwellio marketplace.
          </p>
        )}

        {data.rejectionReason && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            <p className="font-medium">Rejection reason</p>
            <p className="mt-1">{data.rejectionReason}</p>
          </div>
        )}

        {data.notes && data.status === "MORE_INFO_REQUIRED" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-medium">Reviewer notes</p>
            <p className="mt-1">{data.notes}</p>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Uploaded documents</h3>
          {data.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Upload at least one document before submitting verification.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="font-medium">{verificationDocumentLabels[doc.documentType]}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={resolveFileUrl(doc.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removeDoc.isPending}
                        onClick={() => removeDoc.mutate(doc.id)}
                      >
                        <Trash2 className="size-4 text-rose-600" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {canEdit && (
          <div className="space-y-3 rounded-lg border border-dashed p-4">
            <h3 className="text-sm font-medium">Upload document</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="document-type">Document type</Label>
                <select
                  id="document-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={documentType}
                  onChange={(event) =>
                    setDocumentType(event.target.value as VerificationDocumentType)
                  }
                >
                  {Object.entries(verificationDocumentLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>File (PDF, JPG, PNG, WEBP — max 10MB)</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload.mutate(file);
                  }}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={upload.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              Choose file
            </Button>
          </div>
        )}

        {canEdit && (
          <div className="space-y-2">
            <Label htmlFor="verification-notes">Notes for reviewer (optional)</Label>
            <Input
              id="verification-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Any context for the platform admin"
            />
            <Button
              disabled={!canSubmit || submit.isPending}
              onClick={() => submit.mutate()}
            >
              Submit verification request
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
