# Phase 4: Wizard UI and Download Experience - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

A complete 3-step wizard UI at `/empaquetador` where any church member can: (1) search and select hymns with filters, (2) configure print layout/style and select audio tracks per hymn, (3) generate and download a ZIP package. All UI text in Spanish. Consumes Phase 3's GET `/api/hymns/search` and POST `/api/hymns/package` endpoints. This is the final user-facing phase — everything the user sees and interacts with.

</domain>

<decisions>
## Implementation Decisions

### Route and Page Structure
- **D-01:** New route at `app/empaquetador/page.tsx` as a client component (`'use client'`). Single page with wizard state managed via useState — no URL-based step routing.
- **D-02:** The wizard component tree: `EmpaquetadorPage` (top-level) → `WizardStepper` (navigation) → step components (`StepSeleccion`, `StepConfiguracion`, `StepDescarga`).
- **D-03:** Add a link to the Empaquetador from the main landing page (`app/page.tsx`) and the navbar if one exists.

### Step 1: Búsqueda y Selección (BUSQ-01 through BUSQ-07)
- **D-04:** Search-as-you-type with debounced input (300ms). Uses shadcn Input component. Searches by hymn number and name simultaneously via the existing `q` param on GET `/api/hymns/search`.
- **D-05:** Filters for hymnal and category displayed as shadcn Select dropdowns above the search input. Filters are additive (AND logic). Hymnals and categories fetched once on mount from Directus.
- **D-06:** Search results displayed as a scrollable list (not grid) with each row showing: hymn number, hymn name, hymnal badge, and an "Agregar" button. Compact rows to show many results. Uses shadcn ScrollArea + Card.
- **D-07:** Selected hymns shown in a sidebar panel (desktop) or bottom sheet (mobile) with count badge. Each selected hymn shows number + name + "Quitar" (X) button. Reorder via drag is out of scope (v2).
- **D-08:** Multi-select via "Agregar" button per result row (not checkboxes). Already-selected hymns show "Seleccionado" state (muted, no button).

### Step 2: Configuración de Impresión y Audio (IMPR + AUDIO requirements)
- **D-09:** Print configuration section: two radio groups — Layout (1 himno por página / 2 himnos por página) and Estilo (Decorado / Plano). Uses shadcn RadioGroup. Default: 1 per page, decorated.
- **D-10:** Audio configuration displayed as an expandable section per hymn using shadcn Accordion. Each hymn row shows available audio tracks as checkboxes (only tracks that exist for that hymn). Track labels in Spanish: "Pista completa", "MIDI", "Soprano", "Alto", "Tenor", "Bajo".
- **D-11:** A "Seleccionar todo" checkbox at the top of the audio section that toggles all available tracks across all hymns. Individual hymn accordion items can override.
- **D-12:** Hymns with no audio tracks show a muted label "Sin pistas disponibles" instead of an accordion.

### Step 3: Generación y Descarga (GEN-03, GEN-04, UX-01, UX-02, UX-03)
- **D-13:** "Generar Paquete" button triggers POST to `/api/hymns/package`. While generating: button disabled, shadcn Progress bar shows indeterminate animation (no percentage — streaming doesn't provide granular progress).
- **D-14:** On successful response: auto-trigger browser download via `URL.createObjectURL()` + programmatic `<a>` click. Show success toast via Sonner: "¡Paquete descargado exitosamente!"
- **D-15:** On error (non-200 or network failure): show error toast with retry button. "Error al generar el paquete. Intenta de nuevo."
- **D-16:** After successful download, show a "Crear otro paquete" button that resets the wizard to Step 1.

### Wizard Navigation (UX-01, UX-02)
- **D-17:** Stepper pattern with 3 numbered circles + labels at the top: "1. Seleccionar Himnos" → "2. Configurar" → "3. Descargar". Active step highlighted, completed steps show checkmark.
- **D-18:** "Siguiente" / "Atrás" buttons at bottom of each step. "Siguiente" disabled until step requirements met (Step 1: at least 1 hymn selected, Step 2: always valid — defaults are set).
- **D-19:** Users can click completed step circles to jump back (but not forward past the current step). Jumping back preserves all selections.

### State Management
- **D-20:** All wizard state in a single `useReducer` hook: `{ step, selectedHymns, layout, style, audioSelections, isGenerating, error }`. No external state library — component-local state is sufficient.
- **D-21:** `selectedHymns` is an array of `HymnSearchResult` objects (includes audio availability). `audioSelections` is a `Map<hymnId, Set<audioFieldName>>`.

### Claude's Discretion
- Responsive breakpoints and mobile layout adjustments
- Loading skeletons while search results load
- Empty state illustrations/messages for no search results
- Animation transitions between wizard steps (Framer Motion available)
- Exact spacing, padding, and visual hierarchy within each step
- Whether to prefetch hymnal/category lists or load on demand
- Keyboard shortcuts or accessibility enhancements beyond standard shadcn

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Dependencies (consume these APIs)
- `app/api/hymns/search/route.ts` — GET endpoint: `?q=&hymnal=&category=&limit=&offset=` returns `{ ok, data: HymnSearchResult[] }`
- `app/api/hymns/package/route.ts` — POST endpoint: accepts `PackageRequest` body, returns streaming ZIP
- `app/lib/zip/zip.schema.ts` — `PackageRequest` type definition (Zod schema) for the POST body

### Type Definitions
- `app/interfaces/Hymn.interface.ts` — `HymnSearchResult`, `HymnForPdf`, `HymnAudioFiles`, `AudioFileInfo` types

### UI Component Library
- `app/lib/shadcn/ui/` — Full shadcn/ui library (49 components). Key for this phase: Input, Select, Button, Card, Badge, ScrollArea, RadioGroup, Accordion, Checkbox, Progress, Tabs, Separator
- `app/lib/shadcn/utils.ts` — `cn()` utility for class merging

### Existing Pages (pattern reference)
- `app/horarios/page.tsx` — SSR page pattern with client component
- `app/page.tsx` — Landing page (add Empaquetador link here)

### Directus Schema
- `contexts/directus.json` — Full schema for hymnal and category collection fields (needed for filter dropdowns)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 49 shadcn/ui components already installed — no new component installs needed
- `cn()` utility for conditional class merging
- Sonner toast system already configured in layout
- Framer Motion available for step transitions
- `file-saver` package available (though we'll use native download approach)

### Established Patterns
- Client components use `'use client'` directive
- Data fetching via `fetch()` to API routes from client components
- shadcn components imported from `@/lib/shadcn/ui`
- Tailwind for all styling, no CSS modules
- Spanish language for all UI text

### Integration Points
- New route: `app/empaquetador/page.tsx`
- Link from landing page: `app/page.tsx`
- Consumes: GET `/api/hymns/search`, POST `/api/hymns/package`
- Needs: Directus hymnal/category lists (new service functions or direct API call)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — all decisions made at Claude's discretion based on established patterns, available components, and standard wizard UX practices.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-wizard-ui-and-download-experience*
*Context gathered: 2026-03-29*
