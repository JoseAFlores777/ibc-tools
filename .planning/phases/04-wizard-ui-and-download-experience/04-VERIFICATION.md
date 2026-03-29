---
phase: 04-wizard-ui-and-download-experience
verified: 2026-03-29T22:00:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: "Walk the full 3-step wizard end to end"
    expected: "Search returns live results, hymns can be selected and removed, Step 2 shows audio accordion per hymn, Step 3 generates and downloads a real ZIP with success toast"
    why_human: "Task 3 in Plan 03 was a blocking human checkpoint that was auto-approved in non-interactive mode. No human has confirmed the live flow works against the actual Directus instance."
  - test: "Mobile drawer trigger appears after selecting a hymn"
    expected: "Fixed bottom bar with 'Seleccionados (N)' badge appears on narrow viewport, opens drawer with SelectedHymnChip list"
    why_human: "Mobile-specific layout requires browser resize to verify; not testable with grep or unit tests."
  - test: "Framer Motion step transitions animate correctly"
    expected: "Forward step slides content right-to-left; backward step slides left-to-right; prefers-reduced-motion skips animation"
    why_human: "Animation behavior requires visual browser inspection."
  - test: "Generar Paquete error path shows Reintentar toast action"
    expected: "When /api/hymns/package returns an error, Sonner toast appears with a 'Reintentar' action button that retriggers generation"
    why_human: "Requires triggering a server error, not testable without running the app."
---

# Phase 4: Wizard UI and Download Experience — Verification Report

**Phase Goal:** Any church member can search, select, configure, and download a hymn package through a guided step-by-step interface in Spanish
**Verified:** 2026-03-29T22:00:00Z
**Status:** human_needed (all automated checks pass; 4 items flagged for human verification)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can search hymns by number or name and filter by hymnal or category, seeing results update as they type or select filters | VERIFIED | `useHymnSearch.ts` has 300ms debounce with AbortController; `/api/hymns/search` handles numeric q as hymnNumber; `StepSeleccion.tsx` fetches `/api/hymnals` and `/api/categories` on mount and wires them to Select dropdowns |
| 2 | User can select multiple hymns, see a summary of selected hymns, and remove hymns from the selection | VERIFIED | `wizardReducer` handles ADD_HYMN (dedup by id) and REMOVE_HYMN; `SelectedHymnChip` renders with aria-label="Quitar" X button; `StepDescarga` summary card shows `state.selectedHymns.length himno(s)` |
| 3 | User can see which audio tracks are available per hymn and select which tracks to include (only showing tracks that exist) | VERIFIED | `StepConfiguracion` renders `AccordionItem` per hymn; inner loop checks `hymn.audioFiles[field] !== null` before rendering `AudioTrackRow`; `Sin pistas disponibles` shown for `!hymn.hasAnyAudio` hymns |
| 4 | User navigates a 3-step wizard with forward/back navigation | VERIFIED | `EmpaquetadorPage` renders `WizardStepper` with 3 steps; `Siguiente` disabled when `selectedHymns.length === 0` on step 1; `Atras` hidden on step 1; completed steps are clickable via `onStepClick` |
| 5 | User sees a progress indicator during ZIP generation and downloads the resulting file, with all UI text in Spanish | VERIFIED | `StepDescarga` renders `<Progress value={100} className="animate-pulse" />` when `state.isGenerating`; blob download via `URL.createObjectURL`/programmatic `<a>` click/`URL.revokeObjectURL`; all visible text is Spanish |

**Score:** 5/5 truths verified

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Provides | Level 1 (Exists) | Level 2 (Substantive) | Level 3 (Wired) | Status |
|----------|----------|-----------------|----------------------|----------------|--------|
| `app/layout.tsx` | Sonner Toaster in root layout | Yes | `<Toaster />` at line 73; import at line 6 | All pages inherit body | VERIFIED |
| `app/api/hymnals/route.ts` | GET /api/hymnals | Yes | `readItems('hymnals', { fields, sort })` with try/catch and 5-min cache | Fetched by `StepSeleccion.tsx` line 42 | VERIFIED |
| `app/api/categories/route.ts` | GET /api/categories | Yes | `readItems('hymn_categories', { fields, sort })` with try/catch and 5-min cache | Fetched by `StepSeleccion.tsx` line 43 | VERIFIED |
| `app/empaquetador/hooks/useWizardReducer.ts` | WizardState, WizardAction, wizardReducer, useWizardReducer, initialWizardState | Yes | 141 lines; 10 action types; Map/Set immutable updates; full switch/case | Imported by `page.tsx`, `StepConfiguracion`, `StepDescarga`, `StepSeleccion` | VERIFIED |
| `app/empaquetador/lib/build-package-request.ts` | buildPackageRequest(state) -> PackageRequest | Yes | Converts Map/Set to plain arrays; returns `{ hymns, layout, style }` | Imported by `StepDescarga.tsx` line 6; called at line 28 | VERIFIED |
| `app/empaquetador/hooks/useHymnSearch.ts` | Debounced search hook with AbortController | Yes | 98 lines; 300ms debounce via setTimeout; AbortController in useRef; clears on empty | Imported by `StepSeleccion.tsx` line 5 | VERIFIED |

