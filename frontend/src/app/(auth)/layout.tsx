import { PageTransition } from "@/components/shared/page-transition";
import { AuthRedirect } from "@/components/providers/session-bootstrap";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <PageTransition className="w-full max-w-md">
        <AuthRedirect>{children}</AuthRedirect>
      </PageTransition>
    </div>
  );
}
