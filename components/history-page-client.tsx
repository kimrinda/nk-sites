"use client";

import Image from "next/image";
import Link from "next/link";
import { Grid2x2, List, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { HistoryProgressControls } from "@/components/history-progress-controls";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";
import { formatDateTimeLabel, formatProgressLabel, formatRelativeTimeLabel } from "@/lib/format";
import { useHistoryStore } from "@/store/history-store";
import type { ViewMode } from "@/types/media";

export function HistoryPageClient() {
  const items = useHistoryStore((state) => state.items);
  const removeHistoryItem = useHistoryStore((state) => state.removeHistoryItem);
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const hydrated = useHydrated();

  const sortedItems = useMemo(() => [...items].sort((a, b) => b.lastWatchedAt - a.lastWatchedAt), [items]);

  if (!hydrated) {
    return <CollectionSkeleton />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Playback Memory</p>
            <h1 className="font-display text-4xl font-semibold text-[var(--foreground)] sm:text-5xl">History</h1>
            <p className="text-sm text-[var(--muted-foreground)] sm:text-base">Watching activity is stored locally and updated the moment you start a stream link. Use the quick percentage buttons to keep resume badges accurate across the site.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={viewMode === "grid" ? "default" : "secondary"} size="icon" onClick={() => setViewMode("grid")}>
              <Grid2x2 className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "secondary"} size="icon" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => clearHistory()} disabled={!sortedItems.length}>Clear All</Button>
          </div>
        </div>
      </section>

      {!sortedItems.length ? (
        <EmptyState title="No watch history yet" description="Start a stream from any episode detail page and it will appear here automatically." />
      ) : (
        <section className={viewMode === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-5"}>
          {sortedItems.map((item) => (
            <article key={item.id} className={`overflow-hidden rounded-[28px] border border-[var(--card-border)] bg-[var(--card)] ${viewMode === "list" ? "flex flex-col md:flex-row" : "flex flex-col"}`}>
              <Link href={item.href} className={`relative overflow-hidden bg-[var(--muted)] ${viewMode === "list" ? "aspect-[16/10] md:w-[260px] md:shrink-0" : "aspect-[4/5]"}`}>
                {item.thumbnail ? <Image src={item.thumbnail} alt={item.title} fill sizes={viewMode === "list" ? "(max-width: 768px) 100vw, 260px" : "(max-width: 768px) 50vw, 33vw"} className="object-cover" /> : null}
              </Link>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">{item.sourceCategory}</p>
                    <Link href={item.href} className="block text-lg font-semibold text-[var(--foreground)] hover:text-[var(--accent)]">{item.title}</Link>
                    <p className="text-sm text-[var(--muted-foreground)]">Last watched {formatRelativeTimeLabel(item.lastWatchedAt)}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatDateTimeLabel(new Date(item.lastWatchedAt).toISOString())}</p>
                    {formatProgressLabel(item.progress) ? <p className="text-xs text-[var(--foreground)]">{formatProgressLabel(item.progress)}</p> : null}
                  </div>

                  <HistoryProgressControls id={item.id} progress={item.progress} />

                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => removeHistoryItem(item.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-[32px] border border-dashed border-[var(--card-border)] bg-[var(--card)] px-6 py-12 text-center">
      <h2 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="mt-3 text-sm text-[var(--muted-foreground)] sm:text-base">{description}</p>
    </section>
  );
}

function CollectionSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="aspect-[4/5] animate-pulse rounded-[28px] bg-[var(--muted)]" />
      ))}
    </div>
  );
}
