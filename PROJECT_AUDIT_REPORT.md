# PROJECT AUDIT REPORT

Project: `Enka Stream`

Audit date: 2026-05-02

Verified directly from code in `F:\my_js\neko-js\nk-sites`

Validation run during audit:
- `npm run lint` ✅
- `npm run build` ✅
- `NK_DATA_PROVIDER=prisma npm run build` ✅

## 1. Executive Summary

**Overall project condition**

Enka Stream is no longer a toy starter. It is a feature-rich Next.js App Router application with real data-provider abstraction, local-first UX systems, dynamic metadata, category/search flows, series overview pages, and SQLite import support. The project has strong breadth and a workable structure.

The main problem is not missing features. The main problem is that several core features are implemented in ways that are expensive, weakly validated, or only partially hardened for production. The codebase is closer to a serious beta than a production-grade streaming product.

**Readiness level**

`Beta`

Reason:
- feature coverage is broad
- most routes build and run
- JSON and Prisma modes both work
- but security hardening, data validation, search scalability, and runtime efficiency are not yet strong enough for production-ready status

**Biggest strengths**
- Clear server-first route structure in `app/`
- Real JSON/Prisma provider abstraction in `lib/repositories/*`
- Broad feature coverage with local bookmarks/history and progress
- Dynamic metadata system using the Next.js Metadata API only
- Responsive UI foundations with mobile dock, themes, and reusable listing/card components

**Biggest risks**
- Large server-to-client payloads for listing/search pages
- Missing runtime schema validation for untrusted JSON/provider input
- Unsandboxed iframe player with unvalidated external URLs
- Search and advanced-search scalability limits
- Watch history auto-tracking is not fully trustworthy in the current iframe flow

## 2. Feature Audit

### Homepage

Status: `Partial`

Problems found
- Homepage data is randomized and explicitly `noStore()` in `lib/site-data.ts:43-65`, which is acceptable for UX but expensive for cacheability and repeated requests.
- Homepage sections disappear silently when empty because `components/home-media-section.tsx:14-16` returns `null` instead of showing an empty explanation.

Suggested fixes
- Add low-cost empty state messaging for missing homepage sections.
- Consider a bounded server-side cache or scheduled randomization instead of fully uncacheable per-request randomization.

### Highlight carousel

Status: `Partial`

Problems found
- Accessibility is incomplete. Previous/next controls in `components/highlight-carousel.tsx:174-179` are icon buttons without accessible labels.
- Every slide image uses `priority` in `components/highlight-carousel.tsx:128`, which can encourage over-eager preloading.
- Keyboard support and focus management are not verified.

Suggested fixes
- Add `aria-label` to carousel arrow buttons.
- Only give `priority` to the active or first slide.
- Add keyboard navigation and autoplay pause-on-focus behavior.

### Category pages

Status: `Good`

Problems found
- Feature-wise they now have pagination, sort, status filter, and URL-sync, but all result data is still sent into a client listing component, which is a performance risk rather than a feature failure.
- Filter panel in `components/listing-page.tsx:238-293` lacks keyboard accessibility and focus handling.

Suggested fixes
- Keep the UX, but reduce payload size for category listings.
- Add `aria-expanded`, Escape-close, and focus management for filter UI.

### Search page

Status: `Partial`

Problems found
- `/search` with no query still resolves through `runSearch()` in `app/search/page.tsx:5-15`, which means the route can act like a giant result dump instead of an intentional search flow.
- The search page uses the category-style top bar but has no in-page query editor; query changes depend on the header search.
- Metadata generation for `/search` duplicates `runSearch()` work in `app/search/page.tsx`, so the route computes search results twice per request when a query exists.

Suggested fixes
- Block or special-case empty queries.
- Add a visible query-edit control inside the search page itself.
- Avoid duplicate search work between `generateMetadata` and page rendering.

### Advanced search

Status: `Partial`

