import type { BookmarkItem, MediaCardItem } from "@/types/media";

export function getBookmarkIdForMedia(item: Pick<MediaCardItem, "category" | "sourceCategory" | "slug">) {
  if (item.category === "hanime-index") {
    return `series:hanime-index:${item.slug}`;
  }

  if (item.category === "hanime") {
    return `episode:${item.sourceCategory}:${item.slug}`;
  }

  return `item:${item.sourceCategory}:${item.slug}`;
}

export function getHistoryIdForMedia(item: Pick<MediaCardItem, "sourceCategory" | "slug">) {
  return `watch:${item.sourceCategory}:${item.slug}`;
}

export function getBookmarkPayloadForMedia(item: Pick<MediaCardItem, "slug" | "title" | "image" | "href" | "sourceCategory" | "category">): Omit<BookmarkItem, "createdAt"> {
  return {
    id: getBookmarkIdForMedia(item),
    animeSlug: item.slug,
    episodeId: item.category === "hanime" ? item.slug : undefined,
    title: item.title,
    thumbnail: item.image,
    href: item.href,
    sourceCategory: item.sourceCategory,
  };
}
