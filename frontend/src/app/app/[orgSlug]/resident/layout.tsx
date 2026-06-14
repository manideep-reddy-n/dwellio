import { ResidentLayoutShell } from "@/components/resident/resident-layout-shell";

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return <ResidentLayoutShell>{children}</ResidentLayoutShell>;
}
