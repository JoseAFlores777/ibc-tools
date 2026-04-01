---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/GuidedTour.tsx
  - app/visualizador/lib/tour-steps.ts
  - app/empaquetador/lib/tour-steps.ts
  - app/visualizador/page.tsx
  - app/empaquetador/page.tsx
  - app/visualizador/components/PlaylistColumn.tsx
  - app/visualizador/components/SlideGridColumn.tsx
  - app/visualizador/components/LivePreviewColumn.tsx
  - app/visualizador/components/ProjectionControls.tsx
  - app/empaquetador/components/SelectionSidebar.tsx
  - app/empaquetador/components/StepSeleccion.tsx
autonomous: true
requirements: [QUICK-TOUR]
must_haves:
  truths:
    - "First-time visitor to visualizador sees a 7-step guided tour automatically"
    - "First-time visitor to empaquetador sees a 5-step guided tour automatically"
    - "Tour does not appear on subsequent visits (localStorage persistence)"
    - "User can re-trigger tour via a floating help button"
    - "Tour highlights target elements with a dark overlay and spotlight cutout"
    - "Tour repositions correctly on window resize and scroll"
  artifacts:
    - path: "app/components/GuidedTour.tsx"
      provides: "Reusable GuidedTour component and HelpButton component"
      exports: ["GuidedTour", "HelpButton", "TourStep"]
    - path: "app/visualizador/lib/tour-steps.ts"
      provides: "7 tour step definitions for visualizador"
      exports: ["VISUALIZADOR_TOUR_STEPS"]
    - path: "app/empaquetador/lib/tour-steps.ts"
      provides: "5 tour step definitions for empaquetador"
      exports: ["EMPAQUETADOR_TOUR_STEPS"]
  key_links:
    - from: "app/visualizador/page.tsx"
      to: "app/components/GuidedTour.tsx"
      via: "import and render GuidedTour + HelpButton"
      pattern: "GuidedTour.*steps.*VISUALIZADOR"
    - from: "app/empaquetador/page.tsx"
      to: "app/components/GuidedTour.tsx"
      via: "import and render GuidedTour + HelpButton"
      pattern: "GuidedTour.*steps.*EMPAQUETADOR"
    - from: "app/components/GuidedTour.tsx"
      to: "target elements"
      via: "data-tour CSS selectors and getBoundingClientRect"
      pattern: "querySelector.*data-tour"
---

<objective>
Create a guided tour system with spotlight tooltips for the Visualizador and Empaquetador tools.

Purpose: First-time users of these complex tools need onboarding guidance. A spotlight tour highlights key UI areas with explanatory tooltips, auto-starting on first visit and re-triggerable via a help button.

Output: GuidedTour reusable component, tour step definitions for both tools, data-tour attributes on target elements, wired into both pages.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/visualizador/page.tsx
@app/empaquetador/page.tsx
@app/visualizador/components/PlaylistColumn.tsx
@app/visualizador/components/SlideGridColumn.tsx
@app/visualizador/components/LivePreviewColumn.tsx
@app/visualizador/components/ProjectionControls.tsx
@app/empaquetador/components/SelectionSidebar.tsx
@app/empaquetador/components/StepSeleccion.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create GuidedTour component and tour step definitions</name>
  <files>
    app/components/GuidedTour.tsx
    app/visualizador/lib/tour-steps.ts
    app/empaquetador/lib/tour-steps.ts
  </files>
  <action>
Create `app/components/GuidedTour.tsx` as a 'use client' component:

**Types (export):**
```typescript
export interface TourStep {
  target: string;        // CSS selector, e.g. '[data-tour="agregar-himno"]'
  title: string;         // Spanish title
  description: string;   // Spanish description
  position?: 'top' | 'bottom' | 'left' | 'right'; // tooltip placement relative to target
}
```

**GuidedTour component props:**
- `steps: TourStep[]`
- `storageKey: string` (used as `tour-completed-{storageKey}` in localStorage)
- `onComplete?: () => void`

