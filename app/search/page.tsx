import type { Metadata } from "next";

import { ListingPage } from "@/components/listing-page";
import { runSearch } from "@/lib/site-data";
import { buildMetadata } from "@/lib/seo";
import type { SearchFilters } from "@/types/media";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : undefined;
  const filters: SearchFilters = {
    q: query,
    scope: typeof params.scope === "string" ? (params.scope as SearchFilters["scope"]) : "all",
  };
  const items = query ? await runSearch(filters) : [];

  return buildMetadata({
    title: query ? `Search Results for "${query}"` : "Search Results",
    description: query ? `Search results for "${query}" on Enka Stream.` : "Search Enka Stream for hanime, anime, and related content.",
    path: query ? `/search?q=${encodeURIComponent(query)}` : "/search",
    image: items[0]?.image,
    type: "website",
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : undefined;
  const filters: SearchFilters = {
    q: query,
    scope: typeof params.scope === "string" ? (params.scope as SearchFilters["scope"]) : "all",
  };

  const items = await runSearch(filters);

  return <ListingPage title="Search Results" description="Unified browsing across all loaded local datasets." items={items} mode="category" pageSize={12} emptyStateQuery={query} compactMobileMeta />;
}
