---
phase: 01-foundation-and-data-layer
plan: 03
subsystem: pdf
tags: [node-html-parser, html-parser, server-side, react-pdf, typescript]

# Dependency graph
requires:
  - phase: 01-01
    provides: "ParsedVerse/ParsedLine interfaces, test fixtures, vitest framework"
provides:
  - "parseHymnHtml() - converts letter_hymn HTML to ParsedVerse[] with formatting"
  - "extractPlainText() - strips HTML to plain string[] for minimal PDF style"
affects: [02-pdf-generation, hymn-pdf-components]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-safe-html-parsing, node-html-parser-entity-decoding]

key-files:
  created: [app/lib/pdf/html-to-pdf.ts]
  modified: [tests/lib/html-to-pdf.test.ts]

key-decisions:
  - "Used node-html-parser textContent for automatic HTML entity decoding instead of manual decode map"
  - "Title detection uses exact match against keyword array (same as HymnPagePdf.tsx line 204)"

patterns-established:
  - "Server-safe HTML parsing: use node-html-parser parse() instead of browser DOM APIs"
  - "Line-level formatting detection: check first child tag for bold/italic wrapping"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-03-29
---

# Phase 01 Plan 03: HTML-to-PDF Parser Summary

**Server-safe hymn HTML parser using node-html-parser that converts Directus letter_hymn rich text into structured ParsedVerse[] with bold/italic formatting and plain text extraction**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-29T04:50:35Z
- **Completed:** 2026-03-29T04:53:29Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- parseHymnHtml converts letter_hymn HTML into ParsedVerse[] with title/verse classification and line-level bold/italic formatting
- extractPlainText strips all markup for minimal PDF style, returning clean string[] with decoded entities
- Zero browser DOM dependencies (no document, window, or DOMParser usage)
- All 12 tests passing covering standard, formatted, minimal, empty, and entity-heavy hymn HTML

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests for HTML parser** - `61af129` (test)
2. **Task 1 GREEN: Implement server-safe parser** - `6057211` (feat)

_TDD task with RED and GREEN commits_

## Files Created/Modified
- `app/lib/pdf/html-to-pdf.ts` - Server-safe HTML parser with parseHymnHtml and extractPlainText functions
- `tests/lib/html-to-pdf.test.ts` - 12 test cases covering all parser behaviors

## Decisions Made
- Used node-html-parser's built-in textContent property for HTML entity decoding -- automatically handles all entities without manual decode maps
- Title detection matches exact keyword list from existing HymnPagePdf.tsx (CORO, I-X roman numerals)
- Bold/italic detection checks the outermost tag of each line segment rather than deep-scanning for mixed formatting (sufficient for hymn content patterns)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all functions fully implemented and tested.

## Next Phase Readiness
- HTML parser ready for Phase 2 PDF generation components to import parseHymnHtml/extractPlainText
- Replaces browser-dependent extractParagraphs() from HymnPagePdf.tsx with server-safe alternative

## Self-Check: PASSED

---
*Phase: 01-foundation-and-data-layer*
*Completed: 2026-03-29*
