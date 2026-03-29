# Phase 4: Wizard UI and Download Experience - Research

**Researched:** 2026-03-29
**Domain:** React client-side wizard UI, search-as-you-type, file download, shadcn/ui composition
**Confidence:** HIGH

## Summary

Phase 4 is a client-side-only phase that builds a 3-step wizard at `/empaquetador` consuming Phase 3's API endpoints. All required shadcn/ui components (49 total) and supporting libraries (Framer Motion, Sonner, Vaul) are already installed. No new npm packages are needed.

The core technical challenges are: (1) debounced search-as-you-type with filter state management, (2) a `useReducer`-driven wizard with 3 steps and forward/back navigation, (3) assembling a `PackageRequest` body from UI state and triggering a blob download from a streaming ZIP response, and (4) responsive layout with a mobile bottom sheet (Vaul Drawer) for selected hymns.

**Primary recommendation:** Build the wizard as a single client component tree with `useReducer` for state, fetch the search API with `AbortController` for debounced requests, and use `URL.createObjectURL` for triggering the ZIP download. Add the Sonner `<Toaster>` to the root layout first since it is not currently mounted.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** New route at `app/empaquetador/page.tsx` as a client component (`'use client'`). Single page with wizard state managed via useState -- no URL-based step routing.
- **D-02:** Component tree: `EmpaquetadorPage` -> `WizardStepper` -> step components (`StepSeleccion`, `StepConfiguracion`, `StepDescarga`).
- **D-03:** Add a link to the Empaquetador from the main landing page (`app/page.tsx`) and the navbar if one exists.
- **D-04:** Search-as-you-type with debounced input (300ms). Uses shadcn Input component. Searches by hymn number and name simultaneously via the existing `q` param on GET `/api/hymns/search`.
- **D-05:** Filters for hymnal and category displayed as shadcn Select dropdowns above the search input. Filters are additive (AND logic). Hymnals and categories fetched once on mount from Directus.
- **D-06:** Search results displayed as a scrollable list with each row showing: hymn number, hymn name, hymnal badge, and an "Agregar" button. Uses shadcn ScrollArea + Card.
- **D-07:** Selected hymns shown in a sidebar panel (desktop) or bottom sheet (mobile) with count badge.
- **D-08:** Multi-select via "Agregar" button per result row. Already-selected hymns show "Seleccionado" state.
- **D-09:** Print configuration: two radio groups -- Layout and Estilo. Uses shadcn RadioGroup. Default: 1 per page, decorated.
- **D-10:** Audio configuration as expandable Accordion per hymn with checkboxes for available tracks.
- **D-11:** "Seleccionar todo" checkbox for all audio tracks across all hymns.
- **D-12:** Hymns with no audio show "Sin pistas disponibles" label.
- **D-13:** "Generar Paquete" triggers POST to `/api/hymns/package`. Indeterminate Progress bar during generation.
- **D-14:** Auto-trigger download via `URL.createObjectURL()` + programmatic `<a>` click. Sonner success toast.
- **D-15:** Error handling with toast and retry button.
- **D-16:** "Crear otro paquete" button resets wizard to Step 1.
- **D-17:** Stepper with 3 numbered circles + labels. Active step highlighted, completed steps show checkmark.
- **D-18:** "Siguiente" / "Atras" buttons. "Siguiente" disabled until step requirements met.
- **D-19:** Completed step circles clickable to jump back. Jumping back preserves selections.
- **D-20:** All wizard state in a single `useReducer` hook.
- **D-21:** `selectedHymns` is `HymnSearchResult[]`. `audioSelections` is `Map<hymnId, Set<audioFieldName>>`.

