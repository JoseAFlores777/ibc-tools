---
phase: 04-wizard-ui-and-download-experience
plan: 02
subsystem: empaquetador-ui
tags: [wizard, ui, search, selection, framer-motion, responsive]
dependency_graph:
  requires: [04-01]
  provides: [wizard-page, step-1-selection-ui]
  affects: [04-03]
tech_stack:
  added: []
  patterns: [useReducer-wizard, framer-motion-transitions, drawer-mobile-pattern]
key_files:
  created:
    - app/empaquetador/page.tsx
    - app/empaquetador/components/WizardStepper.tsx
    - app/empaquetador/components/StepSeleccion.tsx
    - app/empaquetador/components/HymnResultRow.tsx
    - app/empaquetador/components/SelectedHymnChip.tsx
  modified: []
decisions:
  - Used __all__ sentinel value for Select "all" option since Radix Select does not allow empty string values
  - Framer Motion slide direction tracked via useRef to avoid re-render on direction change
  - Mobile drawer uses DrawerTitle for accessibility (required by vaul/Radix dialog pattern)
metrics:
  duration: 3min
  completed: "2026-03-29T21:44:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 0
---

# Phase 04 Plan 02: Wizard Shell and Step 1 Selection UI Summary

Wizard page with 3-step stepper, Framer Motion transitions, and full Step 1 hymn selection UI (search, filters, results, sidebar/drawer)

## What Was Built

### Task 1: WizardStepper and EmpaquetadorPage Shell

- **WizardStepper**: 3-step horizontal stepper with completed (Check icon), active (number), and upcoming (muted number) visual states. Completed steps are clickable for backward navigation. Responsive: labels hidden on mobile, circles shrink to 32px.
- **EmpaquetadorPage**: Client component using `useWizardReducer` for state. AnimatePresence wraps step transitions with directional slide animations (forward: left, backward: right). `useReducedMotion` disables animations for accessibility. Bottom navigation bar with Atras/Siguiente buttons. Siguiente disabled when no hymns selected on step 1.

### Task 2: StepSeleccion with Search, Filters, Results, and Selected Panel

- **StepSeleccion**: Fetches hymnal and category lists from /api/hymnals and /api/categories on mount. Two filter dropdowns (hymnal, category) with "Todos" defaults and loading state. Search input with placeholder in Spanish. Results rendered in ScrollArea with loading skeletons, error, empty, and no-query states.
- **HymnResultRow**: Card displaying hymn number, name, hymnal badge. Shows "Agregar" button or "Seleccionado" badge based on selection state. Selected rows have muted background.
- **SelectedHymnChip**: Displays selected hymn with X remove button (aria-label="Quitar"). Used in both desktop sidebar and mobile drawer.
- **Desktop sidebar**: Hidden below lg, 320px wide, shows selected hymns with scroll.
- **Mobile drawer**: Fixed bottom bar trigger showing "Seleccionados (N)" badge, opens Drawer with same chip list. Content padding added to prevent overlap with fixed bar.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 0cfbdbf | feat(04-02): wizard stepper component and empaquetador page shell |
| 2 | 0992c9e | feat(04-02): step 1 selection UI with search, filters, results, and selected hymns |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Radix Select empty string value**
- **Found during:** Task 2
- **Issue:** Radix Select does not support empty string ("") as a SelectItem value. The plan specified `value=""` for "Todos los himnarios" default option.
- **Fix:** Used `__all__` as sentinel value and mapped it back to empty string in onValueChange handler: `setHymnal(v === '__all__' ? '' : v)`
- **Files modified:** app/empaquetador/components/StepSeleccion.tsx
- **Commit:** 0992c9e

## Verification Results

- `npx vitest run tests/empaquetador/` -- 18 tests passed (2 test files)
- All acceptance criteria verified via grep checks (12/12 passed)

## Known Stubs

None -- all components are fully wired to hooks and state.

## Self-Check: PASSED
