# EnKa Stream Release Notes

## v0.1.0

**Highlights**
- Added mirrored JSON and thumbnail sync pipeline for standalone deployment
- Added Prisma + SQLite repository mode alongside JSON mode
- Added hanime series overview pages from the updated `hanimeIndex.json -> details` structure
- Added local bookmarks, watch history, watched badges, and resume affordances with zero authentication
- Added progress-aware resume state using local percentage markers

**Added**
- Homepage aggregation across all supported media categories
- Category archive pages for hanime, JAV, JAV cosplay, 2D animation, 3D hentai, and genres
- Advanced search with multi-filter support
- Theme system with multiple palettes
- Desktop top navigation and mobile bottom dock
- Grid/list toggles
- Virtualized large list-mode views
- `/bookmarks` page
- `/history` page

**Hanime Data Update Support**
- The app now consumes the new `details` key inside `hanimeIndex.json`
- `/hanime-index/[slug]` is now a non-episode landing page
- Hanime series pages now show:
  - cover hero image
  - thumbnail
  - synopsis
  - metadata
  - episode list
  - quick episode actions when available

**Local UX Features**
- Bookmark toggle on detail pages and series pages
- Watch history auto-entry on stream click
- Bookmark rename and delete support
- History clear and item delete support
- Resume buttons on cards and hanime episode rows
- Watched and bookmarked badges directly in browse surfaces
- Progress stored locally as percentage values from `0` to `100`
- Inline progress editing directly on episode detail pages

**Architecture Changes**
- Added repository abstraction so UI is not tightly coupled to JSON storage
- Added JSON repository
- Added Prisma repository
- Added Prisma 7 config and SQLite adapter wiring
- Added `HanimeSeries` and `HanimeSeriesEpisode` models for series-level overview data

**Data Pipelines**
- `npm run sync:content:write`
- `npm run prisma:generate`
- `npm run prisma:push`
- `npm run prisma:import`

**Operational Notes**
- Default mode can remain `json` for simpler local development
- `prisma` mode is available for DB-backed reads after import
- Watch progress is local metadata, not precise remote player telemetry, because stream playback occurs on external sources

**Validation**
- ESLint passed
- Production build passed in JSON mode
- Production build passed in Prisma mode

**Suggested Upgrade Flow**
1. Run `npm install`
2. Run `npm run sync:content:write`
3. If using Prisma mode, run `npm run prisma:generate`
4. Run `npm run prisma:push`
5. Run `npm run prisma:import`
6. Set `NK_DATA_PROVIDER="prisma"` if desired
