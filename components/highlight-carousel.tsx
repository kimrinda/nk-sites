"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clapperboard, Drama } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatCompactNumber, formatDateLabel } from "@/lib/format";
import type { MediaCardItem } from "@/types/media";

function slugifyGenre(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function HighlightCarousel({ items }: { items: MediaCardItem[] }) {
  const sampledItems = items;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null);

  function goToIndex(index: number) {
    setCurrentIndex((index + sampledItems.length) % sampledItems.length);
  }

  function goToNext() {
    setCurrentIndex((current) => (current + 1) % sampledItems.length);
  }

  function goToPrevious() {
    setCurrentIndex((current) => (current - 1 + sampledItems.length) % sampledItems.length);
  }

  useEffect(() => {
    if (isPaused || sampledItems.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((current) => (current + 1) % sampledItems.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [isPaused, sampledItems.length]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  function scheduleResume() {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
    }

    resumeTimerRef.current = window.setTimeout(() => {
      setIsPaused(false);
    }, 4500);
  }

  if (!sampledItems.length) {
    return null;
  }

  function handleTouchEnd() {
    if (touchStartXRef.current === null || touchEndXRef.current === null) {
      scheduleResume();
      return;
    }

    const delta = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(delta) < 48) {
      scheduleResume();
      return;
    }

    if (delta > 0) {
      goToNext();
    } else {
      goToPrevious();
    }

    scheduleResume();
  }

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-[var(--card-border)] bg-[var(--card)] shadow-[0_26px_80px_rgba(0,0,0,0.2)]">
      <div
        className="relative h-[clamp(260px,38vh,420px)] overflow-hidden sm:h-[32rem] lg:h-[38rem]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={(event) => {
          setIsPaused(true);
          touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
          touchEndXRef.current = null;
        }}
        onTouchMove={(event) => {
          touchEndXRef.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => scheduleResume()}
      >
        <div className="absolute inset-0 bg-[var(--muted)]" />

        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {sampledItems.map((item, index) => {
            const slideStatusTone = item.status?.toLowerCase() === "completed"
              ? "bg-emerald-500/90 text-white"
              : item.status?.toLowerCase() === "ongoing"
                ? "bg-red-500/90 text-white"
                : "bg-black/60 text-white";

            return (
              <div key={`${item.category}-${item.slug}`} className="relative h-full w-full shrink-0">
                {item.image ? <Image src={item.image} alt={item.title} fill priority={index === 0} sizes="100vw" className="object-cover" /> : null}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,12,14,0.04)_0%,rgba(12,12,14,0.18)_34%,rgba(12,12,14,0.72)_68%,rgba(12,12,14,0.9)_100%)]" />

                {item.status ? (
                  <div className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${slideStatusTone}`}>
                    {item.status}
                  </div>
                ) : null}

                <div className="absolute inset-y-0 right-0 z-10 flex w-full items-center justify-end p-4 sm:p-8 lg:p-10">
                  <div className="flex w-full max-w-[78%] flex-col gap-2 sm:max-w-2xl sm:gap-5">
                    <Link href={item.href} className="block">
                      <h2 className="font-display line-clamp-2 text-2xl font-semibold leading-tight text-white transition hover:text-white/85 sm:text-5xl">{item.title}</h2>
                    </Link>

                    {item.synopsis ? (
                      <p className="hidden max-w-xl text-sm leading-7 text-white/78 sm:line-clamp-4 sm:block sm:text-base">{item.synopsis}</p>
                    ) : null}

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/72 sm:text-base">
                      {item.duration ? <span>{item.duration}</span> : null}
                      {typeof item.viewsCount === "number" ? <span>{formatCompactNumber(item.viewsCount)} views</span> : null}
                      {item.uploadedAt ? <span>{formatDateLabel(item.uploadedAt)}</span> : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-white/88 sm:pt-2 sm:text-sm">
                      {item.genres.map((genre) => (
                        <Link key={`${item.slug}-genre-${genre}`} href={`/genres/${slugifyGenre(genre)}`} className="inline-flex items-center gap-1.5 transition hover:text-white">
                          <Drama className="h-3.5 w-3.5" />
                          {genre}
                        </Link>
                      ))}
                      {item.producers.map((producer) => (
                        <Link key={`${item.slug}-producer-${producer}`} href={`/search?q=${encodeURIComponent(producer)}`} className="inline-flex items-center gap-1.5 transition hover:text-white">
                          <Clapperboard className="h-3.5 w-3.5" />
                          {producer}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="secondary" size="icon" className="absolute left-2 top-1/2 z-20 h-9 w-9 -translate-y-1/2 rounded-full bg-black/45 text-white hover:bg-black/60 sm:left-3 sm:h-10 sm:w-10" onClick={goToPrevious}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="secondary" size="icon" className="absolute right-2 top-1/2 z-20 h-9 w-9 -translate-y-1/2 rounded-full bg-black/45 text-white hover:bg-black/60 sm:right-3 sm:h-10 sm:w-10" onClick={goToNext}>
          <ChevronRight className="h-5 w-5" />
        </Button>

        <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-2 sm:bottom-4">
          {sampledItems.map((item, index) => (
            <button
              key={`${item.category}-${item.slug}`}
              type="button"
              aria-label={`Go to highlight ${index + 1}`}
              onClick={() => goToIndex(index)}
              className={`h-2.5 rounded-full transition-all ${index === currentIndex ? "w-8 bg-white" : "w-2.5 bg-white/45 hover:bg-white/65"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
