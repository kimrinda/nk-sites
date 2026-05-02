"use client";

import Link from "next/link";
import { ArrowRight, Grid2x2, List } from "lucide-react";
import { useState } from "react";

import { MediaResults } from "@/components/media-results";
import { Button } from "@/components/ui/button";
import type { MediaCardItem, ViewMode } from "@/types/media";

export function HomeMediaSection({ title, href, items }: { title: string; href: string; items: MediaCardItem[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  if (!items.length) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-4 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">{title}</h2>
          </div>
          <Link href={href} className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
            Show All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="relative z-20 flex items-center gap-2 self-start md:self-auto">
          <Button type="button" variant={viewMode === "grid" ? "default" : "secondary"} size="icon" className="pointer-events-auto" onClick={() => setViewMode("grid")}>
            <Grid2x2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant={viewMode === "list" ? "default" : "secondary"} size="icon" className="pointer-events-auto" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <MediaResults items={items} viewMode={viewMode} compactMobileMeta />
    </section>
  );
}
