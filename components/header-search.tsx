"use client";

import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

export function HeaderSearch({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("pointerdown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={searchRef} className={mobile ? "relative mx-auto w-full max-w-xl" : "relative w-full max-w-md"}>
      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          router.push(`/search?q=${encodeURIComponent(query)}`);
          setOpen(false);
        }}
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pr-14 pl-11" placeholder="Search titles, genres, producers" />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Open search menu"
          className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--muted)] text-[var(--foreground)] transition hover:bg-[var(--card-border)]"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`} />
        </button>
      </form>

      <div
        className={`absolute right-0 top-[calc(100%+0.55rem)] z-30 w-52 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-2 shadow-2xl transition-all duration-200 ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <Link href="/search/advanced" className="block rounded-xl px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--muted)]" onClick={() => setOpen(false)}>
          Advanced Search
        </Link>
      </div>
    </div>
  );
}
