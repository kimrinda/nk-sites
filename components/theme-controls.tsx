"use client";

import Link from "next/link";
import { Bookmark, Cog, History, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";

import { useHydrated } from "@/hooks/use-hydrated";
import { THEMES } from "@/lib/constants";

const TRANSITION_MS = 280;

export function ThemeControls() {
  const hydrated = useHydrated();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  function openMenu() {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setRendered(true);
    window.requestAnimationFrame(() => {
      setOpen(true);
    });
  }

  function closeMenu() {
    setOpen(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setRendered(false);
      closeTimeoutRef.current = null;
    }, TRANSITION_MS);
  }

  function toggleMenu() {
    if (open) {
      closeMenu();
      return;
    }

    openMenu();
  }

  if (!hydrated) {
    return (
      <button
        type="button"
        aria-label="Open gear menu"
        className="fixed right-0 top-1/2 z-[60] inline-flex h-12 w-12 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--card-border)] bg-[color:color-mix(in_oklab,var(--card)_92%,transparent)] text-[var(--foreground)] shadow-xl backdrop-blur-xl"
      >
        <Cog className="h-5 w-5" />
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleMenu}
        aria-label="Open gear menu"
        className={`fixed right-0 top-1/2 z-[60] inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--card-border)] bg-[color:color-mix(in_oklab,var(--card)_92%,transparent)] text-[var(--foreground)] shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_24px_rgba(255,255,255,0.08)] ${
          open ? "translate-x-0" : "translate-x-1/2 hover:translate-x-0"
        }`}
      >
        <Cog className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-90" : "rotate-0"}`} />
      </button>

      {rendered ? (
        <div
          className={`fixed inset-0 z-[55] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={closeMenu}
        >
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />

          <aside
            onClick={(event) => event.stopPropagation()}
            className={`absolute right-0 top-0 flex h-full w-[min(22rem,88vw)] flex-col border-l border-[var(--card-border)] bg-[color:color-mix(in_oklab,var(--card)_96%,transparent)] p-5 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                  <Palette className="h-3.5 w-3.5" />
                  Select Theme
                </div>
                <div className="grid gap-2">
                  {THEMES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      className={`rounded-full px-3 py-2 text-left text-sm capitalize transition ${
                        theme === value ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--card-border)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t border-[var(--card-border)] pt-5">
                <div className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Options</div>
                <div className="grid gap-2">
                  <Link href="/bookmarks" onClick={closeMenu} className="inline-flex items-center gap-2 rounded-full bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--card-border)]">
                    <Bookmark className="h-4 w-4" />
                    Bookmark
                  </Link>
                  <Link href="/history" onClick={closeMenu} className="inline-flex items-center gap-2 rounded-full bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--card-border)]">
                    <History className="h-4 w-4" />
                    History
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