Problems found
- `components/advanced-search.tsx:31-55` triggers results fetching immediately, even before the user has narrowed filters meaningfully.
- No explicit empty-result state or API error state in `components/advanced-search.tsx:80-85`.
- No pagination for advanced-search results.
- Inputs rely heavily on placeholders instead of labels.

Suggested fixes
- Add empty, error, and pagination states.
- Consider delaying network search until a meaningful query/filter set exists.
- Add semantic labels for inputs and select controls.

### Series overview page

Status: `Good`

Problems found
- Episode cards are now clickable and more content-focused, which is correct.
- External episode links in `components/hanime-series-page.tsx:119-122` still open directly to outside sources with only `rel="noreferrer"`; safer handling is needed, but that is a security hardening issue rather than feature breakage.

Suggested fixes
- Preserve current UX, but add URL validation/allowlists for externally opened episode links.

### Episode detail page

Status: `Partial`

Problems found
- Layout is functionally improved, but the player section now depends on a client component iframe selector and still lacks true playback state/error feedback.
- Back link in `components/detail-page.tsx:27-30` uses raw `sourceCategory` text instead of friendly labels.

Suggested fixes
- Use friendly category labels from `lib/constants.ts`.
- Add player load/error/fallback state and optional external-open fallback.

### Streaming iframe section

Status: `Partial`

Problems found
- `components/stream-player-card.tsx:22-29` embeds external URLs in `iframe` without `sandbox`, `referrerPolicy`, or domain validation.
- There is no health detection or broken-server fallback.
- Viewing inside the iframe does not reliably create or update history entries.

Suggested fixes
- Add URL validation and an iframe allowlist.
- Add `sandbox` and `referrerPolicy` where viable.
- Add “open in new tab” fallback and server failure handling.
- Connect actual player interaction to history updates if possible.

### Download section

Status: `Good`

Problems found
- Layout is acceptable and responsive.
- Links are still raw external URLs with no validation in `components/detail-page.tsx:99-102`.

Suggested fixes
- Add a provider/domain allowlist and better outbound-link handling.

### Bookmark system

Status: `Good`

Problems found
- Purely local and persistent, which matches requirements.
- No schema versioning or corruption recovery for `localStorage` payloads in `store/bookmarks-store.ts:20-59`.

Suggested fixes
- Add storage versioning and optional runtime validation during rehydration.

### History system

Status: `Broken`

Problems found
- The intended “auto-track when user starts or plays” behavior is not reliably true anymore.
- `components/watch-server-link.tsx` exists, but current episode playback uses `components/stream-player-card.tsx`, which does not call the history store.
- Progress controls exist, but they are user-managed metadata, not true playback tracking.

Suggested fixes
- Reconnect history updates to actual stream interaction.
- If external iframes cannot provide playback events, track at least server selection/open intent consistently and document the limitation honestly.

### Theme system

Status: `Partial`

Problems found
- Hydration guards are implemented, which is good.
- `components/theme-controls.tsx:61-125` lacks Escape-to-close, focus management, and dialog semantics.

Suggested fixes
- Add keyboard support, `aria-expanded`, and focus-return behavior.

### Mobile bottom dock

Status: `Partial`

Problems found
- Dock is scrollable and responsive, but it only exposes category navigation in `components/mobile-dock.tsx:17-25` and excludes Home, Search, Bookmarks, and History.
- Safe-area handling for modern iPhone home indicators was not verified.

Suggested fixes
- Decide whether the dock is intentionally category-only or if it should expose utility destinations too.
- Add safe-area padding using `env(safe-area-inset-bottom)`.

### SEO metadata

Status: `Partial`

Problems found
- Global and dynamic metadata utilities are present and functional.
- `app/search/advanced/page.tsx` has no `generateMetadata`.
- Search pages are indexable by default and there is no `robots.ts` or `sitemap.ts`.
- `lib/seo.ts:5` falls back to `http://localhost:3000`, which is dangerous if `NEXT_PUBLIC_SITE_URL` is not configured in production.

