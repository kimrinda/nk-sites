import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";

import { resolveAssetUrl } from "@/lib/assets";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { resolveDataRoot } from "@/lib/data-paths";
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

type RawDetail = {
  slug: string;
  url: string;
  category: string;
  listing?: RawListing;
  content?: {
    title?: string;
    synopsis?: string;
    genre?: string[];
    producers?: string[];
    duration?: string;
    size?: Record<string, string>;
    note?: string;
    views?: string;
    uploaded?: string;
  };
  player?: {
    servers?: Array<{
      name?: string;
      id?: string;
      url?: string;
    }>;
    episodeNav?: {
      prev?: { url?: string } | null;
      next?: { url?: string } | null;
    };
  };
  downloads?: Array<{
    name?: string;
    resolution?: string;
    links?: Array<{ host?: string; url?: string }>;
  }>;
};

type HanimeIndexFile = {
  groups: Record<
    string,
    {
      items: Array<{
        id?: string;
        slug: string;
        title: string;
        url: string;
        tooltip?: {
          title?: string;
          image?: string;
          japaneseName?: string;
          producers?: string[];
          type?: string;
          status?: string;
          genre?: string[];
          duration?: string;
          score?: string;
        };
        details?: {
          japaneseTitle?: string;
          type?: string;
          totalEpisodes?: number;
          status?: string;
          aired?: string;
          producers?: string[];
          genre?: Array<{
            name: string;
            slug: string;
            url: string;
          }>;
          duration?: string;
          score?: number;
          episodes?: Array<{
            title: string;
            url: string;
            slug: string;
            episode?: string;
            date?: string;
            thumbnail?: string;
          }>;
          synopsis?: string;
        };
      }>;
    }
  >;
};

const INDONESIAN_MONTHS: Record<string, number> = {
  januari: 0,
  februari: 1,
  maret: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  desember: 11,
};

const DETAIL_DIRS = ["details/hanime", "details/jav", "details/jav-cosplay", "details/2d-animation", "details/3d-hentai"];

function getDataRoot() {
  return resolveDataRoot();
}

async function readJson<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

function parseViews(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/[^\d]/g, "");
  return normalized ? Number.parseInt(normalized, 10) : undefined;
}

