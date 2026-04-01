---
phase: quick
plan: 260331-tgm
subsystem: ui/onboarding
tags: [guided-tour, onboarding, ux, spotlight]
dependency_graph:
  requires: []
  provides: [GuidedTour, HelpButton, useTour, TourStep]
  affects: [visualizador, empaquetador]
tech_stack:
  added: []
  patterns: [SVG-mask-spotlight, localStorage-persistence, controlled-tour-component]
key_files:
  created:
    - app/components/GuidedTour.tsx
    - app/visualizador/lib/tour-steps.ts
    - app/empaquetador/lib/tour-steps.ts
  modified:
    - app/visualizador/page.tsx
    - app/empaquetador/page.tsx
    - app/visualizador/components/PlaylistColumn.tsx
    - app/visualizador/components/SlideGridColumn.tsx
    - app/visualizador/components/LivePreviewColumn.tsx
    - app/visualizador/components/ProjectionControls.tsx
    - app/empaquetador/components/SelectionSidebar.tsx
    - app/empaquetador/components/StepSeleccion.tsx
decisions:
  - SVG mask approach for spotlight cutout (clean, rounded corners, no clip-path hacks)
  - Controlled tour via active prop + useTour hook for clean separation of concerns
  - 600ms delay on auto-start to let data-tour elements mount
metrics:
  duration: 4min
  completed: "2026-04-01T03:20:04Z"
---

# Quick Task 260331-tgm: Guided Tour System Summary

Reusable GuidedTour component with SVG spotlight overlay, tooltip positioning, localStorage persistence, and HelpButton for both Visualizador (7 steps) and Empaquetador (5 steps).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create GuidedTour component and tour step definitions | c3e3621 | GuidedTour.tsx, tour-steps.ts x2 |
| 2 | Add data-tour attributes and wire tour into both pages | 1a8d6a4 | 8 files modified |

## What Was Built

### GuidedTour Component (`app/components/GuidedTour.tsx`)
- Full-screen SVG overlay with mask-based spotlight cutout (8px padding, 8px border-radius)
- Tooltip card with step navigation (Omitir, Anterior, Siguiente/Finalizar)
- 4-way tooltip positioning (top, bottom, left, right) with viewport clamping
- CSS opacity/transform transitions between steps
- ResizeObserver + scroll listener for dynamic repositioning (debounced 100ms)
- Auto-scrolls target into view before each step
- Skips missing targets gracefully

### useTour Hook
- localStorage-based persistence (`tour-completed-{key}`)
- Auto-starts on first visit after 600ms delay
- Returns `{ isActive, startTour, handleComplete }` for page integration

### HelpButton
- Fixed bottom-right (bottom-6 right-6, z-50) circular button with "?" 
- Triggers tour restart via onClick

### Tour Steps
- Visualizador: 7 steps (agregar-himno, playlist, slide-grid, preview, proyectar, control-remoto, configuracion)
- Empaquetador: 5 steps (explorar-himnos, mi-seleccion, historial, configuracion-emp, paso-siguiente)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED
