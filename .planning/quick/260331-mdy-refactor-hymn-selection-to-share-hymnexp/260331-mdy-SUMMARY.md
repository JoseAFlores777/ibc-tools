---
phase: quick
plan: 260331-mdy
subsystem: hymn-explorer
tags: [refactor, shared-component, hymn-search]
dependency_graph:
  requires: []
  provides: [shared-hymn-explorer, shared-use-hymn-search]
  affects: [empaquetador-selection, visualizador-playlist]
tech_stack:
  added: []
  patterns: [shared-component-extraction, re-export-for-backward-compat]
key_files:
  created:
    - app/components/HymnExplorer.tsx
    - app/hooks/useHymnSearch.ts
  modified:
    - app/empaquetador/hooks/useHymnSearch.ts
    - app/empaquetador/components/StepSeleccion.tsx
decisions:
  - "PlaylistColumn update deferred: visualizador directory does not exist yet (Phase 06 not executed)"
metrics:
  duration: 3min 50s
  completed: 2026-03-31
---

# Quick Task 260331-mdy: Refactor Hymn Selection to Share HymnExplorer

Extracted search/filter/table UI from StepSeleccion into a shared HymnExplorer component with generic props (selectedIds, onToggle), enabling reuse by both empaquetador and future visualizador.

## Tasks Completed

### Task 1: Move useHymnSearch and create HymnExplorer
- **Commit:** 3e918ca
- Copied `useHymnSearch` hook to `app/hooks/useHymnSearch.ts` (shared location)
- Replaced `app/empaquetador/hooks/useHymnSearch.ts` with a re-export for backward compatibility
- Created `app/components/HymnExplorer.tsx` (~300 lines) with props: `selectedIds`, `onToggle`, `selectedHymns?`, `showDetailView?`, `className?`
- Component includes: search field checkboxes, search bar, filter panel (hymnal/category/audio), TanStack table with sorting/pagination, optional HymnDetailView

### Task 2: Refactor StepSeleccion to use HymnExplorer
- **Commit:** d545a75
- Replaced all inline search/filter/table UI with a single `<HymnExplorer>` render
- StepSeleccion reduced from ~493 lines to ~88 lines (layout shell + mobile drawer only)
- Kept: wizard dispatch, selectedIdSet memo, handleToggle, mobile drawer with SelectedHymnChip
- Removed: TanStack table imports, filter state, column definitions, table JSX, all search UI

## Deviations from Plan

### Skipped Work

**1. PlaylistColumn update skipped (visualizador does not exist)**
- **Reason:** The `app/visualizador/` directory and `PlaylistColumn.tsx` do not exist in the current codebase. Phase 06 (ProPresenter-style visualizer) has not been executed yet.
- **Impact:** None -- the HymnExplorer component is ready for PlaylistColumn to consume when Phase 06 is built. The Dialog-based integration described in the plan can be applied during Phase 06 execution.

## Known Stubs

None -- all functionality is wired and operational.

## Self-Check: PASSED
