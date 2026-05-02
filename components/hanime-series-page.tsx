import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Drama, Play } from "lucide-react";

import { BookmarkToggleButton } from "@/components/bookmark-toggle-button";
import { HanimeEpisodeState } from "@/components/hanime-episode-state";
import { formatDateLabel, formatDurationLabel } from "@/lib/format";
import type { HanimeSeries } from "@/types/media";

export function HanimeSeriesPage({ series }: { series: HanimeSeries }) {
  return (
    <div className="space-y-8">
      <Link href="/hanime-index" className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
        <ArrowLeft className="h-4 w-4" />
        Back to hentai list
      </Link>

      <section className="overflow-hidden rounded-[36px] border border-[var(--card-border)] bg-[var(--card)]">
        <div className="relative min-h-[18rem] overflow-hidden border-b border-[var(--card-border)]">
          {series.coverImage ? <Image src={series.coverImage} alt={series.title} fill sizes="100vw" className="object-cover" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/15" />
          <div className="relative flex min-h-[18rem] items-end p-6 sm:p-8">
            <div className="max-w-4xl space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Series Overview</p>
              <h1 className="font-display text-4xl font-semibold text-white sm:text-6xl">{series.title}</h1>
              {series.japaneseTitle ? <p className="text-sm text-white/70 sm:text-base">{series.japaneseTitle}</p> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:p-8">
          <div className="space-y-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[var(--muted)]">
              {series.thumbnail ? <Image src={series.thumbnail} alt={series.title} fill sizes="(max-width: 1024px) 100vw, 280px" className="object-cover" /> : null}
            </div>

            <BookmarkToggleButton
              item={{
                id: `series:hanime-index:${series.slug}`,
                animeSlug: series.slug,
                title: series.title,
                thumbnail: series.thumbnail || series.coverImage,
                href: series.href,
                sourceCategory: "hanime-index",
              }}
              className="w-full justify-center"
            />
          </div>

          <div className="space-y-5">
            <p className="text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">{series.synopsis || "No synopsis is available in the updated hanime index details payload for this title."}</p>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--muted-foreground)] sm:text-base">
              {series.status ? <span>{series.status}</span> : null}
              {series.scoreLabel ? <span>Score {series.scoreLabel}</span> : null}
              {series.totalEpisodes ? <span>{series.totalEpisodes} episodes</span> : null}
              {series.duration ? <span>{formatDurationLabel(series.duration, series.durationMinutes)}</span> : null}
              {series.aired ? <span>{series.aired}</span> : null}
            </div>

            <div className="space-y-3 text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
              <div>
                <span className="font-medium text-[var(--foreground)]">Genres:</span>{" "}
                {series.genres.length ? (
                  <span className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                    {series.genres.map((genre) => (
                      <Link key={genre.slug} href={`/genres/${genre.slug}`} className="inline-flex items-center gap-1.5 transition hover:text-[var(--foreground)]">
                        <Drama className="h-3.5 w-3.5" />
                        {genre.name}
                      </Link>
                    ))}
                  </span>
                ) : (
                  "Not tagged"
                )}
              </div>

              <p><span className="font-medium text-[var(--foreground)]">Producers:</span> {series.producers.length ? series.producers.join(", ") : "Unknown"}</p>
              <p><span className="font-medium text-[var(--foreground)]">Type:</span> {series.type ?? "Unknown"}</p>
              <p><span className="font-medium text-[var(--foreground)]">Aired:</span> {series.aired ?? "Unknown"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-6">
        <div className="mb-5 flex items-center gap-3">
          <Play className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Episode List</h2>
        </div>

        {series.episodes.length ? (
          <div className="grid gap-4">
            {series.episodes.map((episode) => {
              const episodeHref = episode.resolvedItem?.href ?? episode.href;
              const synopsis = episode.resolvedItem?.synopsis || "No episode synopsis is available from the current local detail source.";

              const cardContent = (
                <>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] bg-[var(--card)]">
                    {episode.thumbnail ? <Image src={episode.thumbnail} alt={episode.title} fill sizes="(max-width: 768px) 100vw, 180px" className="object-contain" /> : null}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
                        {episode.episodeLabel ? <span>{episode.episodeLabel}</span> : null}
                        {episode.airedAt ? <span>{formatDateLabel(episode.airedAt)}</span> : null}
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)] transition group-hover:text-[var(--accent)]">{episode.title}</h3>
                      <p className="line-clamp-3 text-sm leading-6 text-[var(--muted-foreground)]">{synopsis}</p>
                    </div>
                  </div>
                </>
              );

              return (
                <article key={episode.slug} className="rounded-[26px] border border-[var(--card-border)] bg-[var(--muted)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/30">
                  {episode.isExternal ? (
                    <a href={episodeHref} target="_blank" rel="noopener noreferrer" className="group grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                      {cardContent}
                    </a>
                  ) : (
                    <Link href={episodeHref} className="group grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                      {cardContent}
                    </Link>
                  )}

                  <div className="mt-3 border-t border-[var(--card-border)] pt-3">
                    <HanimeEpisodeState episodeSlug={episode.slug} fallbackHref={episodeHref} />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">No episode list was found in the current hanime index details payload.</p>
        )}
      </section>
    </div>
  );
}
