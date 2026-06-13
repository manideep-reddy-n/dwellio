import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function OrgNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Listing not found</h1>
      <p className="mt-2 text-muted-foreground">
        This organization may not be verified yet or the link is incorrect.
      </p>
      <Link href="/explore" className={buttonVariants({ className: "mt-6" })}>
        Explore stays
      </Link>
    </div>
  );
}
