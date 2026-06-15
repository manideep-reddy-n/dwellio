"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { profileApi } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { UserMembership } from "@/types/api/membership";
import { toast } from "sonner";

interface ProfileSettingsFormProps {
  memberships: UserMembership[];
}

export function ProfileSettingsForm({ memberships }: ProfileSettingsFormProps) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savingAccount, setSavingAccount] = useState(false);

  const residentMemberships = useMemo(
    () => memberships.filter((m) => !m.ownerRole && m.roleName.toUpperCase() === "RESIDENT"),
    [memberships],
  );

  const residentSlugs = useMemo(
    () => residentMemberships.map((m) => m.organizationSlug).join(","),
    [residentMemberships],
  );

  const [emergencyBySlug, setEmergencyBySlug] = useState<
    Record<string, { name: string; phone: string }>
  >({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setPhone(user?.phone ?? "");
  }, [user?.fullName, user?.phone]);

  useEffect(() => {
    let cancelled = false;
    async function loadEmergency() {
      const entries = await Promise.all(
        residentMemberships.map(async (m) => {
          try {
            const profile = await profileApi.getResidentProfile(m.organizationSlug);
            return [
              m.organizationSlug,
              {
                name: profile.emergencyContactName ?? "",
                phone: profile.emergencyContactPhone ?? "",
              },
            ] as const;
          } catch {
            return [m.organizationSlug, { name: "", phone: "" }] as const;
          }
        }),
      );
      if (!cancelled) {
        setEmergencyBySlug(Object.fromEntries(entries));
      }
    }
    if (residentMemberships.length > 0) {
      void loadEmergency();
    }
    return () => {
      cancelled = true;
    };
  }, [residentSlugs, residentMemberships]);

  async function saveAccount(event: React.FormEvent) {
    event.preventDefault();
    setSavingAccount(true);
    try {
      const updated = await authApi.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      setUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update profile");
    } finally {
      setSavingAccount(false);
    }
  }

  async function saveEmergency(slug: string, organizationName: string) {
    const draft = emergencyBySlug[slug] ?? { name: "", phone: "" };
    setSavingSlug(slug);
    try {
      await profileApi.updateResidentProfile(slug, {
        emergencyContactName: draft.name.trim() || undefined,
        emergencyContactPhone: draft.phone.trim() || undefined,
      });
      toast.success(`Emergency contact saved for ${organizationName}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save emergency contact");
    } finally {
      setSavingSlug(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Update your name and phone number</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={savingAccount}>
              {savingAccount ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {residentMemberships.map((m) => (
        <Card key={m.membershipId}>
          <CardHeader>
            <CardTitle className="text-base">Emergency contact · {m.organizationName}</CardTitle>
            <CardDescription>Used by your property team in case of emergencies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`emergency-name-${m.organizationSlug}`}>Contact name</Label>
              <Input
                id={`emergency-name-${m.organizationSlug}`}
                placeholder="Parent, spouse, or guardian"
                value={emergencyBySlug[m.organizationSlug]?.name ?? ""}
                onChange={(e) =>
                  setEmergencyBySlug((prev) => ({
                    ...prev,
                    [m.organizationSlug]: {
                      name: e.target.value,
                      phone: prev[m.organizationSlug]?.phone ?? "",
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`emergency-phone-${m.organizationSlug}`}>Contact phone</Label>
              <Input
                id={`emergency-phone-${m.organizationSlug}`}
                type="tel"
                placeholder="+91 98765 43210"
                value={emergencyBySlug[m.organizationSlug]?.phone ?? ""}
                onChange={(e) =>
                  setEmergencyBySlug((prev) => ({
                    ...prev,
                    [m.organizationSlug]: {
                      name: prev[m.organizationSlug]?.name ?? "",
                      phone: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={savingSlug === m.organizationSlug}
              onClick={() => void saveEmergency(m.organizationSlug, m.organizationName)}
            >
              {savingSlug === m.organizationSlug ? "Saving…" : "Save emergency contact"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
