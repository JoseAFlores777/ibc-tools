---
phase: quick
plan: 260329-ve4
subsystem: navigation-and-ux
tags: [navbar, herramientas, empaquetador, ux-fixes]
dependency_graph:
  requires: []
  provides: [navbar-navigation, herramientas-page, empaquetador-ux-polish]
  affects: [app/sections/Navbar.tsx, app/herramientas/page.tsx, app/page.tsx, app/empaquetador/page.tsx, app/empaquetador/components/StepSeleccion.tsx, app/empaquetador/components/HymnResultRow.tsx, app/empaquetador/components/StepDescarga.tsx]
tech_stack:
  added: []
  patterns: [lucide-react-icons-for-navigation, framer-motion-mobile-menu, css-keyframe-indeterminate-progress]
key_files:
  created: [app/herramientas/page.tsx]
  modified: [app/sections/Navbar.tsx, app/page.tsx, app/empaquetador/page.tsx, app/empaquetador/components/StepSeleccion.tsx, app/empaquetador/components/HymnResultRow.tsx, app/empaquetador/components/StepDescarga.tsx]
decisions:
  - Used lucide-react Menu/X icons instead of @radix-ui/react-icons (not installed)
  - CSS @keyframes indeterminate animation instead of shimmer/pulse on full bar
metrics:
  duration: 4min
  completed: 2026-03-29
---

# Quick Task 260329-ve4: UX/UI Audit - Rewrite Navbar, Create Herramientas, Fix Empaquetador

Rewrote placeholder navbar with real 3-link navigation and hamburger mobile menu, created /herramientas launcher page with Empaquetador tool card, restructured home page into tools vs social sections, and fixed 5 empaquetador UX issues (accent, search order, clickable badge, honest progress, hymn list).

## Task Results

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Rewrite Navbar, create /herramientas, update home page | 8976569 | Navbar.tsx, herramientas/page.tsx, page.tsx |
| 2 | Fix empaquetador UX issues | bb2ffdf | empaquetador/page.tsx, StepSeleccion.tsx, HymnResultRow.tsx, StepDescarga.tsx |

## Changes Made

### Task 1: Navigation overhaul
- **Navbar.tsx**: Complete rewrite removing all placeholder content (Accordion, Nav, ScrollArea, unused lucide icons). New structure: fixed top bar with IBC logo (50px), 3 desktop nav links with active state highlighting, hamburger button on mobile with AnimatePresence slide-down menu. Links close menu on click.
- **herramientas/page.tsx**: New server component with responsive card grid. One card for Empaquetador de Himnos with Package icon, linking to /empaquetador.
- **page.tsx**: Grouped buttons into "Herramientas" section (Herramientas, Horarios) and "Redes Sociales" section (Facebook, Youtube, Radio, App). Removed direct Empaquetador button and "Haz click en uno de estos enlaces" text.

### Task 2: Empaquetador UX fixes
- **empaquetador/page.tsx**: Added back-link to /herramientas at top, fixed "Atras" accent, added ChevronLeft/ChevronRight icons to navigation buttons.
- **StepSeleccion.tsx**: Moved search Input above filter dropdowns, replaced raw `<button>` drawer trigger with shadcn `<Button>`.
- **HymnResultRow.tsx**: Added `onRemove` prop, made "Seleccionado" badge clickable with X icon for deselection.
- **StepDescarga.tsx**: Replaced fake `<Progress value={100} className="animate-pulse">` with honest CSS indeterminate animation bar. Added hymn name list in summary card.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used lucide-react icons instead of @radix-ui/react-icons**
- **Found during:** Task 1
- **Issue:** @radix-ui/react-icons package not installed in node_modules despite being referenced in the plan
- **Fix:** Used Menu and X icons from lucide-react (already installed) instead of HamburgerMenuIcon/Cross1Icon
- **Files modified:** app/sections/Navbar.tsx

## Verification

- `npm run build` passes cleanly with all routes compiling
- /herramientas route appears in build output as static page
- No broken imports after removing unused Navbar dependencies

## Known Stubs

None - all changes are fully wired with real data and navigation.

## Self-Check: PASSED

- All 7 files verified present on disk
- Both task commits verified in git log (8976569, bb2ffdf)
