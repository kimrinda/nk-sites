"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { startTransition, useDeferredValue, useMemo, useState } from "react";

import { MediaResults } from "@/components/media-results";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useViewStore } from "@/store/view-store";
import type { MediaCardItem } from "@/types/media";

type SearchResponse = {
  items: MediaCardItem[];
  total: number;
  page: number;
  pageSize: number;
};

function getVisiblePages(currentPage: number, totalPages: number) {
  const groupStart = Math.floor((currentPage - 1) / 10) * 10 + 1;
  const groupEnd = Math.min(groupStart + 9, totalPages);
  return Array.from({ length: groupEnd - groupStart + 1 }, (_, index) => groupStart + index);
}

export function AdvancedSearch({ genres, producers }: { genres: string[]; producers: string[] }) {
  const { viewMode } = useViewStore();
  const [q, setQ] = useState("");
  const [logic, setLogic] = useState("or");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedProducers, setSelectedProducers] = useState<string[]>([]);
  const [minDuration, setMinDuration] = useState("");
  const [maxDuration, setMaxDuration] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const deferredQuery = useDeferredValue(q);

  const params = useMemo(() => {
    const search = new URLSearchParams();
    if (deferredQuery) search.set("q", deferredQuery);
    if (selectedGenres.length) search.set("genres", selectedGenres.join(","));
    if (selectedProducers.length) search.set("producers", selectedProducers.join(","));
    if (minDuration) search.set("minDuration", minDuration);
    if (maxDuration) search.set("maxDuration", maxDuration);
    if (minScore) search.set("minScore", minScore);
    if (maxScore) search.set("maxScore", maxScore);
    if (from) search.set("from", from);
    if (to) search.set("to", to);
    search.set("logic", logic);
    search.set("page", String(page));
    search.set("pageSize", "12");
    return search.toString();
  }, [deferredQuery, from, logic, maxDuration, maxScore, minDuration, minScore, page, selectedGenres, selectedProducers, to]);

  const query = useQuery({
    queryKey: ["advanced-search", params],
    queryFn: async () => {
      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) {
        throw new Error("Search request failed");
      }
      return (await response.json()) as SearchResponse;
    },
  });

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / (query.data?.pageSize ?? 12)));
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input value={q} onChange={(event) => startTransition(() => { setQ(event.target.value); setPage(1); })} placeholder="Title, genre, producer" />
          <select className="h-11 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-4 text-sm" value={logic} onChange={(event) => { setLogic(event.target.value); setPage(1); }}>
            <option value="or">Match ANY (OR)</option>
            <option value="and">Match ALL (AND)</option>
          </select>
          <Input type="number" min="0" value={minDuration} onChange={(event) => { setMinDuration(event.target.value); setPage(1); }} placeholder="Min duration (minutes)" />
          <Input type="number" min="0" value={maxDuration} onChange={(event) => { setMaxDuration(event.target.value); setPage(1); }} placeholder="Max duration (minutes)" />
          <Input type="number" min="0" max="10" step="0.1" value={minScore} onChange={(event) => { setMinScore(event.target.value); setPage(1); }} placeholder="Min score" />
          <Input type="number" min="0" max="10" step="0.1" value={maxScore} onChange={(event) => { setMaxScore(event.target.value); setPage(1); }} placeholder="Max score" />
          <Input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
          <Input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <FacetList title="Genres" options={genres} selected={selectedGenres} onToggle={(next) => { setSelectedGenres(next); setPage(1); }} />
          <FacetList title="Producers" options={producers} selected={selectedProducers} onToggle={(next) => { setSelectedProducers(next); setPage(1); }} />
        </div>
      </section>

      <section className={query.isLoading ? (viewMode === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-5") : ""}>
        {query.isLoading ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-[28px] bg-[var(--muted)]" />) : null}
      </section>

      {query.isError ? (
        <section className="rounded-[32px] border border-dashed border-[var(--card-border)] bg-[var(--card)] px-6 py-14 text-center sm:px-8">
          <div className="mx-auto max-w-xl space-y-4">
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">Advanced search failed</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">The advanced search request could not be completed. Try again or simplify the filters.</p>
          </div>
        </section>
      ) : null}

      {!query.isLoading && query.data && query.data.total === 0 ? (
        <section className="rounded-[32px] border border-dashed border-[var(--card-border)] bg-[var(--card)] px-6 py-14 text-center sm:px-8">
          <div className="mx-auto max-w-xl space-y-4">
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">No results found</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">Try different keywords, check spelling, or remove filters to broaden the result set.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button type="button" variant="outline" onClick={() => { setQ(""); setSelectedGenres([]); setSelectedProducers([]); setMinDuration(""); setMaxDuration(""); setMinScore(""); setMaxScore(""); setFrom(""); setTo(""); setLogic("or"); setPage(1); }}>
                Clear filters
              </Button>
              <Button asChild variant="outline">
                <Link href="/">
                  Back to Home
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {!query.isLoading && query.data && query.data.total > 0 ? (
        <>
          <MediaResults items={query.data.items} viewMode={viewMode} compactMobileMeta />
          <div className="flex flex-col gap-4 rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] p-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              Showing {(page - 1) * (query.data.pageSize ?? 12) + 1}-{Math.min(page * (query.data.pageSize ?? 12), query.data.total)} of {query.data.total}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>Prev</Button>
              {visiblePages.map((pageNumber) => (
                <Button key={pageNumber} type="button" variant={pageNumber === page ? "default" : "outline"} size="sm" onClick={() => setPage(pageNumber)}>
                  {pageNumber}
                </Button>
              ))}
              <Button type="button" variant="outline" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FacetList({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (next: string[]) => void }) {
  return (
    <div className="rounded-[28px] border border-[var(--card-border)] bg-[var(--muted)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
        <Button variant="ghost" size="sm" onClick={() => onToggle([])}>Clear</Button>
      </div>
      <div className="max-h-56 overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(active ? selected.filter((value) => value !== option) : [...selected, option])}
                className={`rounded-full px-3 py-2 text-xs ${active ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--card)] text-[var(--muted-foreground)]"}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