Suggested fixes
- Add metadata for advanced search.
- Add `robots.ts` and `sitemap.ts`.
- Consider `noindex` for search results.
- Fail harder or warn more explicitly when `NEXT_PUBLIC_SITE_URL` is unset in production.

### Data provider system

Status: `Partial`

Problems found
- The abstraction itself is good, but JSON parsing is unvalidated and Prisma reads are broad.
- `lib/repositories/json-media-repository.ts` eagerly loads and parses large collections.
- `lib/repositories/prisma-media-repository.ts:161-174` loads wide related records even for listing-style contexts.

Suggested fixes
- Add runtime validation for JSON mode.
- Add slimmer listing DTO/repository methods instead of reusing full detail-shaped records everywhere.

## 3. Performance Audit

**Initial page load**

Not measured with Lighthouse during this audit.

Observed structural risks
- Large listing pages pass full `MediaItem[]` payloads into client components:
  - `app/[category]/page.tsx`
  - `app/search/page.tsx`
  - `app/[category]/[slug]/page.tsx` for genre result pages
- `components/listing-page.tsx` is a client component, so route payloads are serialized into the client boundary.

**Client bundle size**

Exact bundle size not verified. No bundle analyzer is configured.

Likely contributors
- 26 client components currently present
- global React Query provider in `components/providers.tsx:7-24`
- theme panel, mobile dock, back-to-top, search, carousel, and listing shell all hydrate on most pages

**Unnecessary client components**

Potentially broader-than-needed client boundaries
- `components/listing-page.tsx`
- `components/home-media-section.tsx`
- `components/media-card.tsx`
- `components/site-header.tsx`
- `components/highlight-carousel.tsx`

Suggested direction
- Keep interactions client-side, but move more display-only card/layout shells back to server components where feasible.
- Consider splitting cards into a server-rendered shell plus a tiny client status island.

**Image optimization**

Good
- `next/image` is used broadly.
- local font loading is correct.

Problems
- `components/highlight-carousel.tsx:128` currently marks every mapped slide image as `priority`.
- List-mode cards frequently use `object-contain`, which protects aspect ratio but can produce a lot of unused area.

**Lazy loading**

Good
- `next/image` lazy behavior covers most non-priority images.

Missing/weak
- No explicit dynamic imports for heavyweight interactive UI like advanced search, gear panel, or carousel.

**Hydration problems**

Current state
- No blocking hydration failures found during current build validation.

Risks
- `app/layout.tsx:40` uses `suppressHydrationWarning`, which is acceptable for theme differences but can hide future mismatches.
- There are many mounted guards and client-only UI surfaces, which is workable but should be kept under control.

**Re-render issues**

Key issue
- `components/media-card-state.tsx`, `components/hanime-episode-state.tsx`, and bookmark/history selectors repeatedly scan arrays using `.find()` / `.some()` for each rendered card.
- This makes large result sets more expensive than necessary.

Suggested fix
- Precompute lookup maps in the Zustand stores or expose selector helpers that return O(1)-ish results.

**Large list rendering**

Good
- `components/virtualized-media-list.tsx` exists and is used in list mode for long results.

Problems
- Grid mode never virtualizes in `components/media-results.tsx:9-21`.
- `components/virtualized-media-list.tsx` uses a fixed `ROW_HEIGHT = 240`, which is fragile for variable-height content.

**Pagination / virtualization**

Good
- Category/search pages paginate and URL-sync well.

Problems
- Advanced search does not paginate.
- Genre result pages rely on the generic listing component and still inherit the heavy full-array model.

**TanStack Query usage**

Good
- Advanced search uses it correctly for client-driven fetching.

Problems
- React Query is globally provisioned in `components/providers.tsx` even though the usage surface is narrow.
- `@tanstack/react-query-devtools` is installed but unused.

**Zustand usage**

Good
- Appropriate for local-first bookmarks/history/view state.

Problems
- No schema migration/versioning for persisted stores.
- Array scan selectors make large-page state overlays more expensive than needed.

