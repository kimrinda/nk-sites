# EnKa Stream

EnKa Stream is a local-first Next.js media browsing platform for hanime, JAV, 2D animation, and 3D hentai catalogs sourced from JSON files generated outside this project.

The app is built to run in two data modes:

- `json` mode reads mirrored JSON files directly.
- `prisma` mode reads imported SQLite data through Prisma.

The UI also includes fully local bookmarks, watch history, watched badges, and resume affordances with zero authentication.

**What This Project Does**
- Aggregates multiple local datasets into one responsive browsing UI.
- Supports homepage sections, category pages, detail pages, genre pages, search, and advanced search.
- Adds a hanime series overview page from `hanimeIndex.json -> details` before episode viewing.
- Mirrors thumbnails and JSON into the project for standalone deployment.
- Supports future migration from JSON loaders to relational storage through a repository layer.

**Core Stack**
- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Zustand
- TanStack Query
- Prisma 7
- SQLite with `better-sqlite3` adapter
- Lucide React

**Local-First UX Features**
- Theme system with multiple palettes
- Grid/list toggles
- Virtualized large list-mode views
- Bookmarks stored in `localStorage`
- Watch history stored in `localStorage`
- Progress stored as a percentage from `0` to `100`

Progress is intentionally stored as a percentage because the current stream sources open external pages, so the app does not have direct access to remote player time events. The site uses local progress markers and relative timestamps instead of pretending to track exact remote playback seconds.

**Fonts**
- Body: `DM Sans`
- Display: `Datatype`

These are copied into `public/fonts` and loaded with `next/font/local`.

**Data Sources**
- External source root: `NK_EXTERNAL_OUTPUT_ROOT`
- Mirrored source root: `data/source`
- Mirrored thumbnails: `public/thumbnails`

**Supported Routes**
- `/`
- `/hanime-index`
- `/hanime-index/[slug]`
- `/hanime`
- `/hanime/[episode-slug]`
- `/jav`
- `/jav/[slug]`
- `/jav-cosplay`
- `/jav-cosplay/[slug]`
- `/2d-animation`
- `/2d-animation/[slug]`
- `/3d-hentai`
- `/3d-hentai/[slug]`
- `/genres`
- `/genres/[slug]`
- `/search`
- `/search/advanced`
- `/bookmarks`
- `/history`

**How It Works**

**1. Data Provider Layer**

The repository layer decides where the app reads data from.

- `NK_DATA_PROVIDER="json"` uses mirrored JSON files.
- `NK_DATA_PROVIDER="prisma"` uses SQLite through Prisma.

The shared access layer lives in `lib/site-data.ts` and delegates to:

- `lib/repositories/json-media-repository.ts`
- `lib/repositories/prisma-media-repository.ts`

This keeps the UI independent from the physical storage format.

**2. Sync Pipeline**

`scripts/sync-content.mjs` mirrors the external dataset into this project.

It does all of the following:

- Copies root JSON files into `data/source`
- Copies detail JSON collections into `data/source/details/...`
- Copies thumbnails into `public/thumbnails/...`
- Rewrites mirrored thumbnail URLs to local asset paths where possible
- Rewrites hanime cover and episode thumbnails inside mirrored `hanimeIndex.json`

This makes the app practical for standalone deployment instead of depending on the external output folder at runtime.

**3. Prisma Import Pipeline**

`scripts/import-prisma.mjs` imports mirrored content into SQLite.

It imports:

- all normalized media items
- genres
- producers
- streams
- download groups and links
- hanime series metadata
- hanime series episode lists

Prisma mode is useful when you want one local database file instead of large JSON reads on every request.

**4. Hanime Series Detail Behavior**

`hanimeIndex.json` now contains a `details` key per series entry.

The app uses that to render `/hanime-index/[slug]` as a series overview page with:

- cover hero image
- thumbnail image
- synopsis
- metadata
- episode list
- quick jump into episode pages
- quick play and download shortcuts when an episode resolves to local detail data

This page is intentionally separate from the per-episode page.

**5. Bookmarks, History, and Resume State**

Bookmarks and history are client-only and require no authentication.

Storage behavior:

- Bookmarks: `localStorage`
- History: `localStorage`
- Progress: `localStorage`, stored as a percentage

Behavior:

- clicking a stream link writes or refreshes a history item
- bookmarks can be added or removed instantly
- bookmark names can be edited locally
- history can be cleared or pruned per item
- progress can be adjusted from the history page or inline on episode detail pages
- watched and bookmarked badges appear directly on listing cards and hanime episode rows
- resume affordances appear before opening detail pages

**Environment Variables**

Copy `.env.example` if you need a clean env file template.

Available variables:

- `DATABASE_URL`
- `NK_DATA_PROVIDER`
- `NK_DATA_ROOT`

Example:

```env
DATABASE_URL="file:./dev.db"
NK_DATA_PROVIDER="json"
# NK_DATA_ROOT="F:/my_js/neko-js/nk-sites/data/source"
```

**Requirements**
- Node.js 20+ recommended
- npm
- Enough disk space for mirrored assets and SQLite import

**Install**

```bash
npm install
```

**Development Setup**

**JSON Mode**

1. Mirror the external content into the project:

```bash
npm run sync:content:write
```

2. Keep `NK_DATA_PROVIDER="json"` in `.env`

3. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

**Prisma Mode**

1. Mirror the content:

```bash
npm run sync:content:write
```

2. Generate Prisma client:

```bash
npm run prisma:generate
```

3. Push the schema:

```bash
npm run prisma:push
```

4. Import mirrored content into SQLite:

```bash
npm run prisma:import
```

5. Set:

```env
NK_DATA_PROVIDER="prisma"
```

6. Start the dev server:

```bash
npm run dev
```

**Production Build**

```bash
npm run build
npm run start
```

**Standalone Deployment Flow**

If you want the project to run without reading the external output folder directly:

1. Run `npm run sync:content:write`
2. Optionally run Prisma import steps if you want DB-backed reads
3. Build with `npm run build`
4. Deploy the built app with `data/source`, `public/thumbnails`, `public/fonts`, and `.env`

**Scripts**

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run sync:content` | Dry-run content sync |
| `npm run sync:content:write` | Mirror JSON and thumbnails locally |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:push` | Push Prisma schema to SQLite |
| `npm run prisma:import` | Import mirrored data into SQLite |

**Project Structure**

```text
app/
components/
hooks/
lib/
prisma/
public/
  fonts/
  thumbnails/
scripts/
store/
types/
data/
  source/
```

**Important Files**
- `lib/site-data.ts`
- `lib/repositories/json-media-repository.ts`
- `lib/repositories/prisma-media-repository.ts`
- `scripts/sync-content.mjs`
- `scripts/import-prisma.mjs`
- `prisma/schema.prisma`
- `store/bookmarks-store.ts`
- `store/history-store.ts`

**Troubleshooting**

If thumbnails are missing:

- rerun `npm run sync:content:write`

If Prisma mode returns empty data:

- run `npm run prisma:push`
- run `npm run prisma:import`
- confirm `NK_DATA_PROVIDER="prisma"`

If JSON mode is not reading the mirror:

- confirm `data/source/hanimeIndex.json` exists
- or set `NK_DATA_ROOT` manually

If watched progress looks incomplete:

- history is local to the current browser profile
- progress is user-managed percentage metadata because remote external players do not expose precise playback telemetry to this app

**Validation Status**

Validated in both modes:

- `npm run lint`
- `npm run build`
- `NK_DATA_PROVIDER=prisma npm run build`
