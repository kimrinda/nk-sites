import type { GenreOption, HanimeSeries, MediaCardItem, MediaItem, SearchFilters } from "@/types/media";

export interface MediaRepository {
  getMediaCardItems(): Promise<MediaCardItem[]>;
  getMediaCardItemsByCategory(category: string): Promise<MediaCardItem[]>;
  getGenreCardItems(slug: string): Promise<MediaCardItem[]>;
  searchMediaCards(filters: SearchFilters): Promise<MediaCardItem[]>;
  getMediaDetailByCategoryAndSlug(category: string, slug: string): Promise<MediaItem | null>;
  getGenres(): Promise<GenreOption[]>;
  getHanimeSeriesBySlug(slug: string): Promise<HanimeSeries | null>;
  getHanimeSeriesByEpisodeSlug(episodeSlug: string): Promise<HanimeSeries | null>;
}
