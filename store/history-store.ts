"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { WatchHistoryItem } from "@/types/media";

type HistoryInput = Omit<WatchHistoryItem, "lastWatchedAt"> & {
  lastWatchedAt?: number;
};

function buildHistoryMaps(items: WatchHistoryItem[]) {
  const itemMap: Record<string, WatchHistoryItem> = {};
  const animeMap: Record<string, WatchHistoryItem> = {};

  for (const item of items) {
    itemMap[item.id] = item;
    if (!animeMap[item.animeSlug]) {
      animeMap[item.animeSlug] = item;
    }
  }

  return { itemMap, animeMap };
}

type HistoryState = {
  items: WatchHistoryItem[];
  itemMap: Record<string, WatchHistoryItem>;
  animeMap: Record<string, WatchHistoryItem>;
  upsertHistoryItem: (item: HistoryInput) => void;
  setProgress: (id: string, progress: number) => void;
  removeHistoryItem: (id: string) => void;
  clearHistory: () => void;
};

function clampProgress(progress?: number) {
  if (typeof progress !== "number" || Number.isNaN(progress)) {
    return undefined;
  }

  return Math.min(100, Math.max(0, Math.round(progress)));
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      itemMap: {},
      animeMap: {},
      upsertHistoryItem: (item) =>
        set((state) => {
          const existing = state.items.find((entry) => entry.id === item.id);
          const nextItems = [
            {
              ...existing,
              ...item,
              lastWatchedAt: item.lastWatchedAt ?? Date.now(),
              progress: clampProgress(item.progress) ?? existing?.progress,
            },
            ...state.items.filter((entry) => entry.id !== item.id),
          ].slice(0, 100);

          return {
            items: nextItems,
            ...buildHistoryMaps(nextItems),
          };
        }),
      setProgress: (id, progress) =>
        set((state) => {
          const nextItems = state.items.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  progress: clampProgress(progress),
                }
              : entry,
          );

          return {
            items: nextItems,
            ...buildHistoryMaps(nextItems),
          };
        }),
      removeHistoryItem: (id) =>
        set((state) => {
          const nextItems = state.items.filter((entry) => entry.id !== id);
          return {
            items: nextItems,
            ...buildHistoryMaps(nextItems),
          };
        }),
      clearHistory: () => set({ items: [], itemMap: {}, animeMap: {} }),
    }),
    {
      name: "enka-history",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      merge: (persistedState, currentState) => {
        const nextItems = (persistedState as Partial<HistoryState> | undefined)?.items ?? currentState.items;
        return {
          ...currentState,
          ...(persistedState as object),
          items: nextItems,
          ...buildHistoryMaps(nextItems),
        };
      },
    },
  ),
);
