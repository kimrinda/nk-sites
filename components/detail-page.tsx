import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, Eye, Layers3 } from "lucide-react";

import { BookmarkToggleButton } from "@/components/bookmark-toggle-button";
import { HistoryProgressControls } from "@/components/history-progress-controls";
import { StreamPlayerCard } from "@/components/stream-player-card";
import { Button } from "@/components/ui/button";
import { getBookmarkPayloadForMedia } from "@/lib/media-identifiers";
import { formatCompactNumber, formatDateLabel, formatDurationLabel } from "@/lib/format";
import type { HanimeSeries, MediaItem } from "@/types/media";

export function DetailPage({ item, series }: { item: MediaItem; series?: Pick<HanimeSeries, "slug" | "title" | "href"> | null }) {
  const bookmarkAnimeSlug = series?.slug ?? item.slug;
  const historyItem = {
    id: `watch:${item.sourceCategory}:${item.slug}`,
    episodeId: item.slug,
    animeSlug: bookmarkAnimeSlug,
    title: item.title,
    thumbnail: item.image,
    href: item.href,
    sourceCategory: item.sourceCategory,
  };

  return (
    <div className="space-y-8">
      <Link href={`/${item.sourceCategory}`} className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
        <ArrowLeft className="h-4 w-4" />
        Back to {item.sourceCategory}
      </Link>

      <section className="space-y-6 rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-6 lg:p-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">{item.sourceCategory}</p>
          <h1 className="font-display text-3xl font-semibold text-[var(--foreground)] sm:text-5xl">{item.title}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--muted-foreground)] sm:text-base">
            {item.duration ? (
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />{formatDurationLabel(item.duration, item.durationMinutes)}</span>
            ) : null}
            {typeof item.viewsCount === "number" ? (
              <span className="inline-flex items-center gap-2"><Eye className="h-4 w-4" />{formatCompactNumber(item.viewsCount)} views</span>
            ) : null}
            {item.uploadedAt ? (
              <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDateLabel(item.uploadedAt)}</span>
            ) : null}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative flex aspect-[16/10] w-full max-w-3xl items-center justify-center overflow-hidden rounded-[28px] bg-[var(--muted)]">
            {item.image ? <Image src={item.image} alt={item.title} fill sizes="(max-width: 1024px) 100vw, 768px" className="object-contain" /> : null}
          </div>
        </div>

        <div className="space-y-5">
          {item.japaneseName ? <p className="text-sm text-[var(--muted-foreground)]">{item.japaneseName}</p> : null}
          <p className="text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">{item.synopsis || "No synopsis is available in the local detail source for this item."}</p>

          <div className="flex flex-wrap gap-3">
            <BookmarkToggleButton item={{ ...getBookmarkPayloadForMedia(item), animeSlug: bookmarkAnimeSlug }} />
            {series ? (
              <Button asChild variant="outline">
                <Link href={series.href}>
                  <Layers3 className="mr-2 h-4 w-4" />
                  Series Overview
                </Link>
              </Button>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--muted)] p-4">
            <div className="mb-3 space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Resume Progress</p>
              <p className="text-sm text-[var(--foreground)]">Update local watch progress here without opening the history page.</p>
            </div>
            <HistoryProgressControls id={historyItem.id} seedItem={historyItem} showMeta />
          </div>

          <div className="space-y-3 text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
            <p><span className="font-medium text-[var(--foreground)]">Genres:</span> {item.genres.length ? item.genres.join(", ") : "Not tagged"}</p>
            <p><span className="font-medium text-[var(--foreground)]">Producers:</span> {item.producers.length ? item.producers.join(", ") : "Unknown"}</p>
            <p><span className="font-medium text-[var(--foreground)]">Type:</span> {item.type ?? "Unknown"}</p>
            <p><span className="font-medium text-[var(--foreground)]">Download sizes:</span> {item.sizes ? Object.entries(item.sizes).map(([key, value]) => `${key}: ${value}`).join(" | ") : "Unknown"}</p>
            {item.note ? <p><span className="font-medium text-[var(--foreground)]">Note:</span> {item.note}</p> : null}
          </div>
        </div>
      </section>

      <StreamPlayerCard item={item} animeSlug={bookmarkAnimeSlug} />

      <section className="rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-6">
        <h2 className="mb-5 text-xl font-semibold text-[var(--foreground)]">Downloads</h2>
        <div className="grid gap-4">
          {item.downloads.length ? (
            item.downloads.map((group) => (
              <div key={group.name} className="space-y-3 rounded-[24px] border border-[var(--card-border)] bg-[var(--muted)] p-4">
                <h3 className="font-medium text-[var(--foreground)]">{group.resolution}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.links.map((link) => (
                    <a key={`${group.name}-${link.host}`} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full bg-[var(--card)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--background)]">
                      {link.host}
                    </a>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">No download groups were found in the local detail JSON.</p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        {item.prevSlug ? (
          <Button asChild variant="outline">
            <Link href={`/${item.sourceCategory}/${item.prevSlug}`}>Previous Episode</Link>
          </Button>
        ) : null}
        {item.nextSlug ? (
          <Button asChild variant="outline">
            <Link href={`/${item.sourceCategory}/${item.nextSlug}`}>Next Episode</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
