---
phase: 04-wizard-ui-and-download-experience
plan: 01
subsystem: empaquetador-wizard-infrastructure
tags: [wizard, reducer, hooks, api-routes, search, toaster]
dependency_graph:
  requires: [zip-schema, hymn-interface, directus-services]
  provides: [wizard-reducer, build-package-request, hymn-search-hook, hymnals-api, categories-api, toaster-mount]
  affects: [layout, search-route]
tech_stack:
  added: []
  patterns: [useReducer-with-Map/Set, debounced-fetch-with-AbortController, numeric-query-detection]
key_files:
  created:
    - app/empaquetador/hooks/useWizardReducer.ts
    - app/empaquetador/lib/build-package-request.ts
    - app/empaquetador/hooks/useHymnSearch.ts
    - app/api/hymnals/route.ts
    - app/api/categories/route.ts
    - tests/empaquetador/wizardReducer.test.ts
    - tests/empaquetador/buildPackageRequest.test.ts
  modified:
    - app/layout.tsx
    - app/api/hymns/search/route.ts
decisions:
  - "Numeric q param in search route routes to hymnNumber filter exclusively (not both name+number) to match user intent"
  - "Used shadcn Toaster wrapper (not raw sonner) for consistent theming even without ThemeProvider"
  - "SELECT_ALL_AUDIO only selects non-null audio fields per hymn to avoid requesting missing files"
metrics:
  duration: 4min
  completed: 2026-03-29
  tasks: 2
  files: 9
---

# Phase 04 Plan 01: Wizard Infrastructure and Pure Logic Summary

Tested wizard reducer with 10 action types, buildPackageRequest Map/Set-to-plain serializer, debounced search hook with AbortController, Sonner toaster mount, and two new filter API routes for hymnals and categories.

## What Was Built

### Task 1: Wizard Reducer and buildPackageRequest (TDD)

**useWizardReducer.ts** - Complete state management for the 3-step Empaquetador wizard:
- `WizardState` interface with step, selectedHymns, layout, style, audioSelections (Map<string, Set<string>>), isGenerating, error
- `WizardAction` discriminated union covering 10 action types: SET_STEP, ADD_HYMN, REMOVE_HYMN, SET_LAYOUT, SET_STYLE, TOGGLE_AUDIO, SELECT_ALL_AUDIO, SET_GENERATING, SET_ERROR, RESET
- `wizardReducer` pure function handling all cases with immutable Map/Set updates
- `useWizardReducer` hook wrapping useReducer with initialWizardState
- AUDIO_FIELD_NAMES constant exported for reuse

**build-package-request.ts** - Converts wizard state (Map/Set) to plain PackageRequest object compatible with the ZIP generation API schema.

**Tests**: 14 reducer tests (one per action + edge cases) and 4 buildPackageRequest tests including Zod schema validation. All 18 passing.

### Task 2: Toaster, API Routes, Search Fix, Search Hook

**Toaster mount** - Added `<Toaster />` from shadcn/ui as last child in `<body>` of root layout. Global toast notifications now available via `toast()` from sonner.

**Search route fix** - Numeric `q` param (e.g., "123") now searches by `hymn_number` instead of name. Non-numeric queries continue searching by name. Avoids AND logic conflict where typing a number would match neither name nor number.

**GET /api/hymnals** - Returns list of hymnals (id, name) from Directus, sorted by name. 5-minute cache. Used by wizard dropdown filters.

**GET /api/categories** - Returns list of hymn categories (id, name) from Directus, sorted by name. 5-minute cache. Used by wizard dropdown filters.

**useHymnSearch hook** - Client-side search hook with:
- 300ms debounce via setTimeout
- AbortController to cancel stale requests
- Filters: query, hymnal, category
- Clears results when no query and no filters set
- Returns reactive state (query, hymnal, category, results, isLoading, error) with setters

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `9151e90` | feat(04-01): wizard reducer and buildPackageRequest with tests |
| 2 | `65f434d` | feat(04-01): toaster mount, filter API routes, search fix, and search hook |

## Test Results

All 75 tests passing (18 new + 57 existing):
- `tests/empaquetador/wizardReducer.test.ts` - 14 passed
- `tests/empaquetador/buildPackageRequest.test.ts` - 4 passed
- All existing test suites unaffected

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all implementations are fully wired to real data sources and types.

## Self-Check: PASSED

- All 7 created files exist on disk
- Both commit hashes (9151e90, 65f434d) found in git log
