import { OperationsLayoutShell } from "@/components/operations/operations-layout-shell";

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return <OperationsLayoutShell>{children}</OperationsLayoutShell>;
}
