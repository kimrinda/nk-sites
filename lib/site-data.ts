import { unstable_noStore as noStore } from "next/cache";

import { CATEGORY_CONFIG } from "@/lib/constants";
import { createMediaRepository } from "@/lib/repositories";
import { resolveDataRoot } from "@/lib/data-paths";
import type { HanimeSeries, MediaItem, SearchFilters } from "@/types/media";

function getRepository() {
  return createMediaRepository();
}

export async function getCatalogItems() {
  return getRepository().getMediaCardItems();
}

export async function getMediaDetailByCategoryAndSlug(category: string, slug: string): Promise<MediaItem | null> {
  return getRepository().getMediaDetailByCategoryAndSlug(category, slug);
}

export async function getHanimeSeriesBySlug(slug: string): Promise<HanimeSeries | null> {
  return getRepository().getHanimeSeriesBySlug(slug);
}

export async function getHanimeSeriesByEpisodeSlug(episodeSlug: string): Promise<HanimeSeries | null> {
  return getRepository().getHanimeSeriesByEpisodeSlug(episodeSlug);
}

export async function getHomepageData() {
  noStore();

  const items = await getCatalogItems();
  const newest = [...items].sort((a, b) => (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? ""));
  const featuredPool = [...items].sort((a, b) => (b.viewsCount ?? 0) - (a.viewsCount ?? 0)).slice(0, 100);
  const featuredSlides = [...featuredPool]
    .sort(() => Math.random() - 0.5)
    .slice(0, 10)
    .sort((a, b) => (b.viewsCount ?? 0) - (a.viewsCount ?? 0));
  const ongoing = [...items.filter((item) => item.status?.toLowerCase() === "ongoing")]
    .sort(() => Math.random() - 0.5)
    .slice(0, 12);
  const completed = [...items.filter((item) => item.status?.toLowerCase() === "completed")]
    .sort(() => Math.random() - 0.5)
    .slice(0, 12);

  return {
    featuredSlides,
    latest: newest.slice(0, 18),
    ongoing,
    completed,
  };
}

export async function getCategoryPageData(category: string) {
  if (category === "genres") {
    const [genres, items] = await Promise.all([getRepository().getGenres(), getCatalogItems()]);
    const counts = new Map<string, number>();

    for (const item of items) {
      for (const genre of item.genres) {
        const slug = genre.toLowerCase().replace(/\s+/g, "-");
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }
    }

    return {
      title: CATEGORY_CONFIG.genres.label,
      description: CATEGORY_CONFIG.genres.description,
      genres: genres.map((genre) => ({
        ...genre,
        count: counts.get(genre.slug) ?? 0,
      })),
      items: [],
    };
  }

  const config = CATEGORY_CONFIG[category];
  if (!config) {
    return null;
  }

  if (category === "hanime-index") {
    const items = await getRepository().getMediaCardItemsByCategory(category);
    return {
      title: config.label,
      description: config.description,
      items,
      genres: [],
    };
  }

  const items = await getRepository().getMediaCardItemsByCategory(category);

  return {
    title: config.label,
    description: config.description,
    items,
    genres: [],
  };
}

export async function getMediaByCategoryAndSlug(category: string, slug: string) {
  return getRepository().getMediaDetailByCategoryAndSlug(category, slug);
}

export async function getGenreBySlug(slug: string) {
  const genres = await getRepository().getGenres();
  return genres.find((genre) => genre.slug === slug);
}

export async function getGenreItems(slug: string) {
  return getRepository().getGenreCardItems(slug);
}

export async function getSearchFacets() {
  const items = await getCatalogItems();
  const genres = [...new Set(items.flatMap((item) => item.genres))].sort((a, b) => a.localeCompare(b));
  const producers = [...new Set(items.flatMap((item) => item.producers))].sort((a, b) => a.localeCompare(b));
  return { genres, producers };
}

export async function runSearch(filters: SearchFilters) {
  return getRepository().searchMediaCards(filters);
}

export async function getRepositoryStatus() {
  const provider = process.env.NK_DATA_PROVIDER === "prisma" ? "prisma" : "json";
  return {
    provider,
    dataRoot: resolveDataRoot(),
  };
}
