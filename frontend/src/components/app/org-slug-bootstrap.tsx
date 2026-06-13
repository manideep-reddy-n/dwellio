"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMyMembershipBySlug } from "@/hooks/use-memberships";
import { membershipToOrgContext } from "@/lib/org/context";
import { useOrgStore } from "@/stores/org-store";

interface OrgSlugBootstrapProps {
  params: Promise<{ orgSlug: string }>;
}

export function OrgSlugBootstrap({ params }: OrgSlugBootstrapProps) {
  const { orgSlug } = use(params);
  const router = useRouter();
  const rememberOrg = useOrgStore((s) => s.rememberOrg);
  const setActiveOrg = useOrgStore((s) => s.setActiveOrg);

  const { data: membership, isError, isLoading } = useMyMembershipBySlug(orgSlug);

  useEffect(() => {
    rememberOrg(orgSlug);
  }, [orgSlug, rememberOrg]);

  useEffect(() => {
    if (membership) {
      setActiveOrg(membershipToOrgContext(membership));
    }
  }, [membership, setActiveOrg]);

  useEffect(() => {
    if (!isLoading && isError) {
      router.replace("/app/organizations");
    }
  }, [isError, isLoading, router]);

  return null;
}
