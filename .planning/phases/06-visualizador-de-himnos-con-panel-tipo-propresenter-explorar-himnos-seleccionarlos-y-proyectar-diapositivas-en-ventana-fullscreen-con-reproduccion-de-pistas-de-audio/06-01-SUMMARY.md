---
phase: 06-visualizador
plan: 01
subsystem: ui
tags: [typescript, broadcast-channel, reducer, hooks, vitest, happy-dom, slide-builder]

requires:
  - phase: 01-foundation
    provides: "HymnForPdf, ParsedVerse, ParsedLine interfaces and html-to-pdf parser logic"
provides:
  - "VisualizadorState, VisualizadorAction, PlaylistHymn, SlideData, ThemeConfig type contracts"
  - "Client-side parseHymnHtmlClient (DOMParser-based) and buildSlideGroups with intercalated chorus"
  - "BroadcastChannel protocol (ProjectionMessage) for cross-window projection"
  - "visualizadorReducer with 14 action types for full state management"
  - "useBroadcastChannel, useAutoFontSize, useKeyboardShortcuts hooks"
  - "5 theme presets (3 solid + 2 gradient)"
affects: [06-02, 06-03, 06-04]

tech-stack:
  added: [happy-dom, jsdom]
  patterns: [useReducer-based state management, BroadcastChannel cross-window sync, binary-search font sizing, TDD with happy-dom environment pragma]

key-files:
  created:
    - app/visualizador/lib/types.ts
    - app/visualizador/lib/projection-channel.ts
    - app/visualizador/lib/projection-channel.test.ts
    - app/visualizador/lib/theme-presets.ts
    - app/visualizador/lib/build-slides-client.ts
    - app/visualizador/lib/build-slides-client.test.ts
    - app/visualizador/hooks/useVisualizador.ts
    - app/visualizador/hooks/useVisualizador.test.ts
    - app/visualizador/hooks/useBroadcastChannel.ts
    - app/visualizador/hooks/useAutoFontSize.ts
    - app/visualizador/hooks/useKeyboardShortcuts.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Used happy-dom instead of jsdom for vitest environment (jsdom 27 has ESM compat issues with @csstools/css-calc)"
  - "Client-side DOMParser replaces node-html-parser for browser-safe hymn HTML parsing"
  - "Reducer exported separately from hook for direct unit testing without React"
  - "Font size offset capped at +/-20px with 4px increments"

patterns-established:
  - "happy-dom pragma: test files needing DOM APIs use // @vitest-environment happy-dom"
  - "Reducer testing pattern: export pure reducer function, test directly without useReducer"
  - "BroadcastChannel hook: useRef for channel + useEffect lifecycle with onMessage callback ref"

requirements-completed: [D-05, D-06, D-07, D-09, D-10, D-11, D-12, D-13, D-14, D-15, D-20]

duration: 5min 38s
completed: 2026-03-31
---

# Phase 06 Plan 01: Visualizador Core Infrastructure Summary

**TypeScript contracts, client-side slide builder with intercalated chorus, BroadcastChannel protocol, useReducer state management with 14 actions, and keyboard/font/channel hooks -- 35 passing tests**

## Performance

- **Duration:** 5min 38s
- **Started:** 2026-03-31T21:11:28Z
- **Completed:** 2026-03-31T21:17:06Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Full type system for visualizador: VisualizadorState, VisualizadorAction (14 variants), PlaylistHymn, SlideData, ThemeConfig, ProjectionMode, AudioState
- Client-safe parseHymnHtmlClient using DOMParser (ported from node-html-parser server version) with intercalated chorus slide builder
- BroadcastChannel protocol with 6 message types (SHOW_SLIDE, BLACK_SCREEN, CLEAR_TEXT, SHOW_LOGO, PING, PONG) for projection window sync
- visualizadorReducer with auto-advance across hymns (D-07), audio stop on hymn change (D-20), font size clamping
- 4 hooks: useVisualizador (reducer), useBroadcastChannel, useAutoFontSize (binary search canvas), useKeyboardShortcuts (11 shortcuts)
- 35 unit tests all passing across 3 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Types, BroadcastChannel protocol, theme presets, slide builder** - `de006bf` (feat)
2. **Task 2: Reducer hook, broadcast channel hook, auto font size hook, keyboard shortcuts hook** - `5ef8f00` (feat)

## Files Created/Modified
- `app/visualizador/lib/types.ts` - All TypeScript interfaces and discriminated action union
- `app/visualizador/lib/projection-channel.ts` - BroadcastChannel protocol types and CHANNEL_NAME
- `app/visualizador/lib/projection-channel.test.ts` - 7 tests for channel constants and discriminants
- `app/visualizador/lib/theme-presets.ts` - 5 theme presets and DEFAULT_THEME
- `app/visualizador/lib/build-slides-client.ts` - parseHymnHtmlClient + buildSlideGroups
- `app/visualizador/lib/build-slides-client.test.ts` - 10 tests for parser and slide builder
- `app/visualizador/hooks/useVisualizador.ts` - Reducer with 14 action handlers + useVisualizador hook
- `app/visualizador/hooks/useVisualizador.test.ts` - 18 tests for all reducer actions
- `app/visualizador/hooks/useBroadcastChannel.ts` - Channel lifecycle + send/receive abstraction
- `app/visualizador/hooks/useAutoFontSize.ts` - Binary search canvas measurement for optimal font size
- `app/visualizador/hooks/useKeyboardShortcuts.ts` - Global keydown handler with input element guard
- `package.json` - Added happy-dom and jsdom devDependencies

## Decisions Made
- Used happy-dom instead of jsdom for vitest: jsdom 27 has ESM compatibility issues with @csstools/css-calc (ERR_REQUIRE_ESM). happy-dom works cleanly with vitest and provides DOMParser.
- Exported visualizadorReducer as a standalone function (not just inside the hook) to enable direct unit testing without React test utils.
- Font size offset uses +/-4px increments capped at +/-20px for controlled adjustments.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched from jsdom to happy-dom for vitest environment**
- **Found during:** Task 1 (TDD RED phase)
- **Issue:** jsdom 27 fails with ERR_REQUIRE_ESM on @csstools/css-calc when used as vitest environment
- **Fix:** Installed happy-dom, changed test pragma from `// @vitest-environment jsdom` to `// @vitest-environment happy-dom`
- **Files modified:** package.json, build-slides-client.test.ts, useVisualizador.test.ts
- **Verification:** All 35 tests pass with happy-dom environment
- **Committed in:** de006bf, 5ef8f00

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** jsdom still installed as devDependency per plan spec. happy-dom added as working alternative. No functional impact.

## Issues Encountered
None beyond the jsdom ESM compatibility issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All type contracts ready for Plan 02 (control panel UI) to consume
- Hooks ready for integration: useVisualizador provides state/dispatch, useBroadcastChannel for projection sync
- Slide builder tested and ready for rendering in Plan 03 (projection window)
- Theme presets ready for theme picker UI in Plan 02

---
*Phase: 06-visualizador*
*Completed: 2026-03-31*