### Plan 02 Artifacts

| Artifact | Provides | Level 1 (Exists) | Level 2 (Substantive) | Level 3 (Wired) | Status |
|----------|----------|-----------------|----------------------|----------------|--------|
| `app/empaquetador/page.tsx` | Wizard page shell with useReducer state and step rendering | Yes | 104 lines; `'use client'`; AnimatePresence; useReducedMotion; Siguiente disabled logic | Entry point at `/empaquetador` | VERIFIED |
| `app/empaquetador/components/WizardStepper.tsx` | 3-step stepper with completed/active/upcoming states | Yes | `aria-label="Pasos del empaquetador"`; Check icon for completed; `aria-current="step"` on active | Used in `page.tsx` line 68 | VERIFIED |
| `app/empaquetador/components/StepSeleccion.tsx` | Step 1: search, filters, results, selected panel | Yes | 206 lines; `'use client'`; useHymnSearch; fetch hymnals/categories; HymnResultRow; SelectedHymnChip; Drawer | Rendered by `page.tsx` case 1 | VERIFIED |
| `app/empaquetador/components/HymnResultRow.tsx` | Search result row with Agregar/Seleccionado states | Yes | Card with hymn_number, name, hymnal badge; `Agregar` button or `Seleccionado` badge; `bg-muted/50` when selected | Used in `StepSeleccion.tsx` line 165 | VERIFIED |
| `app/empaquetador/components/SelectedHymnChip.tsx` | Selected hymn display with X remove button | Yes | `aria-label="Quitar"` on Button; X icon from lucide-react; min-h-[44px] | Used in `StepSeleccion.tsx` lines 75, 198 | VERIFIED |

### Plan 03 Artifacts

| Artifact | Provides | Level 1 (Exists) | Level 2 (Substantive) | Level 3 (Wired) | Status |
|----------|----------|-----------------|----------------------|----------------|--------|
| `app/empaquetador/components/StepConfiguracion.tsx` | Step 2: print layout/style radio groups + audio accordion | Yes | 167 lines; RadioGroup for layout and style; Accordion per hymn; `Sin pistas disponibles`; allSelected compute | Rendered by `page.tsx` case 2 | VERIFIED |
| `app/empaquetador/components/AudioTrackRow.tsx` | Single audio track checkbox | Yes | Checkbox with onCheckedChange; Label with htmlFor; min-h-[44px] | Used in `StepConfiguracion.tsx` line 147 | VERIFIED |
| `app/empaquetador/components/StepDescarga.tsx` | Step 3: summary, generate, download | Yes | 118 lines; `'use client'`; buildPackageRequest; fetch POST `/api/hymns/package`; blob download; toast.success/error with Reintentar | Rendered by `page.tsx` case 3 | VERIFIED |
| `app/page.tsx` | Landing page with Empaquetador link | Yes | Link to `/empaquetador` with text "Empaquetador de Himnos" at line 39 | Entry point for users | VERIFIED |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/empaquetador/hooks/useWizardReducer.ts` | `app/interfaces/Hymn.interface.ts` | `import type { HymnSearchResult }` | WIRED | Line 4: `import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface'` |
| `app/empaquetador/lib/build-package-request.ts` | `app/lib/zip/zip.schema.ts` | `import type { PackageRequest }` | WIRED | Line 1: `import type { PackageRequest } from '@/app/lib/zip/zip.schema'` |
| `app/empaquetador/hooks/useHymnSearch.ts` | `/api/hymns/search` | fetch call | WIRED | Line 59: `fetch('/api/hymns/search?${params.toString()}', ...)` |
| `app/empaquetador/page.tsx` | `useWizardReducer.ts` | `useWizardReducer()` hook call | WIRED | Line 5 import; line 13 `const [state, dispatch] = useWizardReducer()` |
| `app/empaquetador/components/StepSeleccion.tsx` | `useHymnSearch.ts` | `useHymnSearch()` hook call | WIRED | Line 5 import; line 29 call |
| `app/empaquetador/components/StepSeleccion.tsx` | `/api/hymnals` and `/api/categories` | fetch on mount | WIRED | Lines 42-43 inside `useEffect(() => {}, [])` |
| `app/empaquetador/components/StepDescarga.tsx` | `/api/hymns/package` | `fetch POST` with PackageRequest body | WIRED | Line 29: `fetch('/api/hymns/package', { method: 'POST', ... })` |
| `app/empaquetador/components/StepDescarga.tsx` | `build-package-request.ts` | `import buildPackageRequest` | WIRED | Line 6 import; line 28 `const body = buildPackageRequest(state)` |
| `app/empaquetador/page.tsx` | `StepConfiguracion` and `StepDescarga` | conditional rendering in step switch | WIRED | Lines 8-9 imports; lines 57-59 switch case 2 and 3 |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `StepSeleccion.tsx` | `results` | `useHymnSearch` -> `fetch /api/hymns/search` -> `searchHymns()` Directus query | Yes — `searchHymns` in `hymns.ts` queries Directus with `readItems` | FLOWING |
| `StepSeleccion.tsx` | `hymnals`, `categories` | `fetch /api/hymnals`, `fetch /api/categories` -> Directus `readItems` | Yes — both routes use `client.request(readItems(...))` | FLOWING |
| `StepConfiguracion.tsx` | `state.selectedHymns` | Passed from `page.tsx` reducer state via ADD_HYMN dispatch | Yes — hymns come from search results then user-dispatched ADD_HYMN | FLOWING |
| `StepDescarga.tsx` | ZIP blob | `fetch POST /api/hymns/package` (Phase 3 API) | Phase 3 responsibility — route exists per prior phase | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| wizardReducer handles all 10 action types | `npx vitest run tests/empaquetador/wizardReducer.test.ts` | 14 tests passed | PASS |
| buildPackageRequest converts Map/Set to PackageRequest | `npx vitest run tests/empaquetador/buildPackageRequest.test.ts` | 4 tests passed including Zod schema validation | PASS |
| All empaquetador unit tests pass | `npx vitest run tests/empaquetador/` | 72 tests passed (8 test files including worktrees) | PASS |
| `/empaquetador` route artifact exists and has `'use client'` | grep | `page.tsx` line 1: `'use client'` | PASS |
| Landing page links to `/empaquetador` | grep | `app/page.tsx` line 39: `href={'/empaquetador'}` | PASS |
| Full production build | `npm run build` | FAIL — pre-existing TypeScript error in `HymnPageTwoUp.tsx` (Phase 2, commit `a462bfe`) — not introduced by Phase 4 | INFO |

