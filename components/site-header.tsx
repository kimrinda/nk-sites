"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HeaderSearch } from "@/components/header-search";
import { ThemeToggleSwitch } from "@/components/theme-toggle-switch";
import { CATEGORY_CONFIG, DESKTOP_NAV, SITE_NAME } from "@/lib/constants";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[color:color-mix(in_oklab,var(--background)_88%,transparent)] backdrop-blur-xl">
      <div className="flex w-full flex-wrap items-center gap-3 px-3 py-3 sm:px-5 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card)] text-sm font-semibold tracking-[0.2em] text-[var(--foreground)]">
            EK
          </div>
          <div className="hidden font-display text-2xl font-semibold tracking-[0.18em] text-[var(--foreground)] lg:block">{SITE_NAME}</div>
        </Link>

        <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-center gap-1 lg:flex">
          {DESKTOP_NAV.map((key) => {
            const href = key === "hanime-index" ? "/hanime-index" : `/${key}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={key}
                href={href}
                className={`rounded-full px-3 py-2 text-[13px] transition ${
                  active ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {CATEGORY_CONFIG[key].label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden min-w-0 flex-1 items-center justify-end md:flex xl:max-w-md">
          <HeaderSearch />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggleSwitch />
        </div>
      </div>

      <div className="px-3 pb-3 md:hidden">
        <HeaderSearch mobile />
      </div>
    </header>
  );
}