**Server vs client component usage**

Good
- Route entry files stay server-side.

Problems
- The main listing experience still hydrates too much UI and data for simple read-only browsing.

**What slows the site down**
- Full catalog serialization into client listing pages
- JSON repo cold-start parsing cost
- Grid mode rendering of all cards at once
- Duplicate search/category metadata data lookups
- Global hydration surface for mostly display-heavy routes

**What can be moved to server components**
- More of `MediaCard` display shell
- Parts of `ListingPage` that do not need browser events
- Some search result shaping before hydration

**What should be lazy-loaded**
- Advanced search feature shell
- Gear menu panel internals
- Possibly the homepage carousel on lower-priority routes

**What should be memoized or restructured**
- Bookmark/history lookup maps
- Result-card state selectors
- Category/search page data shaping for metadata/page duplication

## 4. UX / UI Audit

**Desktop layout**

Status: Good

Notes
- Layout is fluid and no longer stuck in a narrow centered shell.
- Shared card/list surfaces are visually coherent.

**Mobile layout**

Status: Partial

Notes
- Mobile compacting work is present, but true device verification on iPhone 14 Pro Max was not performed in this audit.
- Safe-area behavior around the bottom dock was not verified.

**Header**

Status: Partial

Problems
- Header search is functional, but input/menu accessibility is still limited:
  - `components/header-search.tsx:32-63`
- Placeholder-first search UX remains weaker than labeled form controls.

**Bottom dock**

Status: Partial

Problems
- Category-only scope may be insufficient for navigation on mobile.
- Utility destinations are separated into other UI areas.

**Gear menu**

Status: Partial

Problems
- `components/theme-controls.tsx:61-125` lacks Escape handling and focus management.

**Carousel**

Status: Partial

Problems
- Good visual polish and swipe behavior.
- Weak accessibility and likely overuse of `priority` images.

**Grid / list cards**

Status: Good

Problems
- List-mode `object-contain` protects ratios but can produce unused whitespace.
- Status/data overlays are sometimes dense on image-heavy cards.

**Detail pages**

Status: Partial

Problems
- Player UX is missing robust error handling.
- Back navigation labels are raw category slugs in `components/detail-page.tsx:27-30`.

**Empty states**

Status: Partial

Good
- Search/category empty state now exists in `components/listing-page.tsx:334-360`.

Problems
- Advanced search lacks explicit empty/error handling.
- Homepage sections silently disappear when empty.

**Loading states**

Status: Partial

Good
- Global route loading exists in `app/loading.tsx`.
- Advanced search has skeletons.

Problems
- No route-level error state UIs.
- No player loading feedback.

**Accessibility**

Status: Partial

Problems
- Many icon-only controls still lack `aria-label`, for example in:
  - `components/home-media-section.tsx`
  - `components/listing-page.tsx`
  - `components/highlight-carousel.tsx`
  - bookmarks/history view toggles
- Popover/dialog style surfaces lack keyboard patterns.

**Click / touch targets**

Status: Good

Notes
- Most primary controls are now large enough for touch.
- Mobile dock is touch-friendly.

**Spacing consistency**

Status: Good

Notes
- Shared radii, spacing, and card surfaces are mostly consistent.

**Color contrast**

Status: Partial

Notes
- Dark theme hierarchy is improved.
- Overlay text and some subdued text colors on images were not contrast-tested formally.

**Theme consistency**

Status: Good

Notes
- Theme variable system is coherent and centralized.

## 5. SEO / Metadata Audit

**generateMetadata usage**

Good
- Implemented in:
  - `app/[category]/page.tsx`
  - `app/[category]/[slug]/page.tsx`
  - `app/search/page.tsx`

**Open Graph metadata**

Good
- Present through `lib/seo.ts:70-127`
- Includes title, description, url, type, image size

**Twitter Cards**

Good
- Implemented through the same SEO utility

**Canonical URLs**

Good
- Set via `alternates.canonical` in `lib/seo.ts:113-127`