**Behavior:**
- On mount, check `localStorage.getItem('tour-completed-{storageKey}')`. If set, do not auto-start.
- Maintain state: `currentStep` (number), `isActive` (boolean), `spotlightRect` (DOMRect | null).
- When active, render a full-screen fixed overlay (z-[9998]) with `pointer-events: none` on the spotlight area.
- Implementation approach for spotlight: Use a single full-screen SVG overlay with a `<rect>` fill="black" opacity="0.6" and a `<rect>` cutout using SVG mask or clipPath to create the transparent hole. The cutout rect matches the target element's bounding rect with 8px padding and 8px border-radius.
- Use `document.querySelector(step.target)` to find the target element. If not found, skip to next step.
- Call `getBoundingClientRect()` on target to get position. Add 8px padding around the spotlight cutout.
- Attach a ResizeObserver on document.body and a scroll listener (passive, on window) to recalculate `spotlightRect` when layout changes. Debounce recalc to 100ms.
- Tooltip card (z-[9999], pointer-events: auto): render as a div with `bg-white rounded-xl shadow-2xl border border-border p-5 max-w-[320px]`. Contains:
  - `title` in `text-sm font-semibold text-foreground`
  - `description` in `text-xs text-muted-foreground mt-1`
  - Step indicator: `text-xs text-muted-foreground mt-3` showing "Paso {current+1} de {total}"
  - Button row: `flex items-center justify-between mt-3 gap-2`
    - Left: "Omitir" ghost button (text-xs) — calls complete handler
    - Right: "Anterior" outline button (text-xs, hidden on step 0) + "Siguiente"/"Finalizar" default button (text-xs)
- Position tooltip based on `position` prop (default: 'bottom'):
  - 'bottom': below target, horizontally centered
  - 'top': above target, horizontally centered
  - 'left': left of target, vertically centered
  - 'right': right of target, vertically centered
  - Clamp tooltip position to stay within viewport (16px margin from edges).
- CSS transitions between steps: apply `transition: opacity 200ms, transform 200ms` on the tooltip. When step changes, briefly set opacity to 0, update position, then fade back to 1.
- On "Finalizar" or "Omitir": set `localStorage.setItem('tour-completed-{storageKey}', 'true')`, set isActive to false, call onComplete if provided.
- Scroll target element into view with `element.scrollIntoView({ behavior: 'smooth', block: 'center' })` before showing each step.
- Clicking the overlay (outside spotlight) does nothing (prevents accidental dismissal).

**HelpButton component (export):**
- Props: `onClick: () => void`
- Renders a fixed button at bottom-right (bottom-6 right-6, z-50): a 40x40 circle with `bg-primary text-primary-foreground shadow-lg hover:shadow-xl` containing a "?" character (text-lg font-bold).
- Tooltip on hover: "Ver tutorial" (use title attribute, no dependency on TooltipProvider).

**GuidedTour also exports a helper hook `useTour(storageKey: string)`:**
```typescript
export function useTour(storageKey: string) {
  const [isActive, setIsActive] = useState(false);
  const startTour = useCallback(() => setIsActive(true), []);
  const handleComplete = useCallback(() => setIsActive(false), []);
  return { isActive, startTour, handleComplete };
}
```
This lets the page control when the tour starts and wire HelpButton's onClick to startTour.

GuidedTour should accept an `active` boolean prop (controlled mode): when true the tour is shown, when false it is hidden. The auto-start check (localStorage) should happen in the useTour hook instead — if localStorage flag is not set, auto-set isActive to true on mount.

