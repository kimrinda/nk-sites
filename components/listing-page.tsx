"use client";

import { Grid2x2, Hash, List, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MediaResults } from "@/components/media-results";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useViewStore } from "@/store/view-store";
import type { GenreOption, MediaCardItem, ViewMode } from "@/types/media";

const PAGE_SIZE = 24;
const VIRTUALIZED_LIST_THRESHOLD = 120;

type SortMode = "default" | "title-asc" | "title-desc";
type StatusFilter = "all" | "completed" | "ongoing";

function parseSortMode(value: string | null): SortMode {
  if (value === "title-asc" || value === "title-desc") {
    return value;
  }

  return "default";
}

function parseStatusFilter(value: string | null): StatusFilter {
  if (value === "completed" || value === "ongoing") {
    return value;
  }

  return "all";
}

function parseViewMode(value: string | null): ViewMode {
  return value === "list" ? "list" : "grid";
}

function parsePageNumber(value: string | null) {
  if (!value) {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const groupStart = Math.floor((currentPage - 1) / 10) * 10 + 1;
  const groupEnd = Math.min(groupStart + 9, totalPages);
  return Array.from({ length: groupEnd - groupStart + 1 }, (_, index) => groupStart + index);
}

export function ListingPage({
  title,
  description,
  items,
  genres,
  mode = "default",
  pageSize = PAGE_SIZE,
  emptyStateQuery,
  compactMobileMeta = false,
}: {
  title: string;
  description: string;
  items: MediaCardItem[];
  genres?: GenreOption[];
  mode?: "default" | "category";
  pageSize?: number;
  emptyStateQuery?: string;
  compactMobileMeta?: boolean;
}) {
  const { viewMode, setViewMode } = useViewStore();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const categorySortMode = parseSortMode(searchParams.get("sort"));
  const categoryStatusFilter = parseStatusFilter(searchParams.get("status"));
  const categoryViewMode = parseViewMode(searchParams.get("view"));
  const categoryPage = parsePageNumber(searchParams.get("page"));

  const activeSortMode = mode === "category" ? categorySortMode : sortMode;
  const activeStatusFilter = mode === "category" ? categoryStatusFilter : statusFilter;
  const activeViewMode = mode === "category" ? categoryViewMode : viewMode;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!filterRef.current?.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }

    if (filterOpen) {
      document.addEventListener("pointerdown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [filterOpen]);

  const updateCategoryParams = useCallback((updates: Partial<Record<"page" | "sort" | "status" | "view", string | null>>, method: "push" | "replace" = "push") => {
    const nextParams = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }

    const queryString = nextParams.toString();
    const href = queryString ? `${pathname}?${queryString}` : pathname;

    if (method === "replace") {
      router.replace(href, { scroll: false });
      return;
    }

    router.push(href, { scroll: false });
  }, [pathname, router, searchParams]);

  const filtered = useMemo(() => {
    let next = [...items];

    if (mode === "default" && query) {
      next = next.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
    }

    if (activeStatusFilter !== "all") {
      next = next.filter((item) => item.status?.toLowerCase() === activeStatusFilter);
    }

    if (activeSortMode === "title-asc") {
      next.sort((left, right) => left.title.localeCompare(right.title));
    } else if (activeSortMode === "title-desc") {
      next.sort((left, right) => right.title.localeCompare(left.title));
    }

    return next;
  }, [activeSortMode, activeStatusFilter, items, mode, query]);

  const usesVirtualizedList = mode !== "category" && activeViewMode === "list" && filtered.length >= VIRTUALIZED_LIST_THRESHOLD;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rawPage = mode === "category" ? categoryPage : page;
  const safePage = Math.min(rawPage, totalPages);
  const visiblePages = getVisiblePages(safePage, totalPages);
  const current = usesVirtualizedList ? filtered : filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const hasResults = filtered.length > 0;
  const hasActiveFilters = activeSortMode !== "default" || activeStatusFilter !== "all";

  const changePage = useCallback((nextPage: number) => {
    const normalizedPage = Math.max(1, Math.min(totalPages, nextPage));

    if (mode === "category") {
      updateCategoryParams({ page: normalizedPage > 1 ? String(normalizedPage) : null });
      return;
    }

    setPage(normalizedPage);
  }, [mode, totalPages, updateCategoryParams]);

  useEffect(() => {
    if (mode !== "category") {
      return;
    }

    const normalizedPage = safePage > 1 ? String(safePage) : null;
    const currentPageParam = searchParams.get("page");
    const normalizedSort = activeSortMode === "default" ? null : activeSortMode;
    const normalizedStatus = activeStatusFilter === "all" ? null : activeStatusFilter;
    const normalizedView = activeViewMode === "grid" ? null : activeViewMode;

    if (
      currentPageParam !== normalizedPage ||
      searchParams.get("sort") !== normalizedSort ||
      searchParams.get("status") !== normalizedStatus ||
      searchParams.get("view") !== normalizedView
    ) {
      updateCategoryParams(
        {
          page: normalizedPage,
          sort: normalizedSort,
          status: normalizedStatus,
          view: normalizedView,
        },
        "replace",
      );
    }
  }, [activeSortMode, activeStatusFilter, activeViewMode, mode, safePage, searchParams, updateCategoryParams]);

  return (
    <div className="space-y-8">
      {mode === "default" ? (
        <section className="rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Category Archive</p>
              <h1 className="font-display text-4xl font-semibold text-[var(--foreground)] sm:text-5xl">{title}</h1>
              <p className="text-sm text-[var(--muted-foreground)] sm:text-base">{description}</p>
            </div>

            {items.length ? (
              <div className="relative z-20 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 sm:w-80">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="pl-10" placeholder="Filter this page" />
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant={viewMode === "grid" ? "default" : "secondary"} size="icon" className="pointer-events-auto" onClick={() => setViewMode("grid")}>
                    <Grid2x2 className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant={viewMode === "list" ? "default" : "secondary"} size="icon" className="pointer-events-auto" onClick={() => setViewMode("list")}>
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">{title}</h1>
          {items.length ? (
            <div className="relative z-20 flex items-center gap-2" ref={filterRef}>
              <Button type="button" variant={filterOpen || activeSortMode !== "default" || activeStatusFilter !== "all" ? "default" : "secondary"} size="icon" className="pointer-events-auto" onClick={() => setFilterOpen((value) => !value)}>
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={activeViewMode === "grid" ? "default" : "secondary"}
                size="icon"
                className="pointer-events-auto"
                onClick={() => {
                  setViewMode("grid");
                  if (mode === "category") {
                    updateCategoryParams({ view: null, page: safePage > 1 ? String(safePage) : null });
                  }
                }}
              >
                <Grid2x2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={activeViewMode === "list" ? "default" : "secondary"}
                size="icon"
                className="pointer-events-auto"
                onClick={() => {
                  setViewMode("list");
                  if (mode === "category") {
                    updateCategoryParams({ view: "list", page: safePage > 1 ? String(safePage) : null });
                  }
                }}
              >
                <List className="h-4 w-4" />
              </Button>

              {filterOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.65rem)] w-72 rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-2xl">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Sort by title</p>
                      <div className="flex flex-wrap gap-2">
                        <FilterChip label="Source order" active={activeSortMode === "default"} onClick={() => mode === "category" ? updateCategoryParams({ sort: null, page: null }) : (setSortMode("default"), setPage(1))} />
                        <FilterChip label="ASC" active={activeSortMode === "title-asc"} onClick={() => mode === "category" ? updateCategoryParams({ sort: "title-asc", page: null }) : (setSortMode("title-asc"), setPage(1))} />
                        <FilterChip label="DESC" active={activeSortMode === "title-desc"} onClick={() => mode === "category" ? updateCategoryParams({ sort: "title-desc", page: null }) : (setSortMode("title-desc"), setPage(1))} />
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-[var(--card-border)] pt-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Status</p>
                      <div className="flex flex-wrap gap-2">
                        <FilterChip label="All" active={activeStatusFilter === "all"} onClick={() => mode === "category" ? updateCategoryParams({ status: null, page: null }) : (setStatusFilter("all"), setPage(1))} />
                        <FilterChip label="Completed" active={activeStatusFilter === "completed"} onClick={() => mode === "category" ? updateCategoryParams({ status: "completed", page: null }) : (setStatusFilter("completed"), setPage(1))} />
                        <FilterChip label="Ongoing" active={activeStatusFilter === "ongoing"} onClick={() => mode === "category" ? updateCategoryParams({ status: "ongoing", page: null }) : (setStatusFilter("ongoing"), setPage(1))} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {genres?.length ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {genres.map((genre) => (
            <Link key={genre.slug} href={`/genres/${genre.slug}`} className="rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] p-5 transition hover:-translate-y-1 hover:bg-[var(--muted)]">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
                  <Hash className="h-4 w-4" />
                  <span>{genre.name}</span>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">{genre.count ?? 0} items</p>
              </div>
            </Link>
          ))}
        </section>
      ) : null}

      {hasResults ? (
        <>
          <MediaResults items={current} viewMode={activeViewMode} compactMobileMeta={compactMobileMeta} />

          <div className="flex flex-col gap-4 rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] p-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              {usesVirtualizedList
                ? `Virtualized list active for ${filtered.length} items.`
                : `Showing ${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length}`}
            </p>
            {!usesVirtualizedList ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={() => changePage(safePage - 1)} disabled={safePage === 1}>Prev</Button>
                {visiblePages.map((pageNumber) => (
                  <Button key={pageNumber} type="button" variant={pageNumber === safePage ? "default" : "outline"} size="sm" onClick={() => changePage(pageNumber)}>
                    {pageNumber}
                  </Button>
                ))}
                <Button type="button" variant="outline" onClick={() => changePage(safePage + 1)} disabled={safePage === totalPages}>Next</Button>
              </div>
            ) : null}
          </div>
        </>
      ) : mode === "category" ? (
        <section className="rounded-[32px] border border-dashed border-[var(--card-border)] bg-[var(--card)] px-6 py-14 text-center sm:px-8">
          <div className="mx-auto max-w-xl space-y-4">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
              <Search className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                {emptyStateQuery ? `No results found for "${emptyStateQuery}"` : "No results found"}
              </h2>
              <p className="text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
                Try different keywords, check spelling, or remove filters to broaden the result set.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {hasActiveFilters ? (
                <Button type="button" variant="outline" onClick={() => updateCategoryParams({ page: null, sort: null, status: null })}>
                  Clear filters
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-sm transition ${active ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--card-border)] hover:text-[var(--foreground)]"}`}
    >
      {label}
    </button>
  );
}
