"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3, Download, Play, Star } from "lucide-react";
import { memo } from "react";

import { MediaCardState } from "@/components/media-card-state";
import { cn } from "@/lib/cn";
import { formatCompactNumber, formatDateLabel, formatDurationLabel } from "@/lib/format";
import type { MediaCardItem, ViewMode } from "@/types/media";

export const MediaCard = memo(function MediaCard({ item, viewMode = "grid", compactMobileMeta = false }: { item: MediaCardItem; viewMode?: ViewMode; compactMobileMeta?: boolean }) {
  const isList = viewMode === "list";
  const isSeriesCard = item.category === "hanime-index";
  const imageAspect = isSeriesCard ? "aspect-[4/5]" : "aspect-[15/10]";
  const listImageClass = isSeriesCard ? "w-24 shrink-0 self-start aspect-[3/4] sm:w-28 md:w-[15rem]" : "w-32 shrink-0 self-start aspect-[16/10] sm:w-36 md:w-[21rem]";

  const metadataText = [
    item.duration ? formatDurationLabel(item.duration, item.durationMinutes) : null,
    typeof item.viewsCount === "number" ? `${formatCompactNumber(item.viewsCount)} views` : null,
    item.uploadedAt ? formatDateLabel(item.uploadedAt) : null,
    item.scoreLabel ? `Score ${item.scoreLabel}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const taxonomyText = [
    item.genres.slice(0, 3).join(" • "),
    item.producers.slice(0, 2).join(" • "),
  ]
    .filter(Boolean)
    .join("  |  ");

  const normalizedStatus = item.status?.toLowerCase();
  const statusBadge = normalizedStatus === "completed"
    ? {
        label: "Completed",
        tone: "bg-emerald-500 text-white",
        icon: Star,
      }
    : normalizedStatus === "ongoing"
      ? {
          label: "Ongoing",
          tone: "bg-yellow-400 text-black",
          icon: Clock3,
        }
      : null;

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[28px] border border-[var(--card-border)] bg-[var(--card)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_80px_rgba(0,0,0,0.18)]",
        isList ? "flex flex-row" : "flex flex-col",
      )}
    >
      <Link href={item.href} className={cn("relative overflow-hidden bg-[var(--muted)]", isList ? listImageClass : `${imageAspect} w-full`) }>
        {item.image ? (
          <Image src={item.image} alt={item.title} fill sizes={isList ? (isSeriesCard ? "(max-width: 768px) 100vw, 240px" : "(max-width: 768px) 100vw, 336px") : "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"} className={cn("transition duration-500 group-hover:scale-[1.02]", isList ? "object-contain" : "object-cover")} />
        ) : null}
        {statusBadge ? (
          <div className={`absolute right-1.5 top-1.5 inline-flex max-w-[calc(100%-0.75rem)] rotate-2 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] shadow-lg sm:right-3 sm:top-3 sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-[0.14em] ${statusBadge.tone}`}>
            <statusBadge.icon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
            {statusBadge.label}
          </div>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/72 to-transparent p-3 text-white">
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/72">
            <Play className="h-3.5 w-3.5" />
            {item.sourceCategory}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/76">
            <Download className="h-3.5 w-3.5" />
            {item.downloadCount ?? 0}
          </span>
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-2.5 sm:p-3.5 md:p-4">
        <div className="space-y-1.5">
          <Link href={item.href} className="block">
            <h3 className="line-clamp-2 text-sm font-semibold text-[var(--foreground)] transition hover:text-[var(--accent)] sm:text-base md:text-lg">{item.title}</h3>
          </Link>
          <p className="line-clamp-2 text-xs text-[var(--muted-foreground)] sm:text-sm">{item.synopsis || "Open the detail page for stream servers, downloads, and metadata."}</p>
        </div>

        <MediaCardState item={item} />

        {metadataText ? <p className={cn("text-xs text-[var(--muted-foreground)] sm:text-sm", compactMobileMeta ? "hidden sm:block" : "block")}>{metadataText}</p> : null}

        {taxonomyText ? <p className={cn("mt-auto line-clamp-2 text-xs text-[var(--muted-foreground)] sm:text-sm", compactMobileMeta ? "hidden sm:block" : "block")}>{taxonomyText}</p> : null}
      </div>
    </article>
  );
});
