import type { Metadata } from "next";

import { AdvancedSearch } from "@/components/advanced-search";
import { getSearchFacets } from "@/lib/site-data";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Advanced Search",
    description: "Filter Enka Stream by genres, producers, duration, score, and upload range.",
    path: "/search/advanced",
    type: "website",
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function AdvancedSearchPage() {
  const facets = await getSearchFacets();

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted-foreground)]">Advanced Search</p>
        <h1 className="font-display mt-3 text-4xl font-semibold text-[var(--foreground)] sm:text-5xl">Filter by genres, producers, duration, score, and upload range.</h1>
      </section>
      <AdvancedSearch genres={facets.genres} producers={facets.producers} />
    </div>
  );
}
