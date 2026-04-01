---
phase: 07-musicxml-score-viewer-with-verovio-and-spessasynth
plan: 01
subsystem: infra
tags: [verovio, spessasynth, wasm, musicxml, soundfont, proxy-routes]

requires:
  - phase: 01-foundation-and-data-layer
    provides: fetchAsset, isValidUuid, searchHymns service layer
provides:
  - verovio 6.1.0 and spessasynth_lib 4.2.7 installed with WASM webpack config
  - MusicXML proxy route at /api/hymns/score/[fileId]
  - SoundFont proxy route at /api/hymns/soundfont
  - HymnSearchResult extended with musicxmlFileId and hasMusicXml
  - SpessaSynth AudioWorklet processor in public/ with postinstall hook
  - Automated test coverage for both proxy routes (6 tests)
affects: [07-02, 07-03, 07-04]

tech-stack:
  added: [verovio@6.1.0, spessasynth_lib@4.2.7]
  patterns: [asyncWebAssembly webpack experiment, AudioWorklet processor in public/]

key-files:
  created:
    - app/api/hymns/score/[fileId]/route.ts
    - app/api/hymns/soundfont/route.ts
    - public/spessasynth_processor.min.js
    - tests/api/score-proxy.test.ts
    - tests/api/soundfont-proxy.test.ts
  modified:
    - package.json
    - next.config.mjs
    - app/interfaces/Hymn.interface.ts
    - app/lib/directus/services/hymns.ts

key-decisions:
  - "Removed tone and @tonejs/midi since no imports remain in codebase"
  - "Used postinstall script for AudioWorklet processor copy to survive npm ci"
  - "MusicXML proxy uses 24h cache, SoundFont proxy uses 7d immutable cache"

patterns-established:
  - "WASM webpack experiments enabled only for client-side bundles"
  - "AudioWorklet processor files served from public/ directory"

requirements-completed: [D-01, D-03, D-08]

duration: 13min
completed: 2026-04-01
---

# Phase 7 Plan 1: Infrastructure Summary

**Verovio and SpessaSynth installed with WASM webpack, MusicXML/SoundFont proxy routes, and HymnSearchResult extended with MusicXML availability**

## Performance

- **Duration:** 13 min
- **Started:** 2026-04-01T19:08:29Z
- **Completed:** 2026-04-01T19:21:30Z
- **Tasks:** 4
- **Files modified:** 11

## Accomplishments
- Installed verovio 6.1.0 and spessasynth_lib 4.2.7, removed unused Tone.js
- Configured Next.js webpack for client-side WASM (asyncWebAssembly + layers experiments)
- Created MusicXML proxy route (/api/hymns/score/[fileId]) with 24h cache and UUID validation
- Created SoundFont proxy route (/api/hymns/soundfont) with 7d immutable cache via SOUNDFONT_FILE_ID env var
- Extended HymnSearchResult with musicxmlFileId and hasMusicXml fields
- Created 6 automated tests for proxy routes (all passing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install packages, webpack config, copy AudioWorklet processor** - `f0df9be` (chore)
2. **Task 2: Create Wave 0 test scaffolds for proxy routes** - `7d37ab1` (test)
3. **Task 3: Create MusicXML and SoundFont proxy routes** - `8565f1c` (feat)
4. **Task 4: Extend Hymn types and searchHymns** - `eb6901d` (feat)

## Files Created/Modified
- `package.json` - Added verovio, spessasynth_lib; removed tone, @tonejs/midi; added postinstall script
- `next.config.mjs` - Added webpack WASM experiments for client-side bundles
- `public/spessasynth_processor.min.js` - AudioWorklet processor for SpessaSynth playback
- `app/api/hymns/score/[fileId]/route.ts` - MusicXML proxy with UUID validation and 24h cache
- `app/api/hymns/soundfont/route.ts` - SoundFont proxy with immutable caching
- `app/interfaces/Hymn.interface.ts` - Added musicxmlFileId and hasMusicXml to HymnSearchResult
- `app/lib/directus/services/hymns.ts` - Query materials.musicxml, map to HymnSearchResult
- `tests/api/score-proxy.test.ts` - 3 tests for MusicXML proxy route
- `tests/api/soundfont-proxy.test.ts` - 3 tests for SoundFont proxy route
- `tests/empaquetador/buildPackageRequest.test.ts` - Updated mock with new fields
- `tests/empaquetador/wizardReducer.test.ts` - Updated mock with new fields

## Decisions Made
- Removed tone and @tonejs/midi since no imports remain in the codebase (cleanup)
- Used postinstall script for AudioWorklet processor copy to ensure it survives npm ci
- MusicXML proxy: 24h cache (scores may be updated occasionally)
- SoundFont proxy: 7d immutable cache (SoundFont files rarely change)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated test mocks for new HymnSearchResult fields**
- **Found during:** Task 4
- **Issue:** Existing test mock functions for HymnSearchResult didn't include new musicxmlFileId and hasMusicXml fields, causing TypeScript `satisfies` to fail
- **Fix:** Added musicxmlFileId: null and hasMusicXml: false to mock functions in buildPackageRequest.test.ts and wizardReducer.test.ts
- **Files modified:** tests/empaquetador/buildPackageRequest.test.ts, tests/empaquetador/wizardReducer.test.ts
- **Committed in:** eb6901d

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug fix)
**Impact on plan:** Necessary for type correctness. No scope creep.

## Issues Encountered
- Pre-existing test failures in tests/services/hymns.test.ts (1 test) and tests/api/hymn-package.test.ts (1 test) -- not caused by this plan's changes, confirmed by running tests before changes

## User Setup Required

Environment variable `SOUNDFONT_FILE_ID` must be set in the deployment environment to the Directus file UUID of the SoundFont file. Without this, the /api/hymns/soundfont route returns 500.

## Next Phase Readiness
- Verovio and SpessaSynth packages ready for import in UI components
- WASM webpack config enables Verovio's WASM module in browser
- Proxy routes provide data access for MusicXML rendering and MIDI playback
- HymnSearchResult.hasMusicXml enables UI to show score viewer conditionally

---
*Phase: 07-musicxml-score-viewer-with-verovio-and-spessasynth*
*Completed: 2026-04-01*
