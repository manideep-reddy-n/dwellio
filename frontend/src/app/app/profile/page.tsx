"use client";

import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <PageTransition>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <Card className="mt-6 max-w-md">
          <CardHeader>
            <CardTitle className="text-base">{user?.fullName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{user?.email}</p>
            {user?.platformAdmin && <p>Platform administrator</p>}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
