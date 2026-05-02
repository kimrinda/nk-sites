import type { Prisma } from "@prisma/client";
import { promises as fs } from "node:fs";
import path from "node:path";

import { resolveAssetUrl } from "@/lib/assets";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { resolveDataRoot } from "@/lib/data-paths";
import { prisma } from "@/lib/prisma";
import { filterMedia } from "@/lib/search";
import type { MediaRepository } from "@/lib/repositories/types";
import { sanitizeDownloadUrl, sanitizeExternalPageUrl, sanitizeStreamUrl } from "@/lib/security";
import { validateHanimeSeries, validateMediaCardItem, validateMediaItem } from "@/lib/validation/media";
import type { GenreOption, HanimeSeries, HanimeSeriesEpisode, HanimeSeriesGenre, MediaCardItem, MediaItem, SearchFilters } from "@/types/media";

type RawListing = {
  slug: string;
  title: string;
  thumbnail: string;
  url: string;
};

type PrismaMediaCardRecord = Prisma.MediaItemGetPayload<{
  include: {
    genres: { include: { genre: true } };
    producers: { include: { producer: true } };
  };
}>;

type PrismaMediaRecord = Prisma.MediaItemGetPayload<{
  include: {
    genres: { include: { genre: true } };
    producers: { include: { producer: true } };
    streams: true;
    downloads: { include: { links: true } };
    episodes: true;
  };
}>;

type PrismaGenreRecord = Prisma.GenreGetPayload<Record<string, never>>;

type PrismaHanimeSeriesRecord = Prisma.HanimeSeriesGetPayload<{
  include: {
    episodes: true;
  };
}>;

async function readJson<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

function getSizes(metadata: Prisma.JsonValue | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  const sizes = (metadata as Record<string, unknown>).sizes;
  if (!sizes || typeof sizes !== "object" || Array.isArray(sizes)) {
    return undefined;
  }

  const entries = Object.entries(sizes).filter((entry): entry is [string, string] => typeof entry[1] === "string");
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function toMediaCardItem(item: MediaItem): MediaCardItem {
  return {
    slug: item.slug,
    title: item.title,
    href: item.href,
    category: item.category,
    sourceCategory: item.sourceCategory,
    image: resolveAssetUrl(item.image),
    synopsis: item.synopsis,
    genres: item.genres,
    producers: item.producers,
    duration: item.duration,
    durationMinutes: item.durationMinutes,
    uploadedAt: item.uploadedAt,
    uploadedLabel: item.uploadedLabel,
    viewsCount: item.viewsCount,
    viewsLabel: item.viewsLabel,
    score: item.score,
    scoreLabel: item.scoreLabel,
    status: item.status,
    type: item.type,
    japaneseName: item.japaneseName,
    downloadCount: item.downloads.length,
  };
}

function applyScope<T extends MediaCardItem>(items: T[], scope: SearchFilters["scope"] = "all") {
  switch (scope) {
    case "featured":
      return [...items].sort((a, b) => (b.viewsCount ?? 0) - (a.viewsCount ?? 0)).slice(0, 100);
    case "latest":
      return [...items].sort((a, b) => (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? ""));
    case "ongoing":
      return items.filter((item) => item.status?.toLowerCase() === "ongoing");
    case "completed":
      return items.filter((item) => item.status?.toLowerCase() === "completed");
    default:
      return items;
  }
}

function getJsonStringArray(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function getJsonGenreArray(value: Prisma.JsonValue | null | undefined): HanimeSeriesGenre[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const genres: HanimeSeriesGenre[] = [];

  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }

    const record = entry as Record<string, unknown>;
    if (typeof record.name !== "string" || typeof record.slug !== "string" || typeof record.url !== "string") {
      continue;
    }

    genres.push({
      name: record.name,
      slug: record.slug,
      url: record.url,
    });
  }

  return genres;
}

