import type { MediaCardItem, SearchFilters } from "@/types/media";

type SearchableMediaItem = Pick<MediaCardItem, "title" | "synopsis" | "japaneseName" | "genres" | "producers" | "durationMinutes" | "score" | "uploadedAt" | "category">;

function includesLoose(source: string, query: string) {
  return source.toLowerCase().includes(query.toLowerCase());
}

function matchesArray(values: string[], selected: string[], logic: "and" | "or") {
  if (!selected.length) {
    return true;
  }

  const normalized = values.map((value) => value.toLowerCase());
  const wanted = selected.map((value) => value.toLowerCase());

  return logic === "and"
    ? wanted.every((value) => normalized.includes(value))
    : wanted.some((value) => normalized.includes(value));
}

export function filterMedia<T extends SearchableMediaItem>(items: T[], filters: SearchFilters): T[] {
  const logic = filters.logic ?? "or";

  return items.filter((item) => {
    if (filters.category && filters.category !== "all" && item.category !== filters.category) {
      return false;
    }

    if (filters.q) {
      const haystack = [
        item.title,
        item.synopsis,
        item.japaneseName,
        ...item.genres,
        ...item.producers,
      ]
        .filter(Boolean)
        .join(" ");

      if (!includesLoose(haystack, filters.q)) {
        return false;
      }
    }

    if (!matchesArray(item.genres, filters.genres ?? [], logic)) {
      return false;
    }

    if (!matchesArray(item.producers, filters.producers ?? [], logic)) {
      return false;
    }

    if (typeof filters.minDuration === "number") {
      if (typeof item.durationMinutes !== "number" || item.durationMinutes < filters.minDuration) {
        return false;
      }
    }

    if (typeof filters.maxDuration === "number") {
      if (typeof item.durationMinutes !== "number" || item.durationMinutes > filters.maxDuration) {
        return false;
      }
    }

    if (typeof filters.minScore === "number") {
      if (typeof item.score !== "number" || item.score < filters.minScore) {
        return false;
      }
    }

    if (typeof filters.maxScore === "number") {
      if (typeof item.score !== "number" || item.score > filters.maxScore) {
        return false;
      }
    }

    if (filters.from) {
      if (!item.uploadedAt || new Date(item.uploadedAt) < new Date(filters.from)) {
        return false;
      }
    }

    if (filters.to) {
      if (!item.uploadedAt || new Date(item.uploadedAt) > new Date(filters.to)) {
        return false;
      }
    }

    return true;
  });
}
