export type MediaCategory =
  | "hanime"
  | "hanime-index"
  | "2d-animation"
  | "3d-hentai"
  | "jav"
  | "jav-cosplay";

export type MediaScope = "all" | "featured" | "latest" | "ongoing" | "completed";

export type ViewMode = "grid" | "list";

export interface MediaServer {
  name: string;
  id: string;
  url: string;
}

export interface DownloadLink {
  host: string;
  url: string;
}

export interface DownloadGroup {
  name: string;
  resolution: string;
  links: DownloadLink[];
}

export interface HanimeSeriesGenre {
  name: string;
  slug: string;
  url: string;
}

export interface HanimeSeriesEpisode {
  slug: string;
  title: string;
  href: string;
  isExternal?: boolean;
  episodeLabel?: string;
  dateLabel?: string;
  airedAt?: string;
  thumbnail: string;
  resolvedItem?: MediaCardItem;
}

export interface HanimeSeries {
  id?: string;
  slug: string;
  title: string;
  href: string;
  sourceUrl?: string;
  thumbnail: string;
  coverImage: string;
  synopsis: string;
  japaneseTitle?: string;
  type?: string;
  totalEpisodes?: number;
  status?: string;
  aired?: string;
  duration?: string;
  durationMinutes?: number;
  score?: number;
  scoreLabel?: string;
  producers: string[];
  genres: HanimeSeriesGenre[];
  episodes: HanimeSeriesEpisode[];
  latestEpisode?: MediaCardItem;
}

export interface MediaCardItem {
  slug: string;
  title: string;
  href: string;
  category: MediaCategory;
  sourceCategory: string;
  image: string;
  synopsis: string;
  genres: string[];
  producers: string[];
  duration?: string;
  durationMinutes?: number;
  uploadedAt?: string;
  uploadedLabel?: string;
  viewsCount?: number;
  viewsLabel?: string;
  score?: number;
  scoreLabel?: string;
  status?: string;
  type?: string;
  japaneseName?: string;
  downloadCount?: number;
}

export interface MediaItem extends MediaCardItem {
  note?: string;
  sizes?: Record<string, string>;
  servers: MediaServer[];
  downloads: DownloadGroup[];
  prevSlug?: string;
  nextSlug?: string;
}

export interface GenreOption {
  name: string;
  slug: string;
  url: string;
  title: string;
  count?: number;
}

export interface WatchHistoryItem {
  id: string;
  episodeId: string;
  animeSlug: string;
  title: string;
  thumbnail: string;
  href: string;
  sourceCategory: string;
  lastWatchedAt: number;
  progress?: number;
}

export interface BookmarkItem {
  id: string;
  animeSlug: string;
  episodeId?: string;
  title: string;
  thumbnail: string;
  href: string;
  sourceCategory: string;
  customName?: string;
  createdAt: number;
}

export interface SearchFilters {
  q?: string;
  genres?: string[];
  producers?: string[];
  minDuration?: number;
  maxDuration?: number;
  minScore?: number;
  maxScore?: number;
  from?: string;
  to?: string;
  logic?: "and" | "or";
  category?: string;
  scope?: MediaScope;
}
