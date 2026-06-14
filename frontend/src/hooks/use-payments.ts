"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsApi, type CreateManualChargeInput } from "@/lib/api/payments";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { queryKeys } from "@/lib/query/keys";

export function useOrgPayments(orgId: string | undefined) {
  const { authReady } = useAuthReady();
  return useQuery({
    queryKey: orgId ? queryKeys.payments(orgId) : ["payments", "disabled"],
    queryFn: () => paymentsApi.list(orgId!),
    enabled: authReady && Boolean(orgId),
  });
}

export function useMyPayments(orgId: string | undefined) {
  const { authReady } = useAuthReady();
  return useQuery({
    queryKey: orgId ? [...queryKeys.payments(orgId), "mine"] : ["payments", "mine", "disabled"],
    queryFn: () => paymentsApi.listMine(orgId!),
    enabled: authReady && Boolean(orgId),
  });
}

export function useRecordPayment(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      body,
    }: {
      paymentId: string;
      body: Parameters<typeof paymentsApi.record>[2];
    }) => paymentsApi.record(orgId!, paymentId, body),
    onSettled: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.payments(orgId) });
    },
  });
}

export function useCreateManualCharge(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateManualChargeInput) => paymentsApi.createManual(orgId!, body),
    onSettled: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.payments(orgId) });
    },
  });
}

export function useGenerateInvoice(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => paymentsApi.generateInvoice(orgId!, paymentId),
    onSettled: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.payments(orgId) });
    },
  });
}

export function useShareInvoice(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => paymentsApi.shareInvoice(orgId!, paymentId),
    onSettled: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: queryKeys.payments(orgId) });
    },
  });
}
