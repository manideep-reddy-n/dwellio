"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { adminVerificationApi } from "@/lib/api/admin-verification";
import { verificationDocumentLabels } from "@/lib/api/verification";
import { apiConfig } from "@/config/api";
import { useState } from "react";
import { toast } from "sonner";

function resolveFileUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("/api/")) {
    const origin = apiConfig.baseUrl.replace(/\/api\/v1\/?$/, "");
    return `${origin}${url}`;
  }
  return `${apiConfig.baseUrl}${url}`;
}

export default function AdminVerificationRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.requestId as string;
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [moreInfoNotes, setMoreInfoNotes] = useState("");

  const { data: request, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "verification-requests", requestId],
    queryFn: () => adminVerificationApi.getById(requestId),
    enabled: Boolean(requestId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "verification-requests"] });
    void refetch();
  };

  const approve = useMutation({
    mutationFn: () => adminVerificationApi.approve(requestId),
    onSuccess: () => {
      toast.success("Verification approved");
      invalidate();
    },
    onError: () => toast.error("Could not approve"),
  });

  const reject = useMutation({
    mutationFn: () => adminVerificationApi.reject(requestId, rejectReason),
    onSuccess: () => {
      toast.success("Verification rejected");
      invalidate();
    },
    onError: () => toast.error("Could not reject"),
  });

  const moreInfo = useMutation({
    mutationFn: () => adminVerificationApi.requestMoreInfo(requestId, moreInfoNotes),
    onSuccess: () => {
      toast.success("Requested more information");
      invalidate();
    },
    onError: () => toast.error("Could not request more information"),
  });

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (isError || !request) return <ErrorState onRetry={() => void refetch()} />;

  const canReview = request.status === "PENDING";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/verification-requests")}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{request.organizationName}</h1>
          <p className="text-muted-foreground">{request.organizationSlug}</p>
        </div>
        <div className="flex gap-2">
          <Badge>{request.status}</Badge>
          <Badge variant="outline">{request.organizationStatus}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submission details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {request.submittedAt && (
            <p>
              <span className="text-muted-foreground">Submitted:</span>{" "}
              {new Date(request.submittedAt).toLocaleString()}
            </p>
          )}
          {request.notes && (
            <p>
              <span className="text-muted-foreground">Owner notes:</span> {request.notes}
            </p>
          )}
          {request.rejectionReason && (
            <p className="text-rose-600">Rejection: {request.rejectionReason}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {request.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents attached.</p>
          ) : (
            <ul className="space-y-2">
              {request.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    <span>{verificationDocumentLabels[doc.documentType]}</span>
                  </div>
                  <a
                    href={resolveFileUrl(doc.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium"
                  >
                    <ExternalLink className="mr-1 size-4" />
                    View
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {canReview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button disabled={approve.isPending} onClick={() => approve.mutate()}>
              Approve verification
            </Button>

            <div className="space-y-2 border-t pt-4">
              <Label>Request more information</Label>
              <Input
                value={moreInfoNotes}
                onChange={(event) => setMoreInfoNotes(event.target.value)}
                placeholder="What should the owner provide?"
              />
              <Button
                variant="outline"
                disabled={!moreInfoNotes.trim() || moreInfo.isPending}
                onClick={() => moreInfo.mutate()}
              >
                Request more info
              </Button>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label>Reject reason</Label>
              <Input
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Reason for rejection"
              />
              <Button
                variant="destructive"
                disabled={!rejectReason.trim() || reject.isPending}
                onClick={() => reject.mutate()}
              >
                Reject verification
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
