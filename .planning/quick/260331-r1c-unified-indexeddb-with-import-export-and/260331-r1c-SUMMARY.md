---
phase: quick
plan: 260331-r1c
subsystem: data-persistence
tags: [indexeddb, export-import, ux, unified-db]
dependency_graph:
  requires: []
  provides: [unified-ibc-db, export-import-ibctools, local-storage-warning]
  affects: [visualizador, empaquetador]
tech_stack:
  added: []
  patterns: [unified-indexeddb, auto-migration, file-export-import]
key_files:
  created:
    - app/lib/ibc-db.ts
    - app/components/LocalStorageWarning.tsx
  modified:
    - app/visualizador/hooks/useThemePersistence.ts
    - app/empaquetador/lib/package-db.ts
    - app/visualizador/page.tsx
    - app/empaquetador/page.tsx
decisions:
  - "Module-level _migrationDone flag prevents repeated migration checks after first openIbcDB call"
  - "LocalStorageWarning starts hidden (dismissed=true) to avoid flash, then shows after localStorage check"
  - "Export excludes _migrated flag key from visualizador store data"
metrics:
  duration: 3min 13s
  completed: 2026-03-31
  tasks: 3
  files: 6
---

# Quick Task 260331-r1c: Unified IndexedDB with Import/Export Summary

Unified two separate IndexedDB databases (ibc-visualizador, ibc-empaquetador) into single "ibc-tools" DB with auto-migration, .ibctools file export/import, and dismissible amber warning banner in both tools.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Create unified ibc-db.ts service | e8a6169 | New service with openIbcDB, getKey, setKey, migration, export/import |
| 2 | Migrate visualizador and empaquetador | 8f2a99d | Removed local openDB from both, import from ibc-db |
| 3 | LocalStorageWarning banner | 0eade36 | Amber banner with export/import buttons in both tools |

## What Was Built

**app/lib/ibc-db.ts** — Unified IndexedDB service:
- Single "ibc-tools" database v1 with two object stores (visualizador, empaquetador)
- Auto-migration reads all data from old DBs, writes to new, deletes old DBs
- Migration uses _migrated flag to run only once
- `exportToolData()` / `importToolData()` for full data roundtrip
- `downloadExport()` triggers browser download of .ibctools JSON file
- `readImportFile()` validates file structure before import

**app/components/LocalStorageWarning.tsx** — Dismissible banner:
- Amber/yellow bar with AlertTriangle icon
- Spanish text explaining browser-local storage limitation
- Export button downloads .ibctools backup
- Import button with hidden file input, validates and restores data
- Dismiss persisted via localStorage

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Verification

- `npm run build` passes
- `npx tsc --noEmit` passes (pre-existing test errors unrelated to changes)
- All consumer imports unchanged (zero-impact refactor for package-db and useThemePersistence)

## Self-Check: PASSED
