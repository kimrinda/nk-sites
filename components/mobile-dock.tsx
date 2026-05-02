"use client";

import Link from "next/link";
import {
  Blend,
  Clapperboard,
  Film,
  FolderHeart,
  Layers3,
  ListVideo,
  Shapes,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { CATEGORY_CONFIG, DESKTOP_NAV } from "@/lib/constants";

const MOBILE_NAV_ICONS = {
  "hanime-index": Layers3,
  "2d-animation": Blend,
  "3d-hentai": Shapes,
  jav: Film,
  "jav-cosplay": Clapperboard,
  hanime: ListVideo,
  genres: FolderHeart,
} as const;

export function MobileDock() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--card-border)] bg-[color:color-mix(in_oklab,var(--background)_88%,transparent)] px-3 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl lg:hidden">
      <div className="flex snap-x snap-proximity gap-2 overflow-x-auto pb-1 no-scrollbar">
        {DESKTOP_NAV.map((key) => {
          const href = key === "hanime-index" ? "/hanime-index" : `/${key}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = MOBILE_NAV_ICONS[key];

          return (
            <Link
              key={key}
              href={href}
              className={`snap-start min-w-[72px] rounded-2xl px-3 py-2 text-xs transition ${
                active ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--card)] text-[var(--muted-foreground)]"
              }`}
            >
              <div className="flex flex-col items-center gap-1 text-center">
                <Icon className="h-4 w-4" />
                <span className="leading-tight">{CATEGORY_CONFIG[key].label}</span>
                <span
                  className={`mt-1 h-0.5 rounded-full transition-all ${
                    active ? "w-8 bg-[var(--accent-foreground)] opacity-100" : "w-4 bg-transparent opacity-0"
                  }`}
                />
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-2 h-0.5 w-full rounded-full bg-[linear-gradient(90deg,transparent_0%,var(--accent)_14%,var(--accent)_86%,transparent_100%)] opacity-80" />
    </nav>
  );
}