**Page titles / descriptions**

Good
- Global defaults exist
- Dynamic routes use data-layer titles/synopses

**Dynamic detail / episode metadata**

Good
- `/hanime-index/[slug]` and `/hanime/[slug]` are covered in the shared dynamic route metadata function

**Default fallback metadata**

Good
- Exists through `createDefaultMetadata()`

**Image URLs**

Partial
- Fallback OG image exists and works.
- Production correctness depends on `NEXT_PUBLIC_SITE_URL`; otherwise canonical and image URLs can inherit `localhost`.

**Structured data**

Missing
- No JSON-LD or structured data layer was found.

**SEO gaps**
- No `robots.ts`
- No `sitemap.ts`
- `app/search/advanced/page.tsx` has no page-specific metadata
- Search routes are indexable by default, which is often undesirable

## 6. Security / Safety Audit

**iframe usage**

Risk level: High

Problems
- `components/stream-player-card.tsx:22-29` renders unvalidated iframe URLs from data sources.
- No `sandbox`
- No `referrerPolicy`
- No host allowlist

**External stream URLs**

Risk level: High

Problems
- JSON and Prisma providers trust URL fields directly:
  - `lib/repositories/json-media-repository.ts:267-272`
  - `lib/repositories/prisma-media-repository.ts:100-104`

**Download links**

Risk level: Medium

Problems
- Raw external links are rendered directly in `components/detail-page.tsx:99-102`
- No validation/allowlisting

**XSS risks**

Status: Low / controlled

Good
- No `dangerouslySetInnerHTML` usage was found

**unsafe HTML rendering**

Status: Not found

**localStorage usage**

Risk level: Medium

Problems
- Bookmark and history payloads are trusted on rehydration with no validation.

**untrusted JSON data**

Risk level: High

Problems
- JSON parsing is direct and unchecked in:
  - `lib/site-data.ts:18-20`
  - `lib/repositories/json-media-repository.ts:120-123`
  - `scripts/import-prisma.mjs:34-37`

**external image domains**

Status: Good

Good
- `next.config.ts:4-6` restricts remote image loading to `nekopoi.care`

**CSP recommendations**

Missing
- No CSP or security headers in `next.config.ts`

**link target security**

Partial

Good
- External links use `rel="noreferrer"`

Problems
- Prefer explicit `rel="noopener noreferrer"` for clarity and hardening.

## 7. Architecture Audit

**Folder structure**

Status: Good

Notes
- Separation between `app`, `components`, `lib`, `store`, `hooks`, `scripts`, and `prisma` is understandable.

**Component separation**

Status: Partial

Problems
- Several components have grown large and multi-purpose:
  - `components/listing-page.tsx`
  - `components/highlight-carousel.tsx`
  - `components/hanime-series-page.tsx`
- These are still maintainable, but they are trending toward “god component” territory.

**Data provider abstraction**

Status: Good

Notes
- `lib/repositories/types.ts` and `lib/repositories/index.ts` give the app a usable JSON/Prisma swap point.

**JSON provider**

Status: Partial

Problems
- Strongly tied to local file structures and large eager loads.
- No runtime validation.

**Prisma provider**

Status: Partial

Problems
- Works, but overfetches related records for listing-style use.
- `HanimeSeries` stores producers/genres as JSON, not normalized relations.

**types**

Status: Good

Notes
- `types/media.ts` is central and broadly useful.

**hooks**

Status: Partial

Notes
- `hooks/use-hydrated.ts` is useful.
- Hook layer is otherwise thin; repeated behavior still lives inside large components.

**stores**

Status: Good

Problems
- Persisted stores lack versioning/migrations.

**reusable utilities**

Status: Good

Problems
- Parsing and normalization helpers are duplicated between runtime repo code and import script.

**duplicated code**

Status: Present

Examples
- Parsing helpers duplicated in:
  - `lib/repositories/json-media-repository.ts`
  - `scripts/import-prisma.mjs`