### Claude's Discretion
- Responsive breakpoints and mobile layout adjustments
- Loading skeletons while search results load
- Empty state illustrations/messages for no search results
- Animation transitions between wizard steps (Framer Motion available)
- Exact spacing, padding, and visual hierarchy within each step
- Whether to prefetch hymnal/category lists or load on demand
- Keyboard shortcuts or accessibility enhancements beyond standard shadcn

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUSQ-01 | Usuario puede buscar himnos por numero de himno | Search input sends `q` param to GET `/api/hymns/search`; API handles number vs name matching |
| BUSQ-02 | Usuario puede buscar himnos por nombre | Same `q` param, API filters with `_icontains` on name field |
| BUSQ-03 | Usuario puede filtrar himnos por himnario de origen | shadcn Select dropdown sends `hymnal` UUID param; hymnals fetched from Directus on mount |
| BUSQ-04 | Usuario puede filtrar himnos por categoria | shadcn Select dropdown sends `category` ID param; categories fetched from Directus on mount |
| BUSQ-05 | Usuario puede seleccionar multiples himnos | "Agregar" button per result row; `useReducer` `ADD_HYMN` action adds to `selectedHymns` array |
| BUSQ-06 | Usuario puede ver resumen de himnos seleccionados | Sidebar panel (desktop) / Drawer bottom sheet (mobile) showing selected hymns list |
| BUSQ-07 | Usuario puede quitar himnos de su seleccion | "X" ghost button per selected hymn; `REMOVE_HYMN` reducer action |
| AUDIO-01 | Usuario ve pistas disponibles por himno | Accordion per hymn in Step 2; `HymnSearchResult.audioFiles` has per-field availability |
| AUDIO-02 | Usuario puede seleccionar pistas por himno | Checkboxes per audio track within accordion; state in `audioSelections` Map |
| AUDIO-03 | Solo se muestran pistas que existen | Check `audioFiles[field] !== null` before rendering checkbox; `hasAnyAudio` flag for empty state |
| UX-01 | Wizard de 3 pasos | `WizardStepper` component with numbered circles; `step` state in reducer (1, 2, 3) |
| UX-02 | Navegacion entre pasos | "Siguiente"/"Atras" buttons; step circles clickable for backward navigation |
| UX-03 | UI en espanol | All text from UI-SPEC copywriting contract Section 9; page `lang` already set in layout |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.2.3 | UI rendering | Project runtime |
| Next.js 16 | 16.1.1 | App Router, routing | Project framework |
| shadcn/ui | 49 components | All form controls, layout, feedback | Already installed in `app/lib/shadcn/ui/` |
| Framer Motion | 11.18.2 | Step transitions, `AnimatePresence` | Already installed, used in Navbar |
| Sonner | 1.7.4 | Toast notifications | Already installed, shadcn wrapper at `app/lib/shadcn/ui/sonner.tsx` |
| Vaul | 0.9.9 | Mobile bottom sheet (Drawer) | Already installed, shadcn wrapper at `app/lib/shadcn/ui/drawer.tsx` |
| Zod | 3.23.8 | Request body validation (reuse `PackageRequest` schema) | Already in project |
| Lucide React | 0.429.0 | Icons (Check, X, Search, ChevronRight, Music, etc.) | Primary icon library per UI-SPEC |

### Supporting (Already Available)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.1.1 | Conditional class construction | Complex conditional styling |
| tailwind-merge | via `cn()` | Smart class merging | Composing component styles |
| @directus/sdk | 17.0.0 | Fetching hymnal/category lists for filters | New service functions or direct client fetch |

### Alternatives Considered

None. All decisions are locked. No new packages needed.

**Installation:** No installation required. All dependencies are present.

## Architecture Patterns

### Recommended Project Structure

```
app/
  empaquetador/
    page.tsx                    # 'use client' - top-level EmpaquetadorPage component
    components/
      WizardStepper.tsx         # Step indicator with circles, labels, connector lines
      StepSeleccion.tsx         # Step 1: search + filters + results + selected panel
      StepConfiguracion.tsx     # Step 2: print config + audio config
      StepDescarga.tsx          # Step 3: summary + generate + download
      HymnResultRow.tsx         # Single search result row
      SelectedHymnChip.tsx      # Selected hymn in sidebar/drawer
      AudioTrackRow.tsx         # Single audio track checkbox
    hooks/
      useHymnSearch.ts          # Debounced search with AbortController
      useWizardReducer.ts       # Reducer definition, types, and initial state
    lib/
      wizard-actions.ts         # Action type definitions for the reducer
      build-package-request.ts  # Assembles PackageRequest from wizard state
```

### Pattern 1: useReducer Wizard State

**What:** Single `useReducer` managing all wizard state as per D-20/D-21.
**When to use:** Complex state with multiple interdependent fields.

