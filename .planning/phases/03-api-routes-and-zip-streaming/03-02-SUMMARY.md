---
phase: 03-api-routes-and-zip-streaming
plan: 02
subsystem: api
tags: [streaming, zip, archiver, zod, next-api-route]

# Dependency graph
requires:
  - phase: 03-01
    provides: "createStreamingZip, assembleHymnPackage, packageRequestSchema from ZIP assembly utility"
provides:
  - "POST /api/hymns/package endpoint for streaming ZIP generation"
  - "Integration tests for package endpoint"
affects: [04-wizard-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Raw Response (not NextResponse) for binary streaming in Next.js route handlers", "Concurrent assembly pattern: fire-and-forget assembleHymnPackage while returning streaming Response immediately"]

key-files:
  created:
    - app/api/hymns/package/route.ts
    - tests/api/hymn-package.test.ts
  modified: []

key-decisions:
  - "Used raw Response instead of NextResponse for streaming binary ZIP data"
  - "Assembly runs concurrently (not awaited) so response streams immediately"
  - "All-fail case logged server-side; ZIP contains ERROR.txt files since status cannot change after headers sent"

patterns-established:
  - "Binary streaming pattern: createStreamingZip() -> new Response(webStream, headers) for non-JSON API responses"
  - "Concurrent assembly: fire .then()/.catch() on assembleHymnPackage, return Response before assembly completes"

requirements-completed: [GEN-01, GEN-02, GEN-03, GEN-04]

# Metrics
duration: 3min
completed: 2026-03-29
---

# Phase 3 Plan 2: Streaming ZIP Endpoint Summary

**POST /api/hymns/package endpoint with Zod validation, streaming ZIP response via archiver bridge, and 7 integration tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-29T20:24:48Z
- **Completed:** 2026-03-29T20:27:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- POST /api/hymns/package validates request body with Zod schema (400 for invalid JSON, missing/empty hymns)
- Valid requests return streaming ZIP with Content-Type: application/zip, Content-Disposition: attachment, X-Hymn-Count headers
- Assembly runs concurrently (not awaited) so response begins streaming immediately
- 7 integration tests covering validation errors, headers, ReadableStream body, and ZIP magic bytes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create POST /api/hymns/package streaming ZIP endpoint** - `d3636bf` (feat)
2. **Task 2: Create integration tests for POST /api/hymns/package** - `77be17e` (test)

## Files Created/Modified
- `app/api/hymns/package/route.ts` - POST endpoint with Zod validation, streaming ZIP response
- `tests/api/hymn-package.test.ts` - 7 integration tests for the package endpoint

## Decisions Made
- Used raw `Response` (not `NextResponse`) for streaming binary data per RESEARCH.md anti-pattern guidance
- Assembly fires concurrently via `.then()/.catch()` -- Response returned before assembly completes
- D-09 all-fail case: logged server-side since HTTP status cannot change after streaming headers sent

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all functionality is fully wired.

## Next Phase Readiness
- Phase 3 complete: ZIP assembly utility (Plan 01) + streaming endpoint (Plan 02) ready
- Phase 4 wizard UI can call POST /api/hymns/package with JSON body and receive streaming ZIP download
- Full test suite (57 tests) passes green

---
*Phase: 03-api-routes-and-zip-streaming*
*Completed: 2026-03-29*
