import { AppShell } from "@/components/layout/app-shell";
import { OrgContextBootstrap } from "@/components/app/org-context-bootstrap";
import { AuthGate } from "@/components/providers/auth-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <OrgContextBootstrap />
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
