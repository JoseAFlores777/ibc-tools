---
phase: 02-pdf-generation-for-server-side-rendering
plan: 01
subsystem: pdf
tags: [react-pdf, pdf-generation, server-side-rendering, adamina, helvetica]

# Dependency graph
requires:
  - phase: 01-foundation-and-data-layer
    provides: "HymnForPdf and ParsedVerse interfaces, Hymn.interface.ts"
provides:
  - "HymnPageDecorated: server-safe decorated hymn page (1-per-page) with header/footer/branding"
  - "HymnPagePlain: server-safe plain hymn page (1-per-page) with Helvetica, no footer"
  - "pdf-fonts.ts: Adamina font registration via absolute path for server-side rendering"
  - "pdf-tokens.ts: named design constants (page dimensions, margins, colors, font scales)"
  - "@react-pdf/renderer v4.3.2 installed with React 19 compatibility"
affects: [02-02, 03-zip-api-route]

# Tech tracking
tech-stack:
  added: ["@react-pdf/renderer@4.3.2 (upgraded from 3.4.4)"]
  patterns: ["Server-safe PDF components (no 'use client', no browser DOM)", "Side-effect font import pattern", "Named design tokens for PDF StyleSheet constants"]

key-files:
  created:
    - "app/components/pdf-components/shared/pdf-fonts.ts"
    - "app/components/pdf-components/shared/pdf-tokens.ts"
    - "app/components/pdf-components/pdf-pages/HymnPageDecorated.tsx"
    - "app/components/pdf-components/pdf-pages/HymnPagePlain.tsx"
    - "tests/fixtures/hymn-pdf-samples.ts"
    - "tests/pdf/hymn-pages.test.ts"
  modified:
    - "package.json"
    - "package-lock.json"
    - "app/lib/directus/services/hymns.ts"

key-decisions:
  - "Used --legacy-peer-deps for @react-pdf/renderer v4.3.2 install due to ESLint peer dep conflict (matches Docker build pattern)"
  - "Used path.join(process.cwd(), 'public', ...) for server-safe asset resolution (fonts and logo)"

patterns-established:
  - "Server-safe PDF component pattern: no 'use client', import path module, use absolute paths for assets"
  - "Side-effect font import: import '@/...pdf-fonts' registers Adamina at module load"
  - "formatAuthors() utility for grouping authors by role in footer"

requirements-completed: [IMPR-01, IMPR-03, IMPR-04]

# Metrics
duration: 5min
completed: 2026-03-29
---

# Phase 02 Plan 01: PDF Rendering Foundation Summary

**Upgraded @react-pdf/renderer to v4.3.2, built server-safe shared PDF infrastructure (fonts, design tokens), and delivered HymnPageDecorated and HymnPagePlain 1-per-page components with passing tests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-29T19:23:51Z
- **Completed:** 2026-03-29T19:29:20Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Upgraded @react-pdf/renderer from v3.4.4 to v4.3.2 for React 19 compatibility; build passes with all existing routes intact
- Created shared PDF infrastructure: server-safe Adamina font registration (pdf-fonts.ts) and comprehensive design tokens (pdf-tokens.ts) with page dimensions, margins, colors, font scales
- Built HymnPageDecorated: full LETTER page with dark blue header, gold accents, Adamina font, church logo footer, lyrics from ParsedVerse[]
- Built HymnPagePlain: clean LETTER page with Helvetica, header (number/title/hymnal), bold centered verse markers, left-aligned lyrics, no footer (per D-01)
- All 4 unit tests pass via renderToBuffer() producing valid PDF buffers; full test suite (28 tests) green

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade @react-pdf/renderer and create shared PDF infrastructure** - `0f28472` (feat)
2. **Task 2 RED: Add failing tests for HymnPageDecorated and HymnPagePlain** - `9ff8049` (test)
3. **Task 2 GREEN: Implement HymnPageDecorated and HymnPagePlain components** - `9f4770b` (feat)

## Files Created/Modified
- `app/components/pdf-components/shared/pdf-fonts.ts` - Server-safe Adamina font registration via Font.register() with absolute path
- `app/components/pdf-components/shared/pdf-tokens.ts` - Named constants for page dimensions, margins, colors, font scales (1-up and 2-up)
- `app/components/pdf-components/pdf-pages/HymnPageDecorated.tsx` - Decorated hymn page with header, body, footer, branding
- `app/components/pdf-components/pdf-pages/HymnPagePlain.tsx` - Plain hymn page with header and body only, Helvetica
- `tests/fixtures/hymn-pdf-samples.ts` - Mock HymnForPdf and ParsedVerse[] data (full, minimal, long)
- `tests/pdf/hymn-pages.test.ts` - 4 renderToBuffer tests for both components
- `package.json` - @react-pdf/renderer bumped to 4.3.2
- `package-lock.json` - Updated lockfile
- `app/lib/directus/services/hymns.ts` - Fixed @ts-ignore placement for build compatibility

## Decisions Made
- Used `--legacy-peer-deps` for npm install due to ESLint peer dependency conflict (consistent with Dockerfile build pattern)
- Used `path.join(process.cwd(), 'public', ...)` for both font and logo paths, ensuring server-side rendering works correctly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed @ts-ignore placement in hymns.ts**
- **Found during:** Task 1 (build verification after @react-pdf upgrade)
- **Issue:** Pre-existing `@ts-ignore` on line 94 of hymns.ts only suppressed line 95, but the TypeScript error was on line 96 (`readItems('hymn'` argument). Build failed.
- **Fix:** Moved to `@ts-expect-error` directly above the `readItems()` call
- **Files modified:** app/lib/directus/services/hymns.ts
- **Verification:** `npm run build` exits 0
- **Committed in:** 0f28472 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Pre-existing type suppression was misplaced; fix necessary for build to pass. No scope creep.

## Issues Encountered
- Worktree was behind main branch and missing Phase 1 outputs; resolved by fast-forward merge before starting tasks

## Known Stubs
None -- both components are fully implemented with real data flow from HymnForPdf + ParsedVerse interfaces.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- HymnPageDecorated and HymnPagePlain are ready for consumption by Plan 02-02 (HymnPageTwoUp and renderHymnPdf)
- Shared pdf-fonts.ts and pdf-tokens.ts provide the foundation for all PDF components
- Design tokens include 2-per-page scales ready for Plan 02-02's two-up layout

---
*Phase: 02-pdf-generation-for-server-side-rendering*
*Completed: 2026-03-29*