**Note on build failure:** The TypeScript error (`No overload matches this call` for `style={styles.verseBlock}`) is in `app/components/pdf-components/pdf-pages/HymnPageTwoUp.tsx`, introduced in Phase 2 commit `a462bfe`. Phase 4 made no changes to that file. This is a pre-existing issue that is out of scope for Phase 4 verification.

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BUSQ-01 | 04-01, 04-02 | Usuario puede buscar himnos por numero de himno | SATISFIED | Search route detects numeric `q` and routes to `hymnNumber` filter exclusively |
| BUSQ-02 | 04-01, 04-02 | Usuario puede buscar himnos por nombre | SATISFIED | Non-numeric `q` routes to `query` (name) filter in `searchHymns` |
| BUSQ-03 | 04-01, 04-02 | Usuario puede filtrar himnos por himnario de origen | SATISFIED | `/api/hymnals` returns hymnal list; `StepSeleccion` Select dropdown wired to `setHymnal` |
| BUSQ-04 | 04-01, 04-02 | Usuario puede filtrar himnos por categoria | SATISFIED | `/api/categories` returns category list; `StepSeleccion` Select dropdown wired to `setCategory` |
| BUSQ-05 | 04-01, 04-02 | Usuario puede seleccionar multiples himnos | SATISFIED | `ADD_HYMN` with dedup; `selectedHymns` array in WizardState; no limit on step 1 selection |
| BUSQ-06 | 04-01, 04-02, 04-03 | Usuario puede ver un resumen de los himnos seleccionados | SATISFIED | Desktop sidebar in `StepSeleccion`; Step 3 summary card in `StepDescarga` shows count, layout, style, audio tracks |
| BUSQ-07 | 04-01, 04-02 | Usuario puede quitar himnos de su seleccion | SATISFIED | `REMOVE_HYMN` action; `SelectedHymnChip` X button dispatches `{ type: 'REMOVE_HYMN', hymnId }` |
| AUDIO-01 | 04-03 | Usuario ve las pistas disponibles por himno | SATISFIED | `StepConfiguracion` Accordion shows only non-null audio fields per hymn |
| AUDIO-02 | 04-01, 04-03 | Usuario puede seleccionar cuales pistas incluir | SATISFIED | `TOGGLE_AUDIO` / `SELECT_ALL_AUDIO` actions; `AudioTrackRow` checkboxes; `SELECT_ALL_AUDIO` only selects non-null fields |
| AUDIO-03 | 04-03 | Solo se muestran las pistas que existen para cada himno | SATISFIED | `StepConfiguracion` line 145: `if (hymn.audioFiles[field] === null) return null` |
| UX-01 | 04-01, 04-02, 04-03 | Wizard de 3 pasos | SATISFIED | `WizardStepper` 3 steps; `page.tsx` switch case renders StepSeleccion, StepConfiguracion, StepDescarga |
| UX-02 | 04-01, 04-02 | Navegacion entre pasos (adelante/atras) | SATISFIED | `Siguiente`/`Atras` buttons in `page.tsx`; completed steps clickable via `onStepClick` |
| UX-03 | 04-01, 04-02, 04-03 | UI en espanol | SATISFIED | All user-visible text: "Seleccionar Himnos", "Configurar", "Descargar", "Buscar por numero o nombre...", "Agregar", "Quitar", "Generar Paquete", "Crear otro paquete", etc. |

