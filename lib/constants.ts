import type { MediaCategory } from "@/types/media";

export const SITE_NAME = "EnKa Stream";

export const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    category: MediaCategory;
    listFile?: string;
    detailsDir?: string;
    description: string;
  }
> = {
  "hanime-index": {
    label: "Hentai",
    category: "hanime-index",
    description: "Hentai index with direct metadata cards.",
  },
  "2d-animation": {
    label: "2D Animation",
    category: "2d-animation",
    listFile: "2dAnimationLists.json",
    detailsDir: "details/2d-animation",
    description: "Motion-heavy 2D animation library.",
  },
  "3d-hentai": {
    label: "3D Hentai",
    category: "3d-hentai",
    listFile: "3dHentaiLists.json",
    detailsDir: "details/3d-hentai",
    description: "3D scene archive with downloads and stream mirrors.",
  },
  jav: {
    label: "JAV",
    category: "jav",
    listFile: "javLists.json",
    detailsDir: "details/jav",
    description: "Live-action catalog with stream and download blocks.",
  },
  "jav-cosplay": {
    label: "JAV Cosplay",
    category: "jav-cosplay",
    listFile: "javCosplayLists.json",
    detailsDir: "details/jav-cosplay",
    description: "Cosplay-focused JAV browsing experience.",
  },
  hanime: {
    label: "Hentai List",
    category: "hanime",
    listFile: "hanimeLists.json",
    detailsDir: "details/hanime",
    description: "Release-first list view sourced from hanime lists.",
  },
  genres: {
    label: "Genre List",
    category: "hanime-index",
    description: "Genre directory from the local JSON taxonomy.",
  },
};

export const DESKTOP_NAV = [
  "hanime-index",
  "2d-animation",
  "3d-hentai",
  "jav",
  "jav-cosplay",
  "hanime",
  "genres",
] as const;

export const THEMES = ["dark", "light", "crimson", "emerald", "violet", "amber"] as const;
