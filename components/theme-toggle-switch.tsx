"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useHydrated } from "@/hooks/use-hydrated";

export function ThemeToggleSwitch() {
  const hydrated = useHydrated();
  const { theme, setTheme } = useTheme();
  const isLight = theme === "light";

  if (!hydrated) {
    return <div className="h-11 w-[4.8rem] rounded-full border border-[var(--card-border)] bg-[var(--card)]" />;
  }

  return (
    <button
      type="button"
      aria-label="Toggle light and dark theme"
      aria-pressed={isLight}
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className="relative inline-flex h-11 w-[4.8rem] items-center rounded-full border border-[var(--card-border)] bg-[var(--card)] px-2 transition-colors duration-300"
    >
      <span className="absolute left-2 inline-flex text-[var(--muted-foreground)]">
        <Sun className="h-4 w-4" />
      </span>
      <span className="absolute right-2 inline-flex text-[var(--muted-foreground)]">
        <Moon className="h-4 w-4" />
      </span>
      <span
        className={`absolute inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm transition-transform duration-300 ${
          isLight ? "translate-x-0" : "translate-x-[2rem]"
        }`}
      >
        {isLight ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
