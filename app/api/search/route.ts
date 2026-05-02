import { NextResponse } from "next/server";

import { runSearch } from "@/lib/site-data";
import type { SearchFilters } from "@/types/media";

function parseCsv(value: string | null) {
  return value ? value.split(",").map((entry) => entry.trim()).filter(Boolean) : undefined;
}

function parseNumber(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseInteger(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(50, parseInteger(searchParams.get("pageSize"), 12));
    const filters: SearchFilters = {
      q: searchParams.get("q") ?? undefined,
      genres: parseCsv(searchParams.get("genres")),
      producers: parseCsv(searchParams.get("producers")),
      minDuration: parseNumber(searchParams.get("minDuration")),
      maxDuration: parseNumber(searchParams.get("maxDuration")),
      minScore: parseNumber(searchParams.get("minScore")),
      maxScore: parseNumber(searchParams.get("maxScore")),
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      logic: searchParams.get("logic") === "and" ? "and" : "or",
    };

    const allItems = await runSearch(filters);
    const total = allItems.length;
    const start = (page - 1) * pageSize;
    const items = allItems.slice(start, start + pageSize);

    return NextResponse.json({ items, total, page, pageSize });
  } catch {
    return NextResponse.json({ message: "Search request failed" }, { status: 500 });
  }
}