- Series normalization logic appears in both places too.

**maintainability**

Status: Moderate

Notes
- Current codebase is maintainable by a careful solo developer, but repeated logic and large client components will get more expensive over time.

**scalability**

Status: Limited

Main limits
- full-catalog loading
- wide client serialization
- incomplete list pagination in advanced search
- no validated DTO layer

## 8. Code Quality Audit

**TypeScript strictness**

Status: Good

Good
- `tsconfig.json:7` has `strict: true`

**`any` usage**

Status: Good

Good
- No `any` usage was found in project TypeScript files during this audit.

**duplicated logic**

Status: Present

Problems
- Parsing/normalization duplication between runtime and import paths.

**naming consistency**

Status: Partial

Problems
- Route naming is understandable, but “anime” vs “hanime” vs “hanime-index” is semantically overloaded.
- Back links render raw category slugs in detail views.

**dead code**

Status: Present

Notable likely dead code
- `components/watch-server-link.tsx` appears unused
- `lib/data-paths.ts:6` `PUBLIC_THUMBNAIL_ROOT` is unused and currently triggers build warnings
- `lib/data-paths.ts:20-22` `isMirrorAvailable()` appears unused
- `lib/constants.ts:5` `OUTPUT_ROOT` appears unused

**unused imports**

Status: Clean at time of audit

Notes
- Current lint run passed without unused import errors.

**unnecessary client components**

Status: Present

Problems
- The project uses many client components for pages that are mostly read-only UI.

**complex components that should be split**

Priority candidates
- `components/listing-page.tsx`
- `components/highlight-carousel.tsx`
- `components/hanime-series-page.tsx`

**hydration mismatch causes**

Status: Controlled but fragile

Notes
- No active mismatch was verified in current builds.
- The codebase relies on mounted guards and `suppressHydrationWarning`, which is workable but easy to misuse later.

**error handling**

Status: Partial

Problems
- No dedicated route-level error boundaries found.
- Advanced search fetch throws but has no error UI.

**tests**

Status: Missing

Good
- No test files were found.

## 9. Database / Data Audit

**JSON data shape**

Status: Partial

Notes
- JSON shape is rich but mixed: flat arrays, grouped indices, and detail collections.
- Normalization layer handles it, but only through custom logic.

**normalization quality**

Status: Good

Good
- The app does a meaningful normalization job across series, episodes, providers, downloads, and genres.

**migration readiness to Prisma / PostgreSQL**

Status: Partial

Problems
- Base media model is migration-friendly.
- `HanimeSeries` still stores `producers` and `genres` as `Json` in `prisma/schema.prisma:118-121`, which weakens relational quality for a future PostgreSQL move.

**missing IDs**

Status: Partial

Problems
- Many display items still rely primarily on slug identity.
- The global unique rule for media is `@@unique([category, slug])`, which is correct but still means there is no clean provider-independent public ID strategy.

**slug consistency**

Status: Good

Good
- Category + slug uniqueness was added correctly.

**relations**

Status: Partial

Good
- `MediaItem` relations for genres/producers/streams/downloads are modeled.

Problems
- `HanimeSeriesEpisode` is not directly related to `MediaItem`; it is resolved later by slug in repository code.
- That is workable, but weaker than a formal relational link.

**data validation with Zod**

Status: Missing

Problems
- `zod` is installed but not used in runtime data validation.

**missing field handling**

Status: Good

Notes
- The app uses many fallback values and optional chaining.
- This keeps the UI alive, but also hides upstream data-quality problems.

## 10. Pros and Cons

