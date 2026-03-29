---
phase: 02-pdf-generation-for-server-side-rendering
plan: 02
subsystem: pdf
tags: [react-pdf, pdf-generation, two-per-page, render-to-buffer]

# Dependency graph
requires:
  - phase: 02-01
    provides: "HymnPageDecorated, HymnPagePlain, pdf-tokens, pdf-fonts, HymnForPdf interface, parseHymnHtml"
provides:
  - "HymnPageTwoUp component for 2-per-page hymn layout (decorated + plain)"
  - "renderHymnPdf() single entry point for all 4 layout/style PDF combinations"
  - "PdfLayout and PdfStyle types for API consumption"
affects: [03-zip-api, 04-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: ["renderHymnPdf convenience function composing layout + style into renderToBuffer", "dynamic import pattern for lazy-loading PDF page components"]

key-files:
  created:
    - app/components/pdf-components/pdf-pages/HymnPageTwoUp.tsx
    - app/lib/pdf/render-hymn-pdf.ts
    - tests/pdf/render-hymn-pdf.test.ts
  modified:
    - tests/pdf/hymn-pages.test.ts

key-decisions:
  - "renderHymnPdf uses dynamic imports for page components to avoid loading unused variants"
  - "HymnPageTwoUp delegates to DecoratedTwoUp and PlainTwoUp sub-components for style separation"

patterns-established:
  - "Convenience function pattern: renderHymnPdf composes components + renderToBuffer for downstream API consumption"
  - "Dynamic component selection: style/layout params determine which PDF component gets loaded"

requirements-completed: [IMPR-01, IMPR-02, IMPR-03, IMPR-04]

# Metrics
duration: 6min
completed: 2026-03-29
---

# Phase 02 Plan 02: Two-Per-Page Layout and renderHymnPdf Summary

**HymnPageTwoUp 2-column layout with decorated/plain styles plus renderHymnPdf single entry point for all 4 PDF combinations**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-29T19:32:17Z
- **Completed:** 2026-03-29T19:38:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- HymnPageTwoUp renders two hymns side-by-side with vertical divider for both decorated and plain styles
- renderHymnPdf() provides single async entry point producing PDF Buffer for any layout/style combination
- Full test suite (38 tests) passes with no regressions across Phase 1 and Phase 2

## Task Commits

Each task was committed atomically:

1. **Task 1: Build HymnPageTwoUp component for 2-per-page layout** - `a462bfe` (feat)
2. **Task 2: Build renderHymnPdf convenience function with integration tests** - `653c80d` (feat)

## Files Created/Modified
- `app/components/pdf-components/pdf-pages/HymnPageTwoUp.tsx` - 2-per-page layout component supporting decorated (shared header/footer) and plain (per-column headers) styles
- `app/lib/pdf/render-hymn-pdf.ts` - Convenience function composing layout + style into renderToBuffer call with hymn HTML parsing
- `tests/pdf/render-hymn-pdf.test.ts` - 6 integration tests covering all 4 combos + odd hymn count + empty input
- `tests/pdf/hymn-pages.test.ts` - Added 4 HymnPageTwoUp tests (decorated, plain, single hymn, long overflow)

## Decisions Made
- renderHymnPdf uses dynamic imports (`await import()`) for page components to avoid loading unused variants at module level
- HymnPageTwoUp delegates to separate DecoratedTwoUp and PlainTwoUp internal components for clear style separation
- Shared header in decorated 2-up shows church name only (individual hymn titles in columns) per UI-SPEC

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reinstalled node_modules to fix react-reconciler resolution**
- **Found during:** Task 1 (test execution)
- **Issue:** Main repo node_modules had broken @react-pdf/renderer setup -- react-reconciler not resolving, causing "Cannot read properties of undefined (reading 'hasOwnProperty')" in all renderToBuffer calls
- **Fix:** Ran `npm install --legacy-peer-deps` to reinstall dependencies
- **Verification:** All 38 tests pass, renderToBuffer works correctly
- **Committed in:** Not committed (node_modules is gitignored)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Dependency fix was necessary for test execution. No scope creep.

## Issues Encountered
- Vitest picks up duplicate test files from .claude/worktrees/ directories; resolved by using `--exclude '.claude/**'` flag

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all components are fully wired with real data paths.

## Next Phase Readiness
- All 4 PDF rendering variants complete (1-per-page decorated, 1-per-page plain, 2-per-page decorated, 2-per-page plain)
- renderHymnPdf() ready for Phase 3 API route consumption
- PdfLayout and PdfStyle types exported for downstream use

---
*Phase: 02-pdf-generation-for-server-side-rendering*
*Completed: 2026-03-29*

## Self-Check: PASSED
- All 4 created/modified files exist on disk
- Both task commits (a462bfe, 653c80d) found in git log
