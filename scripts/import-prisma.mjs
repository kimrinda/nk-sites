import "dotenv/config";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const externalRoot = process.env.NK_EXTERNAL_OUTPUT_ROOT;
const mirrorRoot = path.join(process.cwd(), "data", "source");
const dataRoot = existsSync(path.join(mirrorRoot, "hanimeIndex.json")) ? mirrorRoot : externalRoot;

if (!dataRoot) {
  throw new Error("NK_EXTERNAL_OUTPUT_ROOT is required when mirrored data is unavailable.");
}
const detailDirs = ["details/hanime", "details/jav", "details/jav-cosplay", "details/2d-animation", "details/3d-hentai"];

const INDONESIAN_MONTHS = {
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

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

function slugifyGenre(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseViews(value) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/[^\d]/g, "");
  return normalized ? Number.parseInt(normalized, 10) : undefined;
}

function parseScore(value) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/,/g, ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseDurationMinutes(value) {
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

function parseUploadedDate(value) {
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

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function detailHref(category, slug) {
  return `/${category}/${slug}`;
}

function normalizeDetail(detail) {
  return {
    slug: detail.slug,
    title: detail.content?.title ?? detail.listing?.title ?? detail.slug,
    href: detailHref(detail.category, detail.slug),
    category: detail.category,
    sourceCategory: detail.category,
    sourceUrl: detail.url,
    image: detail.listing?.thumbnail ?? "",
    synopsis: detail.content?.synopsis ?? "",
    genres: uniq(detail.content?.genre ?? []),
    producers: uniq((detail.content?.producers ?? []).filter((value) => value && value !== "–")),
    duration: detail.content?.duration,
    durationMinutes: parseDurationMinutes(detail.content?.duration),
    uploadedAt: parseUploadedDate(detail.content?.uploaded),
    viewsCount: parseViews(detail.content?.views),
    score: undefined,
    scoreLabel: undefined,
    status: undefined,
    type: undefined,
    japaneseName: undefined,
    note: detail.content?.note,
    sizes: detail.content?.size,
    servers:
      detail.player?.servers?.map((server) => ({
        name: server.name ?? "Server",
        id: server.id ?? server.name ?? "server",
        url: server.url ?? "",
      })) ?? [],
    downloads:
      detail.downloads?.map((group) => ({
        name: group.name ?? group.resolution ?? "Download",
        resolution: group.resolution ?? "Unknown",
        links:
          group.links?.map((link) => ({
            host: link.host ?? "Link",
            url: link.url ?? "",
          })) ?? [],
      })) ?? [],
    prevSlug: detail.player?.episodeNav?.prev?.url?.split("/").filter(Boolean).at(-1),
    nextSlug: detail.player?.episodeNav?.next?.url?.split("/").filter(Boolean).at(-1),
  };
}

function getSeriesGenres(item) {
  return item.details?.genre ?? [];
}

function getSeriesGenreNames(item) {
  const detailGenres = getSeriesGenres(item).map((genre) => genre.name);
  return detailGenres.length ? detailGenres : uniq(item.tooltip?.genre ?? []);
}

function getSeriesProducers(item) {
  return item.details?.producers?.length ? uniq(item.details.producers) : uniq(item.tooltip?.producers ?? []);
}

function pickSeriesThumbnail(item) {
  const previewEpisode = item.details?.episodes?.at(-1) ?? item.details?.episodes?.[0];
  return previewEpisode?.thumbnail ?? item.tooltip?.image ?? "";
}

function normalizeHanimeSeries(item, episodeMap) {
  const episodes =
    item.details?.episodes?.map((episode) => {
      const resolvedItem = episodeMap.get(episode.slug);
      return {
        slug: episode.slug,
        title: episode.title,
        href: resolvedItem?.href ?? episode.url,
        isExternal: !resolvedItem,
        episodeLabel: episode.episode,
        dateLabel: episode.date,
        airedAt: parseUploadedDate(episode.date),
        thumbnail: episode.thumbnail ?? resolvedItem?.image ?? "",
        resolvedItem,
        sourceUrl: episode.url,
      };
    }) ?? [];

  const latestEpisode = [...episodes].reverse().find((episode) => episode.resolvedItem)?.resolvedItem;

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    href: detailHref("hanime-index", item.slug),
    sourceUrl: item.url,
    thumbnail: pickSeriesThumbnail(item),
    coverImage: item.tooltip?.image ?? "",
    synopsis: item.details?.synopsis ?? "",
    japaneseTitle: item.details?.japaneseTitle ?? item.tooltip?.japaneseName,
    type: item.details?.type ?? item.tooltip?.type,
    totalEpisodes: item.details?.totalEpisodes,
    status: item.details?.status ?? item.tooltip?.status,
    aired: item.details?.aired,
    duration: item.details?.duration ?? item.tooltip?.duration,
    durationMinutes: parseDurationMinutes(item.details?.duration ?? item.tooltip?.duration),
    score: typeof item.details?.score === "number" ? item.details.score : parseScore(item.tooltip?.score),
    scoreLabel: typeof item.details?.score === "number" ? item.details.score.toFixed(2) : item.tooltip?.score,
    producers: getSeriesProducers(item),
    genres: getSeriesGenres(item),
    episodes,
    latestEpisode,
  };
}

async function readDetailCollection(detailsDir) {
  const dirBase = path.basename(detailsDir);
  const prefix = dirBase.replace(/-([a-z])/g, (_, character) => character.toUpperCase()).replace(/^./, (character) => character.toLowerCase());
  const manifestPath = path.join(dataRoot, detailsDir, `${prefix}Details.manifest.json`);

  try {
    const manifest = await readJson(manifestPath);
    const files = Object.values(manifest.groups).map((group) => path.join(dataRoot, detailsDir, group.file));
    const parts = await Promise.all(files.map((file) => readJson(file)));
    return parts.flat().map(normalizeDetail);
  } catch {
    const files = await fs.readdir(path.join(dataRoot, detailsDir));
    const jsonFiles = files.filter((file) => file.endsWith(".json") && !file.includes("manifest") && !file.includes("progress") && !file.includes("archive"));
    const parts = await Promise.all(jsonFiles.map((file) => readJson(path.join(dataRoot, detailsDir, file))));
    return parts.flat().map(normalizeDetail);
  }
}

async function loadCatalogItems() {
  const details = (await Promise.all(detailDirs.map((dir) => readDetailCollection(dir)))).flat();
  const indexFile = await readJson(path.join(dataRoot, "hanimeIndex.json"));

  const indexItems = Object.values(indexFile.groups)
    .flatMap((group) => group.items)
    .map((item) => ({
      slug: item.slug,
      title: item.tooltip?.title ?? item.title,
      href: detailHref("hanime-index", item.slug),
      category: "hanime-index",
      sourceCategory: "hanime-index",
      sourceUrl: item.url,
      image: item.tooltip?.image ?? "",
      synopsis: item.details?.synopsis ?? "",
      genres: getSeriesGenreNames(item),
      producers: getSeriesProducers(item),
      duration: item.details?.duration ?? item.tooltip?.duration,
      durationMinutes: parseDurationMinutes(item.details?.duration ?? item.tooltip?.duration),
      uploadedAt: undefined,
      viewsCount: undefined,
      score: typeof item.details?.score === "number" ? item.details.score : parseScore(item.tooltip?.score),
      scoreLabel: typeof item.details?.score === "number" ? item.details.score.toFixed(2) : item.tooltip?.score,
      status: item.details?.status ?? item.tooltip?.status,
      type: item.details?.type ?? item.tooltip?.type,
      japaneseName: item.details?.japaneseTitle ?? item.tooltip?.japaneseName,
      note: undefined,
      sizes: undefined,
      servers: [],
      downloads: [],
      prevSlug: undefined,
      nextSlug: undefined,
    }));

  const indexMap = new Map(indexItems.map((item) => [item.slug, item]));
  const mergedDetails = details.map((item) => {
    const index = item.category === "hanime" ? indexMap.get(item.slug) : undefined;

    return index
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
  });

  const hanimeDetailSlugs = new Set(mergedDetails.filter((item) => item.category === "hanime").map((item) => item.slug));
  const standaloneIndex = indexItems.filter((item) => !hanimeDetailSlugs.has(item.slug));

  const uniqueItems = new Map();
  for (const item of [...mergedDetails, ...standaloneIndex]) {
    uniqueItems.set(`${item.category}:${item.slug}`, item);
  }

  return [...uniqueItems.values()];
}

async function loadHanimeSeriesItems(catalogItems) {
  const indexFile = await readJson(path.join(dataRoot, "hanimeIndex.json"));
  const episodeMap = new Map(catalogItems.filter((item) => item.category === "hanime").map((item) => [item.slug, item]));

  return Object.values(indexFile.groups)
    .flatMap((group) => group.items)
    .map((item) => normalizeHanimeSeries(item, episodeMap));
}

function buildGenreCatalog(genreFile, items) {
  const catalog = new Map();
  const usedSlugs = new Set();

  function claimSlug(preferredSlug) {
    let candidate = preferredSlug;
    let counter = 2;

    while (usedSlugs.has(candidate)) {
      candidate = `${preferredSlug}-${counter}`;
      counter += 1;
    }

    usedSlugs.add(candidate);
    return candidate;
  }

  for (const entry of Object.values(genreFile)) {
    const key = entry.name.toLowerCase();
    if (catalog.has(key)) {
      continue;
    }

    catalog.set(key, {
      slug: claimSlug(entry.slug),
      name: entry.name,
      title: entry.title,
    });
  }

  for (const item of items) {
    for (const name of item.genres) {
      const key = name.toLowerCase();
      if (!catalog.has(key)) {
        const preferredSlug = slugifyGenre(name);
        catalog.set(key, {
          slug: claimSlug(preferredSlug),
          name,
          title: `Browse ${name}`,
        });
      }
    }
  }

  return catalog;
}

function toMediaCreateInput(item, genreCatalog) {
  const genres = uniq(item.genres).map((name) => {
    const genre = genreCatalog.get(name.toLowerCase());
    return {
      genre: {
        connect: {
          slug: genre?.slug ?? slugifyGenre(name),
        },
      },
    };
  });

  const producers = uniq(item.producers).map((name) => ({
    producer: {
      connect: {
        name,
      },
    },
  }));

  return {
    slug: item.slug,
    title: item.title,
    category: item.category,
    sourceUrl: item.sourceUrl ?? null,
    synopsis: item.synopsis || null,
    image: item.image || null,
    japaneseName: item.japaneseName || null,
    type: item.type || null,
    status: item.status || null,
    score: typeof item.score === "number" ? item.score : null,
    duration: item.duration || null,
    durationMins: typeof item.durationMinutes === "number" ? item.durationMinutes : null,
    uploadedAt: item.uploadedAt ? new Date(item.uploadedAt) : null,
    viewCount: typeof item.viewsCount === "number" ? item.viewsCount : null,
    note: item.note || null,
    metadata: item.sizes ? { sizes: item.sizes } : undefined,
    genres: genres.length ? { create: genres } : undefined,
    producers: producers.length ? { create: producers } : undefined,
    episodes: item.prevSlug || item.nextSlug ? { create: { prevSlug: item.prevSlug ?? null, nextSlug: item.nextSlug ?? null } } : undefined,
    streams: item.servers.length
      ? {
          create: item.servers.map((server) => ({
            name: server.name,
            externalId: server.id,
            url: server.url,
          })),
        }
      : undefined,
    downloads: item.downloads.length
      ? {
          create: item.downloads.map((download) => ({
            name: download.name,
            resolution: download.resolution,
            links: download.links.length
              ? {
                  create: download.links.map((link) => ({
                    host: link.host,
                    url: link.url,
                  })),
                }
              : undefined,
          })),
        }
      : undefined,
  };
}

function toHanimeSeriesCreateInput(series) {
  return {
    externalId: series.id ?? null,
    slug: series.slug,
    title: series.title,
    sourceUrl: series.sourceUrl ?? null,
    coverImage: series.coverImage || null,
    thumbnail: series.thumbnail || null,
    synopsis: series.synopsis || null,
    japaneseTitle: series.japaneseTitle || null,
    type: series.type || null,
    totalEpisodes: typeof series.totalEpisodes === "number" ? series.totalEpisodes : null,
    status: series.status || null,
    aired: series.aired || null,
    duration: series.duration || null,
    durationMins: typeof series.durationMinutes === "number" ? series.durationMinutes : null,
    score: typeof series.score === "number" ? series.score : null,
    producers: series.producers.length ? series.producers : undefined,
    genres: series.genres.length ? series.genres : undefined,
    episodes: series.episodes.length
      ? {
          create: series.episodes.map((episode) => ({
            slug: episode.slug,
            title: episode.title,
            sourceUrl: episode.isExternal ? episode.href : null,
            episode: episode.episodeLabel ?? null,
            dateLabel: episode.dateLabel ?? null,
            airedAt: episode.airedAt ? new Date(episode.airedAt) : null,
            thumbnail: episode.thumbnail || null,
          })),
        }
      : undefined,
  };
}

async function resetDatabase() {
  await prisma.hanimeSeriesEpisode.deleteMany();
  await prisma.hanimeSeries.deleteMany();
  await prisma.downloadLink.deleteMany();
  await prisma.download.deleteMany();
  await prisma.stream.deleteMany();
  await prisma.episode.deleteMany();
  await prisma.mediaGenre.deleteMany();
  await prisma.mediaProducer.deleteMany();
  await prisma.mediaItem.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.producer.deleteMany();
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function main() {
  console.log(`Import source: ${dataRoot}`);

  const [items, genreFile] = await Promise.all([
    loadCatalogItems(),
    readJson(path.join(dataRoot, "genresList.json")),
  ]);
  const hanimeSeriesItems = await loadHanimeSeriesItems(items);

  const genreCatalog = buildGenreCatalog(genreFile, items);
  const producerNames = [...new Set(items.flatMap((item) => item.producers))].sort((a, b) => a.localeCompare(b));

  console.log(`Items: ${items.length}`);
  console.log(`Hanime series: ${hanimeSeriesItems.length}`);
  console.log(`Genres: ${genreCatalog.size}`);
  console.log(`Producers: ${producerNames.length}`);

  await resetDatabase();

  await prisma.genre.createMany({
    data: [...genreCatalog.values()].map((genre) => ({
      slug: genre.slug,
      name: genre.name,
      title: genre.title,
    })),
  });

  if (producerNames.length) {
    await prisma.producer.createMany({
      data: producerNames.map((name) => ({ name })),
    });
  }

  const batches = chunk(items, 20);
  let completed = 0;

  for (const batch of batches) {
    await prisma.$transaction(
      batch.map((item) =>
        prisma.mediaItem.create({
          data: toMediaCreateInput(item, genreCatalog),
        }),
      ),
    );

    completed += batch.length;
    console.log(`Imported ${completed}/${items.length}`);
  }

  const seriesBatches = chunk(hanimeSeriesItems, 25);
  let importedSeries = 0;

  for (const batch of seriesBatches) {
    await prisma.$transaction(
      batch.map((series) =>
        prisma.hanimeSeries.create({
          data: toHanimeSeriesCreateInput(series),
        }),
      ),
    );

    importedSeries += batch.length;
    console.log(`Imported series ${importedSeries}/${hanimeSeriesItems.length}`);
  }

  console.log("Prisma import complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
