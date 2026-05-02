"use client";

import { useHistoryStore } from "@/store/history-store";
import type { WatchHistoryItem } from "@/types/media";

type WatchHistoryInput = Omit<WatchHistoryItem, "lastWatchedAt"> & {
  lastWatchedAt?: number;
};

export function WatchServerLink({ href, className, item, children }: { href: string; className?: string; item: WatchHistoryInput; children: React.ReactNode }) {
  const upsertHistoryItem = useHistoryStore((state) => state.upsertHistoryItem);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        upsertHistoryItem(item);
      }}
    >
      {children}
    </a>
  );
}
