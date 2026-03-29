---
phase: 01-foundation-and-data-layer
plan: 02
subsystem: api
tags: [directus, service-layer, hymns, audio-metadata, typescript]

requires:
  - phase: 01-01
    provides: "Hymn interfaces (HymnSearchResult, HymnForPdf, AudioFileInfo, HymnAudioFiles), vitest config, test scaffolds"
provides:
  - "searchHymns() — query hymns by name, number, hymnal, category with audio metadata"
  - "fetchHymnForPdf() — complete hymn data retrieval including authors, lyrics, audio files"
  - "getAssetUrl() — Directus asset URL construction from file ID"
  - "mapAudioFiles() helper — resolves raw Directus audio fields to typed AudioFileInfo"
affects: [02-pdf-generation, 03-api-routes, 04-ui]

tech-stack:
  added: []
  patterns: ["Dynamic filter builder for Directus readItems", "Audio field resolution via nested field selection", "mapAudioFiles helper for 6-field audio grouping"]

key-files:
  created: ["app/lib/directus/services/hymns.ts"]
  modified: ["tests/services/hymns.test.ts"]

key-decisions:
  - "Used dynamic buildAudioFields() helper instead of hardcoded field strings to reduce duplication across search and PDF functions"
  - "Used satisfies operator for type-safe return mapping while keeping flexible Directus SDK interaction"

patterns-established:
  - "Audio field resolution: AUDIO_FIELD_NAMES constant + mapAudioFiles() maps raw Directus response to typed HymnAudioFiles"
  - "Dynamic filter builder: construct filter object conditionally from HymnSearchFilters"

requirements-completed: []

duration: 3min
completed: 2026-03-29
---

# Phase 01 Plan 02: Hymn Service Layer Summary

**Directus hymn service with search filters (name/number/hymnal/category), PDF data retrieval, audio file metadata resolution, and asset URL construction**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-29T04:50:46Z
- **Completed:** 2026-03-29T04:53:55Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments

- searchHymns() supports 4 filter types: name (_icontains), hymn number (_eq), hymnal UUID, category M2M deep filter
- fetchHymnForPdf() extends existing getHymn() pattern with audio file resolution via nested field selection
- Audio fields (6 total: track_only, midi_file, soprano/alto/tenor/bass_voice) resolved to AudioFileInfo objects with metadata
- getAssetUrl() constructs Directus asset download URLs with DIRECTUS_URL env var fallback
- 12 tests passing with fully mocked Directus client

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests for hymn service** - `da3af1d` (test)
2. **Task 1 GREEN: Implement hymn service functions** - `c6828cb` (feat)

## Files Created/Modified

- `app/lib/directus/services/hymns.ts` - Hymn service layer with searchHymns, fetchHymnForPdf, getAssetUrl exports
- `tests/services/hymns.test.ts` - 12 tests covering all service functions with mocked Directus client

## Decisions Made

- Used dynamic `buildAudioFields()` helper to generate audio field strings from constants, reducing duplication between searchHymns and fetchHymnForPdf
- Used `satisfies` TypeScript operator for return value type checking while maintaining flexible Directus SDK typing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- npm dependencies not installed in worktree - resolved with `npm install --legacy-peer-deps`

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all functions are fully implemented with real Directus SDK calls.

## Next Phase Readiness

- Hymn service layer complete, ready for Phase 2 (PDF generation) and Phase 3 (API routes)
- searchHymns provides the data layer for the hymn selector UI (Phase 4)
- fetchHymnForPdf provides the data layer for hymn PDF rendering (Phase 2)
- getAssetUrl provides the URL builder for audio file downloads (Phase 3 ZIP generation)

## Self-Check: PASSED

- [x] app/lib/directus/services/hymns.ts exists
- [x] tests/services/hymns.test.ts exists
- [x] 01-02-SUMMARY.md exists
- [x] Commit da3af1d found (RED tests)
- [x] Commit c6828cb found (GREEN implementation)
- [x] 12/12 tests passing

---
*Phase: 01-foundation-and-data-layer*
*Completed: 2026-03-29*