**Create `app/visualizador/lib/tour-steps.ts`:**
Export `VISUALIZADOR_TOUR_STEPS: TourStep[]` with 7 steps:
1. `target: '[data-tour="agregar-himno"]'`, title: "Agregar Himnos", description: "Busca himnos por nombre o numero y agregalos a tu lista de reproduccion.", position: 'right'
2. `target: '[data-tour="playlist"]'`, title: "Lista de Reproduccion", description: "Aqui aparecen los himnos que agregaste. Arrastralos para reordenar.", position: 'right'
3. `target: '[data-tour="slide-grid"]'`, title: "Diapositivas", description: "Selecciona una diapositiva para proyectarla. Usa las flechas del teclado para navegar.", position: 'bottom'
4. `target: '[data-tour="preview"]'`, title: "Vista Previa", description: "Muestra como se vera la diapositiva en la pantalla de proyeccion.", position: 'left'
5. `target: '[data-tour="proyectar"]'`, title: "Proyectar", description: "Abre la ventana de proyeccion en pantalla completa para mostrar las diapositivas.", position: 'left'
6. `target: '[data-tour="control-remoto"]'`, title: "Control Remoto", description: "Controla la proyeccion desde tu celular escaneando el codigo QR.", position: 'left'
7. `target: '[data-tour="configuracion"]'`, title: "Configuracion", description: "Cambia la fuente, colores, alineacion y fondo de la proyeccion.", position: 'left'

**Create `app/empaquetador/lib/tour-steps.ts`:**
Export `EMPAQUETADOR_TOUR_STEPS: TourStep[]` with 5 steps:
1. `target: '[data-tour="explorar-himnos"]'`, title: "Explorar Himnos", description: "Busca himnos por nombre, numero o categoria. Haz clic para seleccionarlos.", position: 'right'
2. `target: '[data-tour="mi-seleccion"]'`, title: "Mi Seleccion", description: "Los himnos seleccionados aparecen aqui. Puedes quitar cualquiera haciendo clic en la X.", position: 'right'
3. `target: '[data-tour="historial"]'`, title: "Historial", description: "Accede a paquetes que generaste anteriormente para reutilizarlos.", position: 'right'
4. `target: '[data-tour="configuracion-emp"]'`, title: "Configuracion", description: "Ajusta el tamano de letra, estilo de impresion y selecciona las pistas de audio.", position: 'top'
5. `target: '[data-tour="paso-siguiente"]'`, title: "Siguiente Paso", description: "Cuando tengas tus himnos, avanza para configurar y descargar tu paquete.", position: 'top'
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>GuidedTour.tsx exports GuidedTour, HelpButton, useTour, and TourStep. Both tour-steps.ts files export their step arrays. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Add data-tour attributes and wire tour into both pages</name>
  <files>
    app/visualizador/components/PlaylistColumn.tsx
    app/visualizador/components/SlideGridColumn.tsx
    app/visualizador/components/LivePreviewColumn.tsx
    app/visualizador/components/ProjectionControls.tsx
    app/visualizador/page.tsx
    app/empaquetador/components/SelectionSidebar.tsx
    app/empaquetador/components/StepSeleccion.tsx
    app/empaquetador/page.tsx
  </files>
  <action>
**Add data-tour attributes to Visualizador components:**

In `PlaylistColumn.tsx`:
- Add `data-tour="agregar-himno"` to the "Agregar himno" `<Button>` (line ~97, the one with `onClick={() => setDialogOpen(true)}`).
- Add `data-tour="playlist"` to the outer `<div className="flex flex-col h-full">` wrapper (line ~93).

In `SlideGridColumn.tsx`:
- Add `data-tour="slide-grid"` to the root wrapper div of the component (the outer container that wraps the slide grid content — apply to the outermost element returned by the component).

In `LivePreviewColumn.tsx`:
- Add `data-tour="preview"` to the preview rendering container — the div that contains the SlideRenderer (the `containerRef` div). If there's a wrapper around the preview + controls, put it on the preview area specifically.

In `ProjectionControls.tsx`:
- Add `data-tour="proyectar"` to the "Proyectar" `<Button>` (line ~122, the one with `onClick={onProjectToggle}`).
- Add `data-tour="control-remoto"` to the "Control Remoto" `<Button>` (line ~136, the one with `onClick={() => setQrOpen(true)}`). NOTE: This button is conditionally rendered when `remotePin` is truthy. The tour step for control-remoto should gracefully skip if not found (GuidedTour already handles missing targets by skipping).
- Add `data-tour="configuracion"` to the `<Separator>` after the mode buttons (line ~253) — actually, better: wrap the font/size/alignment/color controls section (everything after the second Separator, lines ~255-394) in a `<div data-tour="configuracion">` wrapper. This highlights the entire settings area.