```typescript
// Source: D-20, D-21, UI-SPEC Section 15
type WizardAction =
  | { type: 'SET_STEP'; step: 1 | 2 | 3 }
  | { type: 'ADD_HYMN'; hymn: HymnSearchResult }
  | { type: 'REMOVE_HYMN'; hymnId: string }
  | { type: 'SET_LAYOUT'; layout: 'one-per-page' | 'two-per-page' }
  | { type: 'SET_STYLE'; style: 'decorated' | 'plain' }
  | { type: 'TOGGLE_AUDIO'; hymnId: string; field: string }
  | { type: 'SELECT_ALL_AUDIO'; selected: boolean }
  | { type: 'SET_GENERATING'; isGenerating: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'ADD_HYMN':
      if (state.selectedHymns.some(h => h.id === action.hymn.id)) return state;
      return { ...state, selectedHymns: [...state.selectedHymns, action.hymn] };
    case 'REMOVE_HYMN': {
      const newAudio = new Map(state.audioSelections);
      newAudio.delete(action.hymnId);
      return {
        ...state,
        selectedHymns: state.selectedHymns.filter(h => h.id !== action.hymnId),
        audioSelections: newAudio,
      };
    }
    // ... other cases
  }
}
```

### Pattern 2: Debounced Search with AbortController

**What:** Search-as-you-type with 300ms debounce and request cancellation.
**When to use:** Preventing stale results from slow requests overtaking fast ones.

```typescript
// Custom hook pattern
function useHymnSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HymnSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Cancel previous in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const params = new URLSearchParams();
      if (query) params.set('q', query);
      // ... add hymnal, category filters

      setIsLoading(true);
      fetch(`/api/hymns/search?${params}`, { signal: controller.signal })
        .then(res => res.json())
        .then(json => {
          if (json.ok) setResults(json.data);
          else setError(json.error);
        })
        .catch(err => {
          if (err.name !== 'AbortError') setError('Error al buscar.');
        })
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query, /* hymnal, category */]);

  return { query, setQuery, results, isLoading, error };
}
```

### Pattern 3: Blob Download from Streaming Response

**What:** Downloading the ZIP response as a file via `createObjectURL`.
**When to use:** Step 3 "Generar Paquete" button handler.

```typescript
async function handleGenerate(state: WizardState, dispatch: Dispatch<WizardAction>) {
  dispatch({ type: 'SET_GENERATING', isGenerating: true });
  dispatch({ type: 'SET_ERROR', error: null });

  try {
    const body = buildPackageRequest(state);
    const res = await fetch('/api/hymns/package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error('Server error');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'himnos.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Paquete descargado exitosamente!');
  } catch (err) {
    dispatch({ type: 'SET_ERROR', error: 'Error al generar el paquete.' });
    toast.error('Error al generar el paquete. Intenta de nuevo.', {
      action: { label: 'Reintentar', onClick: () => handleGenerate(state, dispatch) },
    });
  } finally {
    dispatch({ type: 'SET_GENERATING', isGenerating: false });
  }
}
```

### Pattern 4: Mobile Bottom Sheet with Vaul Drawer

**What:** On mobile (`< lg`), selected hymns appear in a Drawer instead of a sidebar.
**When to use:** Responsive layout for Step 1.

```typescript
// Conditional rendering based on viewport
// Use CSS responsive classes, not JS media queries
<div className="hidden lg:block w-80">
  <SelectedHymnsPanel hymns={selectedHymns} onRemove={...} />
</div>
<div className="lg:hidden">
  {selectedHymns.length > 0 && (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="fixed bottom-0 left-0 right-0 h-14 z-40">
          Seleccionados <Badge>{selectedHymns.length}</Badge>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <SelectedHymnsPanel hymns={selectedHymns} onRemove={...} />
      </DrawerContent>
    </Drawer>
  )}
</div>
```

### Anti-Patterns to Avoid

- **Lifting search state to the reducer:** Search query, results, and loading state are transient UI state. Keep them in the `useHymnSearch` hook, separate from the wizard reducer. The reducer tracks only persistent wizard selections.
- **Using `useEffect` for step transitions:** Step changes should be direct dispatch calls from button handlers, not effect-driven. Effects for steps create cascading render issues.
- **Inline fetch calls without AbortController:** Rapid typing will fire many requests. Without abort, stale responses can overwrite newer results.
- **Serializing Map/Set to JSON directly:** `Map` and `Set` are not JSON-serializable. When building the `PackageRequest`, convert `audioSelections` Map to the array format expected by the Zod schema.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounce | Custom debounce function | `setTimeout` + `clearTimeout` in `useEffect` | Simple enough; no need for lodash.debounce |
| Toast notifications | Custom notification system | Sonner via `toast()` from `sonner` package | Already installed, integrated with shadcn |
| Bottom sheet / drawer | Custom slide-up panel | Vaul `Drawer` via `@/lib/shadcn/ui` | Touch gestures, snap points, accessibility built-in |
| Step transitions | CSS transitions + manual state | Framer Motion `AnimatePresence` | Already in project, handles enter/exit animations |
| File download | `window.location.href` redirect | `URL.createObjectURL` + `<a>` click | Allows blob handling, custom filename, cleanup |
| Indeterminate progress | CSS keyframes animation | shadcn `Progress` + `animate-pulse` | Consistent with design system |