function normalizePrismaItem(record: PrismaMediaRecord): MediaItem | null {
  const category = record.category as MediaItem["category"];

  const normalized = {
    slug: record.slug,
    title: record.title,
    href: `/${record.category}/${record.slug}`,
    category,
    sourceCategory: record.category,
    image: resolveAssetUrl(record.image ?? ""),
    synopsis: record.synopsis ?? "",
    genres: record.genres.map((entry) => entry.genre.name),
    producers: record.producers.map((entry) => entry.producer.name),
    duration: record.duration ?? undefined,
    durationMinutes: record.durationMins ?? undefined,
    uploadedAt: record.uploadedAt?.toISOString() ?? undefined,
    uploadedLabel: undefined,
    viewsCount: record.viewCount ?? undefined,
    viewsLabel: undefined,
    score: record.score ?? undefined,
    scoreLabel: typeof record.score === "number" ? record.score.toFixed(2) : undefined,
    status: record.status ?? undefined,
    type: record.type ?? undefined,
    japaneseName: record.japaneseName ?? undefined,
    note: record.note ?? undefined,
    sizes: getSizes(record.metadata),
    servers: record.streams.map((stream) => ({
      name: stream.name,
      id: stream.externalId ?? stream.id.toString(),
      url: sanitizeStreamUrl(stream.url) ?? "",
    })).filter((stream) => Boolean(stream.url)),
    downloads: record.downloads.map((download) => ({
      name: download.name,
      resolution: download.resolution ?? "Unknown",
      links: download.links.map((link) => ({
        host: link.host,
        url: sanitizeDownloadUrl(link.url) ?? "",
      })).filter((link) => Boolean(link.url)),
    })).filter((download) => download.links.length > 0),
    prevSlug: record.episodes[0]?.prevSlug ?? undefined,
    nextSlug: record.episodes[0]?.nextSlug ?? undefined,
  };

  return validateMediaItem(normalized, `prisma-detail:${record.category}:${record.slug}`);
}

function normalizePrismaCardItem(record: PrismaMediaCardRecord): MediaCardItem | null {
  const normalized = {
    slug: record.slug,
    title: record.title,
    href: `/${record.category}/${record.slug}`,
    category: record.category as MediaCardItem["category"],
    sourceCategory: record.category,
    image: resolveAssetUrl(record.image ?? ""),
    synopsis: record.synopsis ?? "",
    genres: record.genres.map((entry) => entry.genre.name),
    producers: record.producers.map((entry) => entry.producer.name),
    duration: record.duration ?? undefined,
    durationMinutes: record.durationMins ?? undefined,
    uploadedAt: record.uploadedAt?.toISOString() ?? undefined,
    uploadedLabel: undefined,
    viewsCount: record.viewCount ?? undefined,
    viewsLabel: undefined,
    score: record.score ?? undefined,
    scoreLabel: typeof record.score === "number" ? record.score.toFixed(2) : undefined,
    status: record.status ?? undefined,
    type: record.type ?? undefined,
      japaneseName: record.japaneseName ?? undefined,
      downloadCount: 0,
    };

  return validateMediaCardItem(normalized, `prisma-card:${record.category}:${record.slug}`);
}

function normalizeHanimeSeries(record: PrismaHanimeSeriesRecord, episodeMap: Map<string, MediaItem>): HanimeSeries {
  const episodes: HanimeSeriesEpisode[] = record.episodes.map((episode) => {
    const resolvedItem = episodeMap.get(episode.slug);
    return {
      slug: episode.slug,
      title: episode.title,
      href: resolvedItem?.href ?? sanitizeExternalPageUrl(episode.sourceUrl ?? "") ?? `/hanime/${episode.slug}`,
      isExternal: !resolvedItem && Boolean(episode.sourceUrl),
      episodeLabel: episode.episode ?? undefined,
      dateLabel: episode.dateLabel ?? undefined,
      airedAt: episode.airedAt?.toISOString() ?? undefined,
      thumbnail: resolveAssetUrl(episode.thumbnail ?? resolvedItem?.image ?? ""),
      resolvedItem: resolvedItem ? toMediaCardItem(resolvedItem) : undefined,
    };
  });

  const latestEpisode = [...episodes].reverse().find((episode) => episode.resolvedItem)?.resolvedItem;

  const normalized = {
    id: record.externalId ?? record.id.toString(),
    slug: record.slug,
    title: record.title,
    href: `/hanime-index/${record.slug}`,
    sourceUrl: record.sourceUrl ?? undefined,
    thumbnail: resolveAssetUrl(record.thumbnail ?? ""),
    coverImage: resolveAssetUrl(record.coverImage ?? ""),
    synopsis: record.synopsis ?? "",
    japaneseTitle: record.japaneseTitle ?? undefined,
    type: record.type ?? undefined,
    totalEpisodes: record.totalEpisodes ?? undefined,
    status: record.status ?? undefined,
    aired: record.aired ?? undefined,
    duration: record.duration ?? undefined,
    durationMinutes: record.durationMins ?? undefined,
    score: record.score ?? undefined,
    scoreLabel: typeof record.score === "number" ? record.score.toFixed(2) : undefined,
    producers: getJsonStringArray(record.producers),
    genres: getJsonGenreArray(record.genres),
    episodes,
    latestEpisode,
  };

  return validateHanimeSeries(normalized, `prisma-series:${record.slug}`) ?? normalized;
}