**Coverage: 13/13 requirement IDs satisfied**

**Orphaned requirements check:** REQUIREMENTS.md maps BUSQ-01–07, AUDIO-01–03, UX-01–03 to Phase 4. All 13 are claimed by the plans. No orphaned requirements.

**Note:** IMPR-01–04 are mapped to Phase 2 (not Phase 4) in REQUIREMENTS.md. The Phase 4 plans cover print layout/style as part of UX-01 (the wizard configuration step) but do not claim IMPR requirements. This is correct per traceability matrix.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/empaquetador/components/StepSeleccion.tsx` | 102, 120, 135 | Text containing "placeholder" | Info | These are Radix Select `placeholder` props and an Input `placeholder` attribute — legitimate UI affordances, not stub code |
| `app/empaquetador/components/StepConfiguracion.tsx` | 145 | `return null` | Info | Inside a `map()` to conditionally skip null audio fields — not a stub pattern |
| `app/components/pdf-components/pdf-pages/HymnPageTwoUp.tsx` | 267 | Pre-existing TypeScript type error | Warning | Pre-existing from Phase 2; breaks `npm run build`. Not introduced by Phase 4. |

**No blocker anti-patterns found in Phase 4 code.** All "placeholder" occurrences are legitimate UI pattern attributes. The `return null` is a conditional map exclusion.

---

## Human Verification Required

### 1. End-to-End Wizard Flow

**Test:** Run `npm run dev`, open http://localhost:3000, click "Empaquetador de Himnos", walk through all 3 steps: search for a hymn by number, add it, proceed to Step 2, configure audio tracks, proceed to Step 3, click "Generar Paquete".
**Expected:** Results appear after ~300ms of typing; Agregar adds to sidebar; Step 2 shows audio accordion with real available tracks; Step 3 shows correct summary and ZIP downloads with success toast.
**Why human:** Task 3 of Plan 03 was a `checkpoint:human-verify` gate that was auto-approved in autonomous mode. No human confirmed the live flow against the actual Directus instance.

### 2. Mobile Drawer Behavior

**Test:** Resize browser to <1024px width, add a hymn, observe bottom bar.
**Expected:** Fixed bottom bar with "Seleccionados (1)" badge appears; clicking it opens a Drawer with the SelectedHymnChip list; drawer does not overlap navigation buttons.
**Why human:** Responsive layout and Drawer component behavior require visual browser inspection.

### 3. Step Transition Animations

**Test:** Navigate forward and backward between wizard steps on a standard display (no prefers-reduced-motion).
**Expected:** Forward navigation slides content in from right; backward navigation slides from left; transitions take ~200ms.
**Why human:** Animation behavior is visual and not testable with grep or unit tests.

### 4. Error Toast Retry Action

**Test:** Force a server error on `/api/hymns/package` (e.g., disconnect from Directus or temporarily modify the route to return 500), click "Generar Paquete".
**Expected:** Sonner toast appears with error message and "Reintentar" action button; clicking Reintentar re-invokes `handleGenerate`.
**Why human:** Requires triggering a server error in the running app; not testable with grep or vitest.

---

## Gaps Summary

No gaps found in automated verification. All 5 observable truths are verified. All 13 artifacts pass existence, substance, and wiring checks. All 13 requirement IDs are satisfied. No blocker anti-patterns exist in Phase 4 code.

The `human_needed` status is due to:
1. The Phase 4 Plan 03 human checkpoint (Task 3) was auto-approved without actual human review.
2. Mobile layout, animations, and error paths require browser-based verification that cannot be confirmed with static analysis.

The pre-existing TypeScript build error in `HymnPageTwoUp.tsx` (Phase 2) should be resolved separately but is not a Phase 4 responsibility.

---

_Verified: 2026-03-29T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
