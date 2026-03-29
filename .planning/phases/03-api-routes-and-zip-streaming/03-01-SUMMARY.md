---
phase: 03-api-routes-and-zip-streaming
plan: 01
subsystem: api
tags: [archiver, zip, streaming, zod, search-api, passthrough]

# Dependency graph
requires:
  - phase: 02-pdf-generation-for-server-side-rendering
    provides: renderHymnPdf function for server-side PDF buffer generation
  - phase: 01-foundation-and-data-layer
    provides: fetchHymnForPdf, searchHymns, getAssetUrl services and Hymn interfaces
provides:
  - Streaming ZIP assembly utility (archiver -> PassThrough -> Web ReadableStream)
  - Zod validation schema for package request body
  - GET /api/hymns/search endpoint wrapping searchHymns()
  - Per-hymn error handling with ERROR.txt fallback
  - Combined himnos.pdf at ZIP root
affects: [03-02-PLAN, 04-wizard-ui]

# Tech tracking
tech-stack:
  added: [archiver, "@types/archiver"]
  patterns: [streaming-zip-assembly, per-entry-error-handling, web-readable-stream-bridge]

key-files:
  created:
    - app/lib/zip/zip.schema.ts
    - app/lib/zip/generate-hymn-zip.ts
    - app/api/hymns/search/route.ts
    - tests/lib/zip/generate-hymn-zip.test.ts
    - tests/api/hymn-search.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Used zlib level 5 for balanced speed/compression in ZIP generation"
  - "Per-hymn error handling: ERROR.txt per folder instead of failing entire ZIP"
  - "Combined himnos.pdf at root for convenience printing"

patterns-established:
  - "Streaming ZIP: archiver -> PassThrough -> Readable.toWeb() for Next.js route handler compatibility"
  - "Audio download: Readable.fromWeb(response.body) for Node stream conversion from fetch"
  - "Search route pattern: parse query params, call service, return {ok, data} JSON with Cache-Control"

requirements-completed: [GEN-01, GEN-02, GEN-03]

# Metrics
duration: 4min
completed: 2026-03-29
---

# Phase 3 Plan 1: ZIP Assembly and Hymn Search Summary

**Streaming ZIP assembly with archiver (per-hymn PDFs + audio + ERROR.txt fallback) and GET /api/hymns/search endpoint with Zod validation schema**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T20:17:22Z
- **Completed:** 2026-03-29T20:21:21Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Streaming ZIP assembly utility bridging archiver -> PassThrough -> Web ReadableStream for Next.js route handlers
- Per-hymn error isolation: individual PDF/audio failures produce ERROR.txt instead of failing the whole ZIP
- GET /api/hymns/search route with query, hymnal, category, limit, offset params and 60s cache
- Zod schema validating package requests (1-50 hymns, audio selections, layout, style)
- 12 unit tests covering ZIP assembly, folder naming, error handling, and search endpoint

## Task Commits

Each task was committed atomically:

1. **Task 1: Install archiver, create Zod schema and streaming ZIP assembly utility** - `42f510e` (feat)
2. **Task 2: Create GET /api/hymns/search route with tests** - `26f639e` (feat)

## Files Created/Modified
- `app/lib/zip/zip.schema.ts` - Zod validation schema for package request (hymn IDs, audio, layout, style)
- `app/lib/zip/generate-hymn-zip.ts` - Core ZIP assembly: createStreamingZip, hymnFolderName, assembleHymnPackage
- `app/api/hymns/search/route.ts` - GET search endpoint wrapping searchHymns() with param parsing
- `tests/lib/zip/generate-hymn-zip.test.ts` - 8 unit tests for ZIP assembly logic
- `tests/api/hymn-search.test.ts` - 4 unit tests for search route
- `package.json` - Added archiver and @types/archiver dependencies
- `package-lock.json` - Updated lockfile

## Decisions Made
- Used zlib compression level 5 (balanced speed/compression) per research recommendation
- Per-hymn error handling creates ERROR.txt in hymn folder rather than failing entire ZIP
- Combined himnos.pdf generated at ZIP root for convenient single-file printing
- Search route uses s-maxage=60 with stale-while-revalidate=30 for CDN caching

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used --legacy-peer-deps for archiver install**
- **Found during:** Task 1 (npm install)
- **Issue:** npm install archiver failed due to peer dependency conflicts with React 19
- **Fix:** Used --legacy-peer-deps flag, consistent with Docker build pattern
- **Files modified:** package.json, package-lock.json
- **Verification:** Package installed, tests pass
- **Committed in:** 42f510e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Standard peer-dep workaround already used in project. No scope creep.

## Issues Encountered
None beyond the peer dependency resolution above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all functions are fully implemented with real logic.

## Next Phase Readiness
- ZIP assembly utility ready for Plan 02's POST /api/hymns/package route handler
- Search endpoint ready for Phase 4's wizard UI to consume
- Zod schema ready for POST body validation in Plan 02

## Self-Check: PASSED

All 5 created files verified on disk. Both task commits (42f510e, 26f639e) verified in git log.

---
*Phase: 03-api-routes-and-zip-streaming*
*Completed: 2026-03-29*