## Common Pitfalls

### Pitfall 1: Sonner Toaster Not Mounted

**What goes wrong:** `toast()` calls do nothing -- no toast appears.
**Why it happens:** The Sonner `<Toaster />` component is NOT currently rendered anywhere in the app. The component exists in `app/lib/shadcn/ui/sonner.tsx` and is exported from the barrel, but it is not added to `app/layout.tsx`.
**How to avoid:** Add `<Toaster />` from `@/lib/shadcn/ui` to `app/layout.tsx` body as the first task.
**Warning signs:** Toast calls execute without errors but nothing visible appears.

### Pitfall 2: Map/Set Not Serializable in PackageRequest

**What goes wrong:** `JSON.stringify()` on a `Map` or `Set` produces `{}` or `[]`.
**Why it happens:** D-21 uses `Map<string, Set<string>>` for `audioSelections` in state, but the POST body needs a plain array of field name strings per hymn.
**How to avoid:** Create a `buildPackageRequest()` function that explicitly converts: iterate the Map, spread each Set into an array, and assemble the `{ hymns: [...], layout, style }` object.
**Warning signs:** API returns 400 validation error with empty `audioFiles` arrays.

### Pitfall 3: Stale Search Results from Race Conditions

**What goes wrong:** User types "grace", results for "gra" arrive after results for "grace", overwriting them.
**Why it happens:** Network requests complete out of order.
**How to avoid:** Use `AbortController` to cancel the previous request when a new one fires. Check `err.name === 'AbortError'` to silently ignore aborted requests.
**Warning signs:** Search results flicker or show wrong results for the current query.

### Pitfall 4: Memory Leak from Unreleased Object URLs

**What goes wrong:** Each ZIP download creates a blob URL that persists in browser memory.
**Why it happens:** `URL.createObjectURL()` allocates memory that is not garbage collected automatically.
**How to avoid:** Call `URL.revokeObjectURL(url)` immediately after the programmatic `<a>` click triggers the download.
**Warning signs:** Browser memory grows with each package download, especially for large ZIPs.

### Pitfall 5: Drawer Conflicts with Fixed Bottom Navigation

**What goes wrong:** The mobile drawer trigger bar overlaps with the "Siguiente"/"Atras" navigation buttons.
**Why it happens:** Both are positioned at the bottom of the viewport.
**How to avoid:** Add `pb-16` (or equivalent) to the step content when selected hymns exist on mobile, pushing the nav buttons above the fixed trigger bar.
**Warning signs:** Navigation buttons hidden behind the drawer trigger on mobile.

### Pitfall 6: Progress Bar Indeterminate State

**What goes wrong:** The Progress component shows 0% instead of an indeterminate animation.
**Why it happens:** shadcn's `Progress` uses `translateX(-${100 - (value || 0)}%)` -- passing `undefined` results in 0%.
**How to avoid:** For indeterminate state, pass `value={100}` and add `animate-pulse` class to the Progress root. Or use a custom CSS animation that slides the indicator back and forth.
**Warning signs:** Static empty progress bar during generation.

### Pitfall 7: Fetching Hymnal/Category Lists for Filters

**What goes wrong:** Filter dropdowns need data from Directus collections `hymnals` and `hymn_categories`, but there are no existing service functions or API routes for these.
**Why it happens:** Phase 3 only created search and package endpoints.
**How to avoid:** Either (a) create new API routes `/api/hymnals` and `/api/categories` that proxy to Directus, or (b) fetch directly from Directus public API from the client if `NEXT_PUBLIC_DIRECTUS_URL` is available. Option (a) is cleaner and follows existing patterns.
**Warning signs:** Filter dropdowns show "Cargando..." forever or fail silently.

## Code Examples

### Assembling PackageRequest from Wizard State

```typescript
// Source: app/lib/zip/zip.schema.ts (PackageRequest type)
import type { PackageRequest } from '@/app/lib/zip/zip.schema';

function buildPackageRequest(state: WizardState): PackageRequest {
  return {
    hymns: state.selectedHymns.map(hymn => ({
      id: hymn.id,
      audioFiles: Array.from(state.audioSelections.get(hymn.id) ?? []) as PackageRequest['hymns'][0]['audioFiles'],
    })),
    layout: state.layout,
    style: state.style,
  };
}
```

