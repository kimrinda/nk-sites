"use client";

import Link from "next/link";
import { BookmarkCheck, RotateCcw, ScanSearch } from "lucide-react";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatProgressLabel, formatRelativeTimeLabel } from "@/lib/format";
import { getBookmarkIdForMedia, getHistoryIdForMedia } from "@/lib/media-identifiers";
import { useBookmarksStore } from "@/store/bookmarks-store";
import { useHistoryStore } from "@/store/history-store";
import type { MediaCardItem } from "@/types/media";

export const MediaCardState = memo(function MediaCardState({ item }: { item: MediaCardItem }) {
  const hydrated = useHydrated();
  const bookmarkId = getBookmarkIdForMedia(item);
  const historyId = getHistoryIdForMedia(item);

  const isBookmarked = useBookmarksStore((state) => Boolean(state.itemMap[bookmarkId]));
  const historyEntry = useHistoryStore((state) => {
    if (item.category === "hanime-index") {
      return state.animeMap[item.slug] ?? null;
    }

    return state.itemMap[historyId] ?? null;
  });
  const resumeHref = useHistoryStore((state) => {
    if (item.category === "hanime-index") {
      return state.animeMap[item.slug]?.href ?? null;
    }

    const historyItem = state.itemMap[historyId];
    return historyItem ? historyItem.href ?? item.href : null;
  });
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
      {isWatched && resumeHref ? (
        <Button asChild variant="outline" size="sm">
          <Link href={resumeHref}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Resume
          </Link>
        </Button>
      ) : null}
    </div>
  );
});