| Area | Pros | Cons | Priority |
| --- | --- | --- | --- |
| Routing | Clear App Router structure, good route coverage | Shared dynamic route does a lot of branching | P1 |
| UI system | Consistent design language, reusable cards/listing shells | Many large client components, accessibility gaps | P1 |
| Homepage | Good content sections and visual polish | Fully dynamic and uncacheable, sections can vanish silently | P1 |
| Search | Basic search works, search metadata exists | Empty query behavior, no advanced-search pagination, duplicate metadata fetches | P1 |
| Series/Episode flow | Solid breadth, series overview is useful | Player hardening/history tracking incomplete | P0 |
| Local features | Bookmarks/history/progress are practical and persistent | History auto-tracking is not reliable, stores have no validation/versioning | P0 |
| SEO | Reusable metadata utility, OG/Twitter support | No robots/sitemap, localhost fallback, advanced search metadata missing | P1 |
| Security | No dangerous HTML injection found | Unsandboxed iframe, unvalidated external URLs, no CSP/security headers | P0 |
| Architecture | JSON/Prisma abstraction is real | Duplication between runtime and import logic, overfetching | P1 |
| Data layer | Strong normalization effort | No Zod validation, heavy eager loads, JSON columns in series schema | P0 |
| Code quality | Strict TS, no `any`, lint/build currently pass | No tests, dead code, some naming/complexity issues | P1 |

## 11. Priority Fix List

### P0 — Critical

**1. Fix history auto-tracking so it reflects real playback intent**
- Problem: history does not reliably update from the actual iframe-based playback flow
- Why it matters: a headline feature is functionally untrustworthy
- Suggested fix: create a clear “play started” write path when a server is selected or when a fallback open action is triggered
- Files likely involved:
  - `components/stream-player-card.tsx`
  - `store/history-store.ts`
  - `components/detail-page.tsx`
  - `components/watch-server-link.tsx`

**2. Harden iframe and external URL handling**
- Problem: external URLs from JSON/DB are trusted directly in iframes and anchors
- Why it matters: this is the biggest real safety risk in the project
- Suggested fix: add scheme/domain allowlists, iframe sandbox/referrer policy, and explicit external-link handling policy
- Files likely involved:
  - `components/stream-player-card.tsx`
  - `components/detail-page.tsx`
  - `components/hanime-series-page.tsx`
  - `lib/repositories/json-media-repository.ts`
  - `lib/repositories/prisma-media-repository.ts`

**3. Add runtime validation for JSON/provider input**
- Problem: untrusted JSON is parsed and trusted directly
- Why it matters: invalid or malicious data can break UI and widen security risk
- Suggested fix: use `zod` to validate normalized input at repo/import boundaries
- Files likely involved:
  - `lib/repositories/json-media-repository.ts`
  - `scripts/import-prisma.mjs`
  - `app/api/search/route.ts`
  - `types/media.ts`

### P1 — Important

**4. Reduce listing/search payload size and duplicate work**
- Problem: large arrays are serialized into client listing pages, and metadata often duplicates route work
- Why it matters: this affects TTFB, hydration size, and scalability
- Suggested fix: add lightweight listing DTOs, cache route-level page shaping, and avoid duplicate `runSearch()` / `getCategoryPageData()` work
- Files likely involved:
  - `app/[category]/page.tsx`
  - `app/search/page.tsx`
  - `app/[category]/[slug]/page.tsx`
  - `components/listing-page.tsx`
  - `lib/site-data.ts`

**5. Add pagination/error/empty-state rigor to advanced search**
- Problem: advanced search has no pagination or robust zero/error handling
- Why it matters: it does not scale to real catalog size cleanly
- Suggested fix: paginate API results and add explicit error/empty UI
- Files likely involved:
  - `components/advanced-search.tsx`
  - `app/api/search/route.ts`
  - `lib/search.ts`

**6. Add SEO crawl-management and safer canonical handling**
- Problem: search routes are indexable, advanced search lacks route metadata, and `localhost` fallback is risky
- Why it matters: weakens discoverability and can produce bad shared URLs in production
- Suggested fix: add `robots.ts`, `sitemap.ts`, advanced search metadata, and production env safeguards
- Files likely involved:
  - `lib/seo.ts`
  - `app/search/page.tsx`
  - `app/search/advanced/page.tsx`
  - new `app/robots.ts`
  - new `app/sitemap.ts`