export class PrismaMediaRepository implements MediaRepository {
  async getMediaCardItems() {
    const records = await prisma.mediaItem.findMany({
      include: {
        genres: { include: { genre: true } },
        producers: { include: { producer: true } },
      },
    });

    return records.map(normalizePrismaCardItem).filter((item): item is MediaCardItem => Boolean(item));
  }

  async getMediaCardItemsByCategory(category: string) {
    if (category === "hanime-index") {
      return (await this.getMediaCardItems()).filter((item) => item.category === "hanime-index");
    }

    const config = CATEGORY_CONFIG[category];
    if (!config?.listFile) {
      return [];
    }

    const [items, listings] = await Promise.all([
      this.getMediaCardItems(),
      readJson<RawListing[]>(path.join(resolveDataRoot(), config.listFile)),
    ]);
    const byKey = new Map(items.map((item) => [`${item.sourceCategory}:${item.slug}`, item]));

    return listings
      .map((item) => byKey.get(`${category}:${item.slug}`) ?? validateMediaCardItem({
        slug: item.slug,
        title: item.title,
        href: `/${category}/${item.slug}`,
        category: config.category,
        sourceCategory: category,
        image: item.thumbnail,
        synopsis: "",
        genres: [],
        producers: [],
      }, `prisma-fallback:${category}:${item.slug}`))
      .filter((item): item is MediaCardItem => Boolean(item));
  }

  async getGenreCardItems(slug: string) {
    const items = await this.getMediaCardItems();
    return items.filter((item) => item.genres.some((genre) => genre.toLowerCase().replace(/\s+/g, "-") === slug));
  }

  async searchMediaCards(filters: SearchFilters) {
    const items = await this.getMediaCardItems();
    return filterMedia(applyScope(items, filters.scope), filters).sort((a, b) => {
      const dateDelta = (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? "");
      if (dateDelta !== 0) {
        return dateDelta;
      }

      return (b.viewsCount ?? 0) - (a.viewsCount ?? 0);
    });
  }

  async getMediaDetailByCategoryAndSlug(category: string, slug: string) {
    const records = await prisma.mediaItem.findMany({
      where: {
        category,
        slug,
      },
      include: {
        genres: { include: { genre: true } },
        producers: { include: { producer: true } },
        streams: true,
        downloads: { include: { links: true } },
        episodes: true,
      },
    });

    const item = records[0];
    return item ? normalizePrismaItem(item) : null;
  }

  async getGenres() {
    const records = await prisma.genre.findMany({ orderBy: { name: "asc" } });
    return records.map((record: PrismaGenreRecord): GenreOption => ({
      name: record.name,
      slug: record.slug,
      url: `/genres/${record.slug}`,
      title: record.title ?? `Browse ${record.name}`,
    }));
  }

  async getHanimeSeriesBySlug(slug: string) {
    const record = await prisma.hanimeSeries.findUnique({
      where: { slug },
      include: { episodes: { orderBy: [{ airedAt: "asc" }, { id: "asc" }] } },
    });

    if (!record) {
      return null;
    }

    const episodeSlugs = record.episodes.map((episode) => episode.slug);
    const episodeRecords = await prisma.mediaItem.findMany({
      where: {
        category: "hanime",
        slug: { in: episodeSlugs },
      },
      include: {
        genres: { include: { genre: true } },
        producers: { include: { producer: true } },
        streams: true,
        downloads: { include: { links: true } },
        episodes: true,
      },
    });

    const episodeMap = new Map(
      episodeRecords
        .map((item) => {
          const normalized = normalizePrismaItem(item);
          return normalized ? [item.slug, normalized] as const : null;
        })
        .filter((entry): entry is readonly [string, MediaItem] => Boolean(entry)),
    );
    return normalizeHanimeSeries(record, episodeMap);
  }

  async getHanimeSeriesByEpisodeSlug(episodeSlug: string) {
    const episode = await prisma.hanimeSeriesEpisode.findFirst({
      where: { slug: episodeSlug },
      select: { series: { select: { slug: true } } },
    });

    if (!episode?.series.slug) {
      return null;
    }

    return this.getHanimeSeriesBySlug(episode.series.slug);
  }
}
