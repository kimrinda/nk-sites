"use client";

import { formatProgressLabel, formatRelativeTimeLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useHistoryStore } from "@/store/history-store";
import type { WatchHistoryItem } from "@/types/media";

const STEPS = [25, 50, 75, 100] as const;

type HistorySeedItem = Omit<WatchHistoryItem, "lastWatchedAt"> & {
  lastWatchedAt?: number;
};

export function HistoryProgressControls({
  id,
  progress,
  seedItem,
  showMeta = false,
}: {
  id: string;
  progress?: number;
  seedItem?: HistorySeedItem;
  showMeta?: boolean;
}) {
  const setProgress = useHistoryStore((state) => state.setProgress);
  const upsertHistoryItem = useHistoryStore((state) => state.upsertHistoryItem);
  const entry = useHistoryStore((state) => state.itemMap[id] ?? null);

  const currentProgress = typeof progress === "number" ? progress : entry?.progress;

  function handleProgressUpdate(step: number) {
    if (entry) {
      setProgress(id, step);
      return;
    }

    if (seedItem) {
      upsertHistoryItem({
        ...seedItem,
        lastWatchedAt: seedItem.lastWatchedAt,
        progress: step,
      });
    }
  }

  return (
    <div className="space-y-3">
      {showMeta ? (
        <div className="space-y-1 text-sm text-[var(--muted-foreground)]">
          <p>{formatProgressLabel(currentProgress) ?? "No progress saved yet"}</p>
          <p>{entry ? `Last watched ${formatRelativeTimeLabel(entry.lastWatchedAt)}` : "Choose a marker to save local progress"}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {STEPS.map((step) => (
          <Button key={step} variant={currentProgress === step ? "default" : "outline"} size="sm" onClick={() => handleProgressUpdate(step)}>
            {step === 100 ? "Done" : `${step}%`}
          </Button>
        ))}
      </div>
    </div>
  );
}
