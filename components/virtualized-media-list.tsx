"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MediaCard } from "@/components/media-card";
import type { MediaCardItem } from "@/types/media";

const ROW_HEIGHT = 240;
const OVERSCAN = 4;

export function VirtualizedMediaList({ items, compactMobileMeta = false }: { items: MediaCardItem[]; compactMobileMeta?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(720);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setHeight(element.clientHeight || 720);
    });

    observer.observe(element);
    setHeight(element.clientHeight || 720);

    return () => observer.disconnect();
  }, []);

  const { startIndex, visibleItems } = useMemo(() => {
    const currentStart = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const currentEnd = Math.min(items.length, Math.ceil((scrollTop + height) / ROW_HEIGHT) + OVERSCAN);

    return {
      startIndex: currentStart,
      visibleItems: items.slice(currentStart, currentEnd),
    };
  }, [height, items, scrollTop]);

  return (
    <div
      ref={ref}
      className="h-[72vh] overflow-y-auto rounded-[28px] border border-[var(--card-border)] bg-[var(--muted)]/40 p-3"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * ROW_HEIGHT, position: "relative" }}>
        {visibleItems.map((item, index) => {
          const itemIndex = startIndex + index;
          return (
            <div
              key={`${item.category}-${item.slug}`}
              style={{
                position: "absolute",
                top: itemIndex * ROW_HEIGHT,
                left: 0,
                right: 0,
              }}
            >
              <MediaCard item={item} viewMode="list" compactMobileMeta={compactMobileMeta} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