function parseScore(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/,/g, ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseDurationMinutes(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  const hours = normalized.match(/(\d+)\s*jam/);
  const minutes = normalized.match(/(\d+)\s*(?:menit|min)/);

  if (!hours && !minutes) {
    const direct = normalized.match(/^(\d+)$/);
    return direct ? Number.parseInt(direct[1], 10) : undefined;
  }

  return (hours ? Number.parseInt(hours[1], 10) * 60 : 0) + (minutes ? Number.parseInt(minutes[1], 10) : 0);
}

function parseUploadedDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.split(",").slice(1).join(",").trim() || value.trim();
  const indo = trimmed.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (indo) {
    const month = INDONESIAN_MONTHS[indo[2].toLowerCase()];
    if (typeof month === "number") {
      return new Date(Date.UTC(Number.parseInt(indo[3], 10), month, Number.parseInt(indo[1], 10))).toISOString();
    }
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function detailHref(category: string, slug: string) {
  return `/${category}/${slug}`;
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

function getSeriesGenres(item: HanimeIndexFile["groups"][string]["items"][number]): HanimeSeriesGenre[] {
  return item.details?.genre ?? [];
}

function getSeriesGenreNames(item: HanimeIndexFile["groups"][string]["items"][number]) {
  const detailGenres = getSeriesGenres(item).map((genre) => genre.name);
  return detailGenres.length ? detailGenres : (item.tooltip?.genre ?? []);
}

function getSeriesProducers(item: HanimeIndexFile["groups"][string]["items"][number]) {
  return item.details?.producers?.length ? item.details.producers : (item.tooltip?.producers ?? []);
}

function pickSeriesThumbnail(item: HanimeIndexFile["groups"][string]["items"][number]) {
  const previewEpisode = item.details?.episodes?.at(-1) ?? item.details?.episodes?.[0];
  return previewEpisode?.thumbnail ?? item.tooltip?.image ?? "";
}

function normalizeHanimeSeries(
  item: HanimeIndexFile["groups"][string]["items"][number],
  episodeMap: Map<string, MediaItem>,
): HanimeSeries | null {
  const episodes: HanimeSeriesEpisode[] =
    item.details?.episodes?.map((episode) => {
      const resolvedItem = episodeMap.get(episode.slug);
      return {
        slug: episode.slug,
        title: episode.title,
        href: resolvedItem?.href ?? sanitizeExternalPageUrl(episode.url) ?? episode.url,
        isExternal: !resolvedItem,
        episodeLabel: episode.episode,
        dateLabel: episode.date,
        airedAt: parseUploadedDate(episode.date),
        thumbnail: resolveAssetUrl(episode.thumbnail ?? resolvedItem?.image ?? ""),
        resolvedItem: resolvedItem ? toMediaCardItem(resolvedItem) : undefined,
      };
    }) ?? [];

  const latestEpisode = [...episodes].reverse().find((episode) => episode.resolvedItem)?.resolvedItem;

  const normalized = {
    id: item.id,
    slug: item.slug,
    title: item.title,
    href: detailHref("hanime-index", item.slug),
    sourceUrl: item.url,
    thumbnail: resolveAssetUrl(pickSeriesThumbnail(item)),
    coverImage: resolveAssetUrl(item.tooltip?.image ?? ""),
    synopsis: item.details?.synopsis ?? "",
    japaneseTitle: item.details?.japaneseTitle ?? item.tooltip?.japaneseName,
    type: item.details?.type ?? item.tooltip?.type,
    totalEpisodes: item.details?.totalEpisodes,
    status: item.details?.status ?? item.tooltip?.status,
    aired: item.details?.aired,
    duration: item.details?.duration ?? item.tooltip?.duration,
    durationMinutes: parseDurationMinutes(item.details?.duration ?? item.tooltip?.duration),
    score: item.details?.score ?? parseScore(item.tooltip?.score),
    scoreLabel: typeof item.details?.score === "number" ? item.details.score.toFixed(2) : item.tooltip?.score,
    producers: getSeriesProducers(item),
    genres: getSeriesGenres(item),
    episodes,
    latestEpisode,
  };

  return validateHanimeSeries(normalized, `hanime-index:${item.slug}`);
}

function normalizeDetail(detail: RawDetail): MediaItem {
  return {
    slug: detail.slug,
    title: detail.content?.title ?? detail.listing?.title ?? detail.slug,
    href: detailHref(detail.category, detail.slug),
    category: detail.category as MediaItem["category"],
    sourceCategory: detail.category,
    image: resolveAssetUrl(detail.listing?.thumbnail ?? ""),
    synopsis: detail.content?.synopsis ?? "",
    genres: detail.content?.genre ?? [],
    producers: detail.content?.producers?.filter((value) => value && value !== "–") ?? [],
    duration: detail.content?.duration,
    durationMinutes: parseDurationMinutes(detail.content?.duration),
    uploadedAt: parseUploadedDate(detail.content?.uploaded),
    uploadedLabel: detail.content?.uploaded,
    viewsCount: parseViews(detail.content?.views),
    viewsLabel: detail.content?.views,
    note: detail.content?.note,
    sizes: detail.content?.size,
    servers:
      detail.player?.servers?.map((server) => ({
        name: server.name ?? "Server",
        id: server.id ?? server.name ?? "server",
        url: sanitizeStreamUrl(server.url ?? "") ?? "",
      })).filter((server) => Boolean(server.url)) ?? [],
    downloads:
      detail.downloads?.map((group) => ({
        name: group.name ?? group.resolution ?? "Download",
        resolution: group.resolution ?? "Unknown",
        links:
          group.links?.map((link) => ({
            host: link.host ?? "Link",
            url: sanitizeDownloadUrl(link.url ?? "") ?? "",
          })).filter((link) => Boolean(link.url)) ?? [],
      })).filter((group) => group.links.length > 0) ?? [],
    prevSlug: detail.player?.episodeNav?.prev?.url?.split("/").filter(Boolean).at(-1),
    nextSlug: detail.player?.episodeNav?.next?.url?.split("/").filter(Boolean).at(-1),
  };
}

async function readDetailCollection(dataRoot: string, detailsDir: string) {
  const dirBase = path.basename(detailsDir);
  const prefix = dirBase.replace(/-([a-z])/g, (_, character: string) => character.toUpperCase()).replace(/^./, (character) => character.toLowerCase());
  const manifestPath = path.join(dataRoot, detailsDir, `${prefix}Details.manifest.json`);

  try {
    const manifest = await readJson<{ groups: Record<string, { file: string }> }>(manifestPath);
    const files = Object.values(manifest.groups).map((group) => path.join(dataRoot, detailsDir, group.file));
    const parts = await Promise.all(files.map((file) => readJson<RawDetail[]>(file)));
    return parts.flat().map(normalizeDetail);
  } catch {
    const files = await fs.readdir(path.join(dataRoot, detailsDir));
    const jsonFiles = files.filter((file) => file.endsWith(".json") && !file.includes("manifest") && !file.includes("progress") && !file.includes("archive"));
    const parts = await Promise.all(jsonFiles.map((file) => readJson<RawDetail[]>(path.join(dataRoot, detailsDir, file))));
    return parts.flat().map(normalizeDetail);
  }
}

const loadCatalogItems = cache(async () => {
  const dataRoot = getDataRoot();
  const collections = await Promise.all(DETAIL_DIRS.map((dir) => readDetailCollection(dataRoot, dir)));
  const details = collections
    .flat()
    .map((item) => validateMediaItem(item, `detail:${item.category}:${item.slug}`))
    .filter((item): item is MediaItem => Boolean(item));

  const file = await readJson<HanimeIndexFile>(path.join(dataRoot, "hanimeIndex.json"));
  const indexItems = Object.values(file.groups)
    .flatMap((group) => group.items)
    .map((item) => validateMediaCardItem({
      slug: item.slug,
      title: item.tooltip?.title ?? item.title,
      href: detailHref("hanime-index", item.slug),
      category: "hanime-index" as const,
      sourceCategory: "hanime-index",
      image: resolveAssetUrl(item.tooltip?.image ?? ""),
      synopsis: item.details?.synopsis ?? "",
      genres: getSeriesGenreNames(item),
      producers: getSeriesProducers(item),
      duration: item.details?.duration ?? item.tooltip?.duration,
      durationMinutes: parseDurationMinutes(item.details?.duration ?? item.tooltip?.duration),
      uploadedAt: undefined,
      uploadedLabel: undefined,
      viewsCount: undefined,
      viewsLabel: undefined,
      score: typeof item.details?.score === "number" ? item.details.score : parseScore(item.tooltip?.score),
      scoreLabel: typeof item.details?.score === "number" ? item.details.score.toFixed(2) : item.tooltip?.score,
      status: item.details?.status ?? item.tooltip?.status,
      type: item.details?.type ?? item.tooltip?.type,
      japaneseName: item.details?.japaneseTitle ?? item.tooltip?.japaneseName,
      downloadCount: 0,
      note: undefined,
      sizes: undefined,
      servers: [],
      downloads: [],
    }, `index:${item.slug}`))
    .filter((item): item is MediaCardItem => Boolean(item));

  const indexMap = new Map(indexItems.map((item) => [item.slug, item]));
  const mergedDetails = details.map((item) => {
    const index = item.category === "hanime" ? indexMap.get(item.slug) : undefined;

    const merged = index
      ? {
          ...item,
          genres: item.genres.length ? item.genres : index.genres,
          producers: item.producers.length ? item.producers : index.producers,
          duration: item.duration ?? index.duration,
          durationMinutes: item.durationMinutes ?? index.durationMinutes,
          score: index.score,
          scoreLabel: index.scoreLabel,
          status: index.status,
          type: index.type,
          japaneseName: index.japaneseName,
        }
      : item;

    return validateMediaItem(merged, `merged:${item.category}:${item.slug}`);
  });

  const validMergedDetails = mergedDetails.filter((item): item is MediaItem => Boolean(item));
  const hanimeDetailSlugs = new Set(validMergedDetails.filter((item) => item.category === "hanime").map((item) => item.slug));
  const standaloneIndex = indexItems.filter((item) => !hanimeDetailSlugs.has(item.slug));
  return [...validMergedDetails, ...standaloneIndex.map((item) => ({
    ...item,
    note: undefined,
    sizes: undefined,
    servers: [],
    downloads: [],
    prevSlug: undefined,
    nextSlug: undefined,
  }))];
});

const loadMediaCardItems = cache(async () => {
  return (await loadCatalogItems())
    .map((item) => validateMediaCardItem(toMediaCardItem(item), `card:${item.category}:${item.slug}`))
    .filter((item): item is MediaCardItem => Boolean(item));
});

const loadHanimeSeriesMap = cache(async () => {
  const [catalogItems, file] = await Promise.all([
    loadCatalogItems(),
    readJson<HanimeIndexFile>(path.join(getDataRoot(), "hanimeIndex.json")),
  ]);

  const episodeMap = new Map(catalogItems.filter((item) => item.category === "hanime").map((item) => [item.slug, item]));

  return new Map(
    Object.values(file.groups)
      .flatMap((group) => group.items)
      .map((item) => [item.slug, normalizeHanimeSeries(item, episodeMap)])
      .filter((entry): entry is [string, HanimeSeries] => Boolean(entry[1])),
  );
});

const loadGenres = cache(async () => {
  const file = await readJson<Record<string, GenreOption>>(path.join(getDataRoot(), "genresList.json"));
  return Object.values(file).sort((a, b) => a.name.localeCompare(b.name));
});

export class JsonMediaRepository implements MediaRepository {
  async getMediaCardItems() {
    return loadMediaCardItems();
  }

  async getMediaCardItemsByCategory(category: string) {
    if (category === "hanime-index") {
      return (await loadMediaCardItems()).filter((item) => item.category === "hanime-index");
    }

    const config = CATEGORY_CONFIG[category];
    if (!config?.listFile) {
      return [];
    }

    const [items, listings] = await Promise.all([
      loadMediaCardItems(),
      readJson<RawListing[]>(path.join(getDataRoot(), config.listFile)),
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
      }, `fallback:${category}:${item.slug}`))
      .filter((item): item is MediaCardItem => Boolean(item));
  }

  async getGenreCardItems(slug: string) {
    const items = await loadMediaCardItems();
    return items.filter((item) => item.genres.some((genre) => genre.toLowerCase().replace(/\s+/g, "-") === slug));
  }

  async searchMediaCards(filters: SearchFilters) {
    const items = await loadMediaCardItems();
    return filterMedia(applyScope(items, filters.scope), filters).sort((a, b) => {
      const dateDelta = (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? "");
      if (dateDelta !== 0) {
        return dateDelta;
      }

      return (b.viewsCount ?? 0) - (a.viewsCount ?? 0);
    });
  }

  async getMediaDetailByCategoryAndSlug(category: string, slug: string) {
    const items = await loadCatalogItems();
    return items.find((item) => item.slug === slug && item.href.startsWith(`/${category}/`)) ?? null;
  }

  async getGenres() {
    return loadGenres();
  }

  async getHanimeSeriesBySlug(slug: string) {
    const seriesMap = await loadHanimeSeriesMap();
    return seriesMap.get(slug) ?? null;
  }

  async getHanimeSeriesByEpisodeSlug(episodeSlug: string) {
    const seriesMap = await loadHanimeSeriesMap();
    for (const series of seriesMap.values()) {
      if (series.episodes.some((episode) => episode.slug === episodeSlug)) {
        return series;
      }
    }

    return null;
  }
}
