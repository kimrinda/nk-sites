import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="space-y-6 rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-8 text-center">
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-semibold text-[var(--foreground)]">Page not found</h1>
        <p className="text-sm text-[var(--muted-foreground)] sm:text-base">The requested page does not exist or is no longer available in the current dataset.</p>
      </div>
      <Button asChild>
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  );
}
