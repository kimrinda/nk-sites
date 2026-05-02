"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { BookmarkItem } from "@/types/media";

type BookmarkInput = Omit<BookmarkItem, "createdAt"> & {
  createdAt?: number;
};

function buildBookmarkMap(items: BookmarkItem[]) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

type BookmarksState = {
  items: BookmarkItem[];
  itemMap: Record<string, BookmarkItem>;
  toggleBookmark: (item: BookmarkInput) => void;
  removeBookmark: (id: string) => void;
  renameBookmark: (id: string, customName: string) => void;
  clearBookmarks: () => void;
};

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set) => ({
      items: [],
      itemMap: {},
      toggleBookmark: (item) =>
        set((state) => {
          const exists = state.items.some((entry) => entry.id === item.id);
          if (exists) {
            const nextItems = state.items.filter((entry) => entry.id !== item.id);
            return {
              items: nextItems,
              itemMap: buildBookmarkMap(nextItems),
            };
          }

          const nextItems = [{ ...item, createdAt: item.createdAt ?? Date.now() }, ...state.items];
          return {
            items: nextItems,
            itemMap: buildBookmarkMap(nextItems),
          };
        }),
      removeBookmark: (id) =>
        set((state) => {
          const nextItems = state.items.filter((entry) => entry.id !== id);
          return {
            items: nextItems,
            itemMap: buildBookmarkMap(nextItems),
          };
        }),
      renameBookmark: (id, customName) =>
        set((state) => {
          const nextItems = state.items.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  customName: customName.trim() || undefined,
                }
              : entry,
          );

          return {
            items: nextItems,
            itemMap: buildBookmarkMap(nextItems),
          };
        }),
      clearBookmarks: () => set({ items: [], itemMap: {} }),
    }),
    {
      name: "enka-bookmarks",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      merge: (persistedState, currentState) => {
        const nextItems = (persistedState as Partial<BookmarksState> | undefined)?.items ?? currentState.items;
        return {
          ...currentState,
          ...(persistedState as object),
          items: nextItems,
          itemMap: buildBookmarkMap(nextItems),
        };
      },
    },
  ),
);
