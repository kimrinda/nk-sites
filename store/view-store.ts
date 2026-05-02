"use client";

import { create } from "zustand";

import type { ViewMode } from "@/types/media";

type ViewStore = {
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
};

export const useViewStore = create<ViewStore>((set) => ({
  viewMode: "grid",
  setViewMode: (viewMode) => set({ viewMode }),
}));
