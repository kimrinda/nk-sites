"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useBookmarksStore } from "@/store/bookmarks-store";
import type { BookmarkItem } from "@/types/media";

type BookmarkInput = Omit<BookmarkItem, "createdAt"> & {
  createdAt?: number;
};

export function BookmarkToggleButton({ item, className, compact = false }: { item: BookmarkInput; className?: string; compact?: boolean }) {
  const isBookmarked = useBookmarksStore((state) => state.items.some((entry) => entry.id === item.id));
  const toggleBookmark = useBookmarksStore((state) => state.toggleBookmark);

  return (
    <Button
      type="button"
      variant={isBookmarked ? "default" : "secondary"}
      className={cn(compact ? "gap-2" : "gap-2 min-w-[10rem]" , className)}
      onClick={() => toggleBookmark(item)}
    >
      {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {compact ? null : isBookmarked ? "Bookmarked" : "Bookmark"}
    </Button>
  );
}
