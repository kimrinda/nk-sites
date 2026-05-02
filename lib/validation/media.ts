import { z } from "zod";

const mediaCategorySchema = z.enum(["hanime", "hanime-index", "2d-animation", "3d-hentai", "jav", "jav-cosplay"]);

const mediaServerSchema = z.object({
  name: z.string().min(1),
  id: z.string().min(1),
  url: z.string(),
});

const downloadLinkSchema = z.object({
  host: z.string().min(1),
  url: z.string(),
});

const downloadGroupSchema = z.object({
  name: z.string().min(1),
  resolution: z.string().min(1),
  links: z.array(downloadLinkSchema),
});

export const mediaCardItemSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  href: z.string().min(1),
  category: mediaCategorySchema,
  sourceCategory: z.string().min(1),
  image: z.string(),
  synopsis: z.string(),
  genres: z.array(z.string()),
  producers: z.array(z.string()),
  duration: z.string().optional(),
  durationMinutes: z.number().int().nonnegative().optional(),
  uploadedAt: z.string().optional(),
  uploadedLabel: z.string().optional(),
  viewsCount: z.number().int().nonnegative().optional(),
  viewsLabel: z.string().optional(),
  score: z.number().optional(),
  scoreLabel: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  japaneseName: z.string().optional(),
  downloadCount: z.number().int().nonnegative().optional(),
});

export const mediaItemSchema = mediaCardItemSchema.extend({
  note: z.string().optional(),
  sizes: z.record(z.string(), z.string()).optional(),
  servers: z.array(mediaServerSchema),
  downloads: z.array(downloadGroupSchema),
  prevSlug: z.string().optional(),
  nextSlug: z.string().optional(),
});

const hanimeSeriesGenreSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  url: z.string().min(1),
});

const hanimeSeriesEpisodeSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  href: z.string().min(1),
  isExternal: z.boolean().optional(),
  episodeLabel: z.string().optional(),
  dateLabel: z.string().optional(),
  airedAt: z.string().optional(),
  thumbnail: z.string(),
  resolvedItem: mediaCardItemSchema.optional(),
});

export const hanimeSeriesSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  href: z.string().min(1),
  sourceUrl: z.string().optional(),
  thumbnail: z.string(),
  coverImage: z.string(),
  synopsis: z.string(),
  japaneseTitle: z.string().optional(),
  type: z.string().optional(),
  totalEpisodes: z.number().int().nonnegative().optional(),
  status: z.string().optional(),
  aired: z.string().optional(),
  duration: z.string().optional(),
  durationMinutes: z.number().int().nonnegative().optional(),
  score: z.number().optional(),
  scoreLabel: z.string().optional(),
  producers: z.array(z.string()),
  genres: z.array(hanimeSeriesGenreSchema),
  episodes: z.array(hanimeSeriesEpisodeSchema),
  latestEpisode: mediaCardItemSchema.optional(),
});

function logInvalidRecord(type: string, context: string, issues: z.ZodIssue[]) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.warn(`[validation:${type}] skipped invalid record at ${context}`, issues);
}

export function validateMediaCardItem(value: unknown, context: string) {
  const result = mediaCardItemSchema.safeParse(value);
  if (!result.success) {
    logInvalidRecord("media-card", context, result.error.issues);
    return null;
  }

  return result.data;
}

export function validateMediaItem(value: unknown, context: string) {
  const result = mediaItemSchema.safeParse(value);
  if (!result.success) {
    logInvalidRecord("media-detail", context, result.error.issues);
    return null;
  }

  return result.data;
}

export function validateHanimeSeries(value: unknown, context: string) {
  const result = hanimeSeriesSchema.safeParse(value);
  if (!result.success) {
    logInvalidRecord("hanime-series", context, result.error.issues);
    return null;
  }

  return result.data;
}