### WizardStepper Component Structure

```typescript
// Source: UI-SPEC Section 7
import { Check } from 'lucide-react';
import { cn } from '@/app/lib/shadcn/utils';

const STEPS = [
  { number: 1, label: 'Seleccionar Himnos' },
  { number: 2, label: 'Configurar' },
  { number: 3, label: 'Descargar' },
] as const;

interface WizardStepperProps {
  currentStep: 1 | 2 | 3;
  onStepClick: (step: 1 | 2 | 3) => void;
}

function WizardStepper({ currentStep, onStepClick }: WizardStepperProps) {
  return (
    <nav role="navigation" aria-label="Pasos del empaquetador" className="flex items-center justify-center gap-4">
      {STEPS.map((step, i) => {
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;
        const isClickable = isCompleted;

        return (
          <React.Fragment key={step.number}>
            {i > 0 && (
              <div className={cn('h-0.5 flex-1', isCompleted ? 'bg-primary' : 'bg-border')} />
            )}
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step.number)}
              disabled={!isClickable}
              className={cn(
                'flex flex-col items-center gap-1',
                isClickable ? 'cursor-pointer' : 'cursor-default',
              )}
              aria-current={isActive ? 'step' : undefined}
              aria-label={isCompleted ? `Paso ${step.number} completado` : undefined}
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold',
                'sm:w-10 sm:h-10 w-8 h-8',
                isCompleted && 'bg-primary text-primary-foreground',
                isActive && 'bg-primary text-primary-foreground',
                !isCompleted && !isActive && 'bg-muted text-muted-foreground',
              )}>
                {isCompleted ? <Check className="h-4 w-4" /> : step.number}
              </div>
              <span className={cn(
                'text-sm hidden sm:block',
                (isActive || isCompleted) ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}>
                {step.label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
```

### Mounting Sonner Toaster in Root Layout

```typescript
// Add to app/layout.tsx body
import { Toaster } from '@/lib/shadcn/ui';

// Inside <body> tag:
<body ...>
  {children}
  <Toaster />
</body>
```

### Select All Audio Toggle Logic

