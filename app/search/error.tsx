"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function SearchError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-6 rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-8 text-center">
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-semibold text-[var(--foreground)]">Search is temporarily unavailable</h1>
        <p className="text-sm text-[var(--muted-foreground)] sm:text-base">The search route encountered a problem while loading results.</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => reset()}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
