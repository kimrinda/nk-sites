"use client";

import Image from "next/image";
import Link from "next/link";
import { Grid2x2, List, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTimeLabel } from "@/lib/format";
import { useBookmarksStore } from "@/store/bookmarks-store";
import type { ViewMode } from "@/types/media";

export function BookmarksPageClient() {
  const items = useBookmarksStore((state) => state.items);
  const removeBookmark = useBookmarksStore((state) => state.removeBookmark);
  const renameBookmark = useBookmarksStore((state) => state.renameBookmark);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const hydrated = useHydrated();

  const sortedItems = useMemo(() => [...items].sort((a, b) => b.createdAt - a.createdAt), [items]);

  if (!hydrated) {
    return <CollectionSkeleton />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Local Collection</p>
            <h1 className="font-display text-4xl font-semibold text-[var(--foreground)] sm:text-5xl">Bookmarks</h1>
            <p className="text-sm text-[var(--muted-foreground)] sm:text-base">Saved locally with no account required. Rename, revisit, or remove entries instantly.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={viewMode === "grid" ? "default" : "secondary"} size="icon" onClick={() => setViewMode("grid")}>
              <Grid2x2 className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "secondary"} size="icon" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {!sortedItems.length ? (
        <EmptyState title="No bookmarks yet" description="Save an anime overview or an episode from its detail page and it will appear here." />
      ) : (
        <section className={viewMode === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-5"}>
          {sortedItems.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <article key={item.id} className={`overflow-hidden rounded-[28px] border border-[var(--card-border)] bg-[var(--card)] ${viewMode === "list" ? "flex flex-col md:flex-row" : "flex flex-col"}`}>
                <Link href={item.href} className={`relative overflow-hidden bg-[var(--muted)] ${viewMode === "list" ? "aspect-[16/10] md:w-[260px] md:shrink-0" : "aspect-[4/5]"}`}>
                  {item.thumbnail ? <Image src={item.thumbnail} alt={item.title} fill sizes={viewMode === "list" ? "(max-width: 768px) 100vw, 260px" : "(max-width: 768px) 50vw, 33vw"} className="object-cover" /> : null}
                </Link>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">{item.sourceCategory}</p>
                    <Link href={item.href} className="block text-lg font-semibold text-[var(--foreground)] hover:text-[var(--accent)]">{item.title}</Link>
                    <p className="text-sm text-[var(--muted-foreground)]">Saved {formatDateTimeLabel(new Date(item.createdAt).toISOString())}</p>
                  </div>

                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Custom bookmark name" />
                      <Button onClick={() => { renameBookmark(item.id, draftName); setEditingId(null); }}>Save</Button>
                    </div>
                  ) : (
                    <p className="min-h-6 text-sm text-[var(--muted-foreground)]">{item.customName ?? "No custom bookmark name"}</p>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => { setEditingId(item.id); setDraftName(item.customName ?? item.title); }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" onClick={() => removeBookmark(item.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
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
