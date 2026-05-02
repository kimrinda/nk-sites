"use client";

import Link from "next/link";
import { BookmarkCheck, RotateCcw, ScanSearch } from "lucide-react";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatProgressLabel, formatRelativeTimeLabel } from "@/lib/format";
import { useBookmarksStore } from "@/store/bookmarks-store";
import { useHistoryStore } from "@/store/history-store";

export const HanimeEpisodeState = memo(function HanimeEpisodeState({ episodeSlug, fallbackHref }: { episodeSlug: string; fallbackHref: string }) {
  const hydrated = useHydrated();
  const bookmarkId = `episode:hanime:${episodeSlug}`;
  const historyId = `watch:hanime:${episodeSlug}`;

  const isBookmarked = useBookmarksStore((state) => Boolean(state.itemMap[bookmarkId]));
  const historyEntry = useHistoryStore((state) => state.itemMap[historyId] ?? null);
  const historyHref = historyEntry?.href ?? fallbackHref;
  const isWatched = Boolean(historyEntry);
  const progressLabel = formatProgressLabel(historyEntry?.progress);
  const watchedLabel = historyEntry ? `Watched ${formatRelativeTimeLabel(historyEntry.lastWatchedAt)}` : null;

  if (!hydrated) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isBookmarked ? (
        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          <BookmarkCheck className="mr-1 h-3 w-3" />
          Bookmarked
        </Badge>
      ) : null}
      {isWatched ? (
        <Badge className="border-sky-500/30 bg-sky-500/10 text-sky-300">
          <ScanSearch className="mr-1 h-3 w-3" />
          {progressLabel ?? watchedLabel ?? "Watched"}
        </Badge>
      ) : null}
      {isWatched ? (
        <Button asChild variant="outline" size="sm">
          <Link href={historyHref}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Resume
          </Link>
        </Button>
      ) : null}
    </div>
  );
});