**Add data-tour attributes to Empaquetador components:**

In `StepSeleccion.tsx`:
- Add `data-tour="explorar-himnos"` to the HymnExplorer wrapper or the HymnExplorer component's parent container div. Read the full file to find the appropriate wrapper.

In `SelectionSidebar.tsx`:
- Add `data-tour="mi-seleccion"` to the `<aside>` element (line ~21, the outer sidebar wrapper).
- Add `data-tour="historial"` to the "Historial" `<Button>` in the open state (line ~67, the one with `onClick={onShowHistory}`).

In `app/empaquetador/page.tsx`:
- Add `data-tour="configuracion-emp"` to the WizardStepper's parent container or the step 2 button area. Since steps change content, a good target is the WizardStepper container div: `<div className="hidden sm:block">` (line ~162). Actually better: add it to the bottom action bar div (line ~160, `<div className="fixed bottom-0 ...">`) since it's always visible.
- Add `data-tour="paso-siguiente"` to the "Siguiente" `<Button>` in step 1 (line ~199, the one with `onClick={handleNext}`).

**Wire GuidedTour into Visualizador page.tsx:**
- Import `{ GuidedTour, HelpButton, useTour }` from `@/app/components/GuidedTour`
- Import `{ VISUALIZADOR_TOUR_STEPS }` from `./lib/tour-steps`
- Call `const { isActive, startTour, handleComplete } = useTour('visualizador');` inside VisualizadorPage.
- Render at end of the main return JSX (inside the outermost div, after AudioBar):
  ```tsx
  <GuidedTour steps={VISUALIZADOR_TOUR_STEPS} storageKey="visualizador" active={isActive} onComplete={handleComplete} />
  <HelpButton onClick={startTour} />
  ```

**Wire GuidedTour into Empaquetador page.tsx:**
- Import same components.
- Import `{ EMPAQUETADOR_TOUR_STEPS }` from `./lib/tour-steps`
- Call `const { isActive, startTour, handleComplete } = useTour('empaquetador');` inside EmpaquetadorPage.
- Render at end of the main return JSX (inside the outermost div, after the fixed bottom bar):
  ```tsx
  <GuidedTour steps={EMPAQUETADOR_TOUR_STEPS} storageKey="empaquetador" active={isActive} onComplete={handleComplete} />
  <HelpButton onClick={startTour} />
  ```
- Do NOT render GuidedTour inside the loadingPackage or showHistory early returns — only in the main return.
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
    - data-tour attributes present on all target elements in both tools
    - GuidedTour and HelpButton rendered in both page.tsx files
    - Tour auto-starts on first visit (no localStorage flag)
    - "?" help button visible fixed bottom-right on both pages
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` completes successfully
3. Manual check: open /visualizador in incognito — tour should auto-start, spotlight the "Agregar himno" button first
4. Manual check: click "Omitir", refresh page — tour should NOT appear. Click "?" button — tour restarts.
5. Manual check: open /empaquetador in incognito — 5-step tour auto-starts
</verification>

<success_criteria>
- GuidedTour component is reusable with any set of TourStep definitions
- Visualizador has 7 tour steps targeting real UI elements via data-tour attributes
- Empaquetador has 5 tour steps targeting real UI elements via data-tour attributes
- Tour persists completion state in localStorage per-tool
- HelpButton allows re-triggering the tour
- Spotlight overlay with rounded cutout highlights each target element
- Tooltip repositions on resize/scroll
- All text is in Spanish
</success_criteria>

<output>
After completion, create `.planning/quick/260331-tgm-guided-tour-system-with-spotlight-toolti/260331-tgm-SUMMARY.md`
</output>
