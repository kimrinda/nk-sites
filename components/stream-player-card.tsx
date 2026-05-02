"use client";

import { Play } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useHistoryStore } from "@/store/history-store";
import type { MediaItem } from "@/types/media";

export function StreamPlayerCard({ item, animeSlug }: { item: MediaItem; animeSlug: string }) {
  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const activeServer = item.servers[activeServerIndex] ?? null;
  const upsertHistoryItem = useHistoryStore((state) => state.upsertHistoryItem);

  useEffect(() => {
    if (!activeServer?.url) {
      return;
    }

    upsertHistoryItem({
      id: `watch:${item.sourceCategory}:${item.slug}`,
      episodeId: item.slug,
      animeSlug,
      title: item.title,
      thumbnail: item.image,
      href: item.href,
      sourceCategory: item.sourceCategory,
    });
  }, [activeServer?.id, activeServer?.url, animeSlug, item.href, item.image, item.slug, item.sourceCategory, item.title, upsertHistoryItem]);

  return (
    <section className="rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-6">
      <div className="mb-5 flex items-center gap-3">
        <Play className="h-4 w-4 text-[var(--accent)]" />
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Streaming Player</h2>
      </div>

      <div className="space-y-4">
        <div className="overflow-hidden rounded-[24px] border border-[var(--card-border)] bg-[var(--muted)]">
          <div className="relative aspect-video w-full">
            {activeServer?.url ? (
              <iframe
                key={activeServer.id}
                src={activeServer.url}
                title={`${item.title} - ${activeServer.name}`}
                allowFullScreen
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-[var(--muted-foreground)]">
                <p>No playable server is currently available for this entry.</p>
              </div>
            )}
          </div>
        </div>

        {activeServer?.url ? (
          <div className="flex justify-end">
            <Button asChild variant="outline" size="sm">
              <a href={activeServer.url} target="_blank" rel="noopener noreferrer">
                Open externally
              </a>
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {item.servers.length ? (
            item.servers.map((server, index) => (
              <button
                key={server.id}
                type="button"
                onClick={() => setActiveServerIndex(index)}
                className={`rounded-full px-4 py-2 text-sm transition ${index === activeServerIndex ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--card-border)]"}`}
              >
                {server.name}
              </button>
            ))
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">No local server block was found for this entry.</p>
          )}
        </div>
      </div>
    </section>
  );
}