**7. Optimize bookmark/history selectors for large result lists**
- Problem: repeated `.find()` / `.some()` scans per card
- Why it matters: large pages pay extra client rendering cost
- Suggested fix: store or derive keyed lookup maps
- Files likely involved:
  - `components/media-card-state.tsx`
  - `components/hanime-episode-state.tsx`
  - `store/bookmarks-store.ts`
  - `store/history-store.ts`

**8. Add tests and route-level error boundaries**
- Problem: there is no test safety net and very limited explicit error UI
- Why it matters: regressions will be easy to introduce
- Suggested fix: start with utility/repository tests and route-level `error.tsx` coverage
- Files likely involved:
  - `lib/*`
  - `app/*`

### P2 — Nice to Have

**9. Split oversized components**
- Problem: several client components are doing too much
- Why it matters: readability and future change cost
- Suggested fix: split filter UI, pagination UI, carousel content, and series episode card sections into smaller units
- Files likely involved:
  - `components/listing-page.tsx`
  - `components/highlight-carousel.tsx`
  - `components/hanime-series-page.tsx`

**10. Remove dead code and noisy constants**
- Problem: some exports/components appear unused
- Why it matters: increases maintenance noise and even triggers build warnings
- Suggested fix: remove or use them intentionally
- Files likely involved:
  - `components/watch-server-link.tsx`
  - `lib/data-paths.ts`
  - `lib/constants.ts`

**11. Improve player/server UX polish**
- Problem: server selection and iframe failure handling are minimal
- Why it matters: streaming pages are a core product surface
- Suggested fix: add load state, broken-server fallback, and optional open-external action
- Files likely involved:
  - `components/stream-player-card.tsx`
  - `components/detail-page.tsx`

## 12. Suggested Roadmap

### Phase 1: Stability fixes
- Repair watch-history tracking to reflect actual playback intent
- Add iframe/external URL allowlisting and sandboxing strategy
- Add Zod validation for mirrored JSON and imported records
- Add route-level error handling where users currently get silent or thin failures

### Phase 2: Performance + SEO
- Reduce client payloads for listing/search pages
- Add advanced-search pagination and result caps
- Add robots/sitemap and decide search-page indexing policy
- Remove duplicate metadata/page data work where practical

### Phase 3: Database migration
- Normalize `HanimeSeries` producers/genres into relations
- Add stronger IDs and direct links between `HanimeSeriesEpisode` and `MediaItem`
- Replace broad “load full catalog” patterns with route-specific repository methods
- Prepare PostgreSQL-ready data constraints and indexes

### Phase 4: Polish + production hardening
- Add keyboard/focus accessibility for menus and carousel
- Add tests for repositories, parsing, filtering, and route helpers
- Add bundle analysis and route performance profiling
- Add CSP/security headers and deployment documentation for hardened production config

## 13. Final Score

| Area | Score (1-10) | Notes |
| --- | --- | --- |
| UI/UX | 7 | Strong breadth and decent polish, but still uneven in accessibility and some interaction flows |
| Mobile responsiveness | 6 | Much improved, but real-device verification and safe-area polish are still not verified |
| Performance | 5 | Large client payloads, eager catalog loading, and uncacheable homepage are real concerns |
| SEO | 6 | Good metadata API usage, but missing crawl-management and production URL safety |
| Security | 4 | Main risk area: iframe/external URL trust and no CSP/security headers |
| Architecture | 7 | Real repository abstraction and coherent structure, but duplication and overfetching remain |
| Maintainability | 6 | Strict TS and reasonable folders help, but large components and no tests hurt |
| Production readiness | 5 | Broadly functional beta, but not hardened enough for production deployment |

**Overall score: 5.8 / 10**

**Final judgment**

Enka Stream is a capable beta application with real product shape and strong feature breadth. It is not “broken,” but it is not production-ready. The biggest blockers are not cosmetic; they are trust-boundary validation, iframe/external link safety, watch-history correctness, and payload/performance discipline.