```typescript
// "Seleccionar todo" toggles all available tracks across all hymns
function handleSelectAllAudio(selected: boolean, selectedHymns: HymnSearchResult[]) {
  if (selected) {
    const newSelections = new Map<string, Set<string>>();
    for (const hymn of selectedHymns) {
      if (!hymn.hasAnyAudio) continue;
      const tracks = new Set<string>();
      const audioFields = ['track_only', 'midi_file', 'soprano_voice', 'alto_voice', 'tenor_voice', 'bass_voice'] as const;
      for (const field of audioFields) {
        if (hymn.audioFiles[field] !== null) {
          tracks.add(field);
        }
      }
      if (tracks.size > 0) newSelections.set(hymn.id, tracks);
    }
    return newSelections;
  } else {
    return new Map<string, Set<string>>();
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `file-saver` `saveAs()` | Native `createObjectURL` + `<a>` click | N/A | file-saver is installed but unnecessary for simple blob downloads |
| `lodash.debounce` for search | `setTimeout`/`clearTimeout` in `useEffect` | React 18+ | No external dependency needed for simple debounce |
| React Context for wizard state | `useReducer` in parent component | N/A | Context is overkill when state does not need to cross layout boundaries |

## Open Questions

1. **Hymnal/Category List Endpoints**
   - What we know: The search API accepts `hymnal` (UUID) and `category` (number ID) params, but there are no endpoints to list available hymnals and categories for the filter dropdowns.
   - What's unclear: Whether to create new API routes or fetch directly from Directus client-side.
   - Recommendation: Create two simple API routes (`/api/hymnals` and `/api/categories`) that query Directus with `readItems()`. This follows the existing pattern (server proxies Directus) and avoids exposing `NEXT_PUBLIC_DIRECTUS_URL` as a hard requirement for the client.

2. **Search by Hymn Number via `q` Param**
   - What we know: CONTEXT says D-04 "searches by hymn number and name simultaneously via the existing `q` param." However, the current `searchHymns()` function only filters `name._icontains` with the `query` param. It has a separate `hymnNumber` exact-match filter.
   - What's unclear: Whether the search route needs updating to detect numeric input and also filter by `hymn_number`, or if this was already handled and I missed it.
   - Recommendation: The UI should parse the input -- if it looks like a number, include it as both `q` (name search) and as a separate hint. Alternatively, update the search API to handle this. This may be a minor Phase 3 gap to address in Phase 4.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUSQ-01 | Search by hymn number | integration | `npx vitest run tests/empaquetador/useHymnSearch.test.ts -t "number"` | No - Wave 0 |
| BUSQ-02 | Search by hymn name | integration | `npx vitest run tests/empaquetador/useHymnSearch.test.ts -t "name"` | No - Wave 0 |
| BUSQ-03 | Filter by hymnal | integration | `npx vitest run tests/empaquetador/useHymnSearch.test.ts -t "hymnal"` | No - Wave 0 |
| BUSQ-04 | Filter by category | integration | `npx vitest run tests/empaquetador/useHymnSearch.test.ts -t "category"` | No - Wave 0 |
| BUSQ-05 | Multi-select hymns | unit | `npx vitest run tests/empaquetador/wizardReducer.test.ts -t "ADD_HYMN"` | No - Wave 0 |
| BUSQ-06 | View selected hymns summary | manual-only | Visual inspection of sidebar/drawer | N/A |
| BUSQ-07 | Remove hymns from selection | unit | `npx vitest run tests/empaquetador/wizardReducer.test.ts -t "REMOVE_HYMN"` | No - Wave 0 |
| AUDIO-01 | See available audio tracks | manual-only | Visual inspection of accordion | N/A |
| AUDIO-02 | Select audio tracks | unit | `npx vitest run tests/empaquetador/wizardReducer.test.ts -t "TOGGLE_AUDIO"` | No - Wave 0 |
| AUDIO-03 | Only show existing tracks | unit | `npx vitest run tests/empaquetador/wizardReducer.test.ts -t "audio filter"` | No - Wave 0 |
| UX-01 | 3-step wizard | unit | `npx vitest run tests/empaquetador/wizardReducer.test.ts -t "SET_STEP"` | No - Wave 0 |
| UX-02 | Step navigation | unit | `npx vitest run tests/empaquetador/wizardReducer.test.ts -t "navigation"` | No - Wave 0 |
| UX-03 | UI in Spanish | manual-only | Visual inspection of all labels | N/A |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/empaquetador/ --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/empaquetador/wizardReducer.test.ts` -- covers BUSQ-05, BUSQ-07, AUDIO-02, AUDIO-03, UX-01, UX-02
- [ ] `tests/empaquetador/buildPackageRequest.test.ts` -- covers Map/Set to JSON conversion
- [ ] `tests/empaquetador/useHymnSearch.test.ts` -- covers BUSQ-01 through BUSQ-04 (requires fetch mock)

Note: Current vitest config uses `environment: 'node'`. Testing React hooks (useHymnSearch) would require `@testing-library/react` and `jsdom` environment. The reducer tests can run in node environment since they are pure functions. Recommend focusing Wave 0 tests on the pure reducer and `buildPackageRequest` utility.

## Sources

### Primary (HIGH confidence)
- `app/api/hymns/search/route.ts` -- verified GET endpoint shape and params
- `app/api/hymns/package/route.ts` -- verified POST endpoint shape and streaming response
- `app/lib/zip/zip.schema.ts` -- verified `PackageRequest` Zod schema
- `app/interfaces/Hymn.interface.ts` -- verified `HymnSearchResult`, `HymnAudioFiles` types
- `app/lib/shadcn/ui/` -- verified 49 components installed including drawer, progress, sonner, accordion
- `app/layout.tsx` -- verified Sonner `<Toaster>` is NOT mounted (critical gap)
- `app/lib/directus/services/hymns.ts` -- verified `searchHymns()` and `fetchHymnForPdf()` implementations
- `package.json` dependencies -- verified framer-motion@11.18.2, sonner@1.7.4, vaul@0.9.9

### Secondary (MEDIUM confidence)
- `app/sections/Navbar.tsx` -- Navbar is a demo/placeholder; hamburger menu is commented out. Adding empaquetador link to landing page buttons is the practical approach per D-03.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all packages verified installed with `npm ls`, no new installs needed
- Architecture: HIGH - patterns derived from locked decisions (D-01 through D-21) and existing codebase patterns
- Pitfalls: HIGH - all 7 pitfalls verified by reading actual source code (Sonner not mounted, Progress value handling, search service limitations)

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (30 days -- stable, no external API changes expected)
