---
phase: "04"
plan: "03"
subsystem: empaquetador-wizard
tags: [wizard, ui, download, audio, configuration]
dependency_graph:
  requires: ["04-01", "04-02"]
  provides: ["complete-wizard-flow"]
  affects: ["app/page.tsx", "app/empaquetador/"]
tech_stack:
  added: []
  patterns: ["blob-download", "indeterminate-progress", "toast-with-retry"]
key_files:
  created:
    - app/empaquetador/components/StepConfiguracion.tsx
    - app/empaquetador/components/AudioTrackRow.tsx
    - app/empaquetador/components/StepDescarga.tsx
  modified:
    - app/empaquetador/page.tsx
    - app/page.tsx
decisions:
  - "Skipped navbar link — existing Navbar.tsx is a demo component with no real navigation links"
  - "AudioTrackRow uses unique composite id (hymnId-field) for checkbox htmlFor to avoid id collisions"
metrics:
  duration: "2min 30s"
  completed: "2026-03-29T21:49:37Z"
  tasks_completed: 3
  files_changed: 5
---

# Phase 04 Plan 03: Wizard Steps 2-3 and Landing Page Link Summary

Complete wizard with Step 2 (print/audio configuration), Step 3 (generate/download), wiring into page, and landing page link -- blob download with Sonner toasts and indeterminate progress.

## What Was Done

### Task 1: StepConfiguracion with print config and audio accordion
- Created `AudioTrackRow` component with checkbox + label (44px min touch target)
- Created `StepConfiguracion` with two sections:
  - Print: layout radio group (1/2 per page), style radio group (decorated/plain)
  - Audio: select-all checkbox, per-hymn accordion with available tracks
- Hymns without audio show "Sin pistas disponibles" muted label
- All labels in Spanish per UI-SPEC Section 9

### Task 2: StepDescarga, wire steps, landing page link
- Created `StepDescarga` with summary card showing hymn count, layout, style, audio track count
- Generate button with "Generando..." state and animate-pulse indeterminate progress bar
- Blob download pattern: fetch POST, create object URL, programmatic click, revoke URL
- Success toast via Sonner, error toast with "Reintentar" retry action
- "Crear otro paquete" button resets wizard to step 1
- Wired StepConfiguracion and StepDescarga into page.tsx replacing placeholders
- Added "Empaquetador de Himnos" link to landing page between Horarios and Facebook

### Task 3: Visual and functional verification (auto-approved)
- Auto-approved checkpoint in auto mode

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 8e50fca | Step 2 configuration UI with print layout/style and audio accordion |
| 2 | 3b83314 | Step 3 download UI, wire all steps, and add landing page link |

## Deviations from Plan

### Skipped Steps

**1. Navbar link skipped (per plan instructions)**
- **Reason:** Plan said "If no navbar component exists or it does not render navigation links, skip this step"
- **Finding:** `app/sections/Navbar.tsx` is a demo component with placeholder accordion items (e.g., "Is it accessible?") and no real navigation links
- **Impact:** None -- landing page link provides the entry point

## Known Stubs

None -- all components are fully wired with real data sources and handlers.

## Self-Check: PASSED
