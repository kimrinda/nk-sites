"use client";

import { MediaCard } from "@/components/media-card";
import { VirtualizedMediaList } from "@/components/virtualized-media-list";
import type { MediaCardItem, ViewMode } from "@/types/media";

const VIRTUALIZATION_THRESHOLD = 120;

export function MediaResults({ items, viewMode, compactMobileMeta = false }: { items: MediaCardItem[]; viewMode: ViewMode; compactMobileMeta?: boolean }) {
  if (viewMode === "list" && items.length >= VIRTUALIZATION_THRESHOLD) {
    return <VirtualizedMediaList items={items} compactMobileMeta={compactMobileMeta} />;
  }

  return (
    <section className={viewMode === "grid" ? "grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5" : "grid gap-3 sm:gap-4"}>
      {items.map((item) => (
        <MediaCard key={`${item.category}-${item.slug}`} item={item} viewMode={viewMode} compactMobileMeta={compactMobileMeta} />
      ))}
    </section>
  );
}
