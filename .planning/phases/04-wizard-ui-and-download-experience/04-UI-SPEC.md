---
status: draft
phase: "04"
phase_name: Wizard UI and Download Experience
design_system: shadcn (default style, slate base, CSS variables)
created: "2026-03-29"
---

# UI-SPEC: Phase 4 — Wizard UI and Download Experience

## 1. Design System Reference

| Property | Value | Source |
|----------|-------|--------|
| Tool | shadcn/ui (default style) | `components.json` |
| Base Color | slate | `components.json` — `tailwind.baseColor: "slate"` |
| CSS Variables | yes | `components.json` — `tailwind.cssVariables: true` |
| Border Radius | 0.5rem (`--radius`) | `globals.css` |
| Font | Inter (variable `--font-sans`) | `app/layout.tsx` |
| Dark Mode | class-based | `tailwind.config.ts` — `darkMode: ["class"]` |
| Icon Libraries | Lucide React, Heroicons, Iconify | `CLAUDE.md` tech stack |

**Primary icon library for this phase:** Lucide React (already used by shadcn components).

## 2. Spacing

8-point scale. All spacing values in Tailwind classes.

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` / `p-1` | 4px | Inline icon-to-text gap, badge internal padding |
| `gap-2` / `p-2` | 8px | Compact list item padding, checkbox-to-label gap |
| `gap-3` / `p-3` | 12px | Card internal padding on mobile |
| `gap-4` / `p-4` | 16px | Card internal padding on desktop, section gap |
| `gap-6` / `p-6` | 24px | Step content vertical gap, section separation |
| `gap-8` / `p-8` | 32px | Page-level vertical padding |
| `gap-12` / `py-12` | 48px | Wizard stepper top margin from page edge |

**Touch targets:** All interactive elements (buttons, checkboxes, accordion triggers) have a minimum hit area of 44px height. Enforced by shadcn defaults for Button/Checkbox plus explicit `min-h-[44px]` on custom interactive rows.

## 3. Typography

Font: Inter (loaded via `next/font/google`, variable `--font-sans`).

| Role | Size | Weight | Line Height | Tailwind Class |
|------|------|--------|-------------|----------------|
| Page title | 28px | 600 (semibold) | 1.2 | `text-2xl font-semibold leading-tight` |
| Step heading | 20px | 600 (semibold) | 1.3 | `text-xl font-semibold` |
| Body / labels | 16px | 400 (regular) | 1.5 | `text-base font-normal leading-relaxed` |
| Caption / helper | 14px | 400 (regular) | 1.5 | `text-sm font-normal` |

**Weights used:** 400 (regular) and 600 (semibold). The 28px size on the page title provides sufficient visual anchoring without a third weight.

## 4. Color Contract

All colors reference CSS variables defined in `globals.css`. No hardcoded hex/hsl values in components.

### 60/30/10 Split

| Layer | Proportion | Token | Light Value | Usage |
|-------|-----------|-------|-------------|-------|
| Dominant surface | 60% | `bg-background` | slate-100 | Page background, wizard container |
| Secondary surface | 30% | `bg-card` | slate-200 | Result cards, selected hymns panel, accordion items |
| Accent | 10% | `bg-primary` | indigo-900 | Active step circle, "Siguiente" button, "Agregar" button, "Generar Paquete" button |

### Accent Reserved-For List

`primary` (indigo-900 light / slate-300 dark) is reserved for exactly these elements:
1. Active step indicator circle (filled)
2. Primary CTA buttons: "Siguiente", "Agregar", "Generar Paquete"
3. Progress bar fill during generation
4. Selected step checkmark icon

### Semantic Colors

| Token | Usage |
|-------|-------|
| `destructive` | "Quitar" button on selected hymns, error toast background |
| `muted` | Disabled/completed states, "Seleccionado" badge on already-selected results, "Sin pistas disponibles" label |
| `secondary` | "Atras" button, filter dropdowns, non-primary actions |

## 5. Component Inventory

All components from `app/lib/shadcn/ui/`. No new component installs required.

| Component | Usage in Phase 4 | Props/Variant |
|-----------|-------------------|---------------|
| `Button` | CTAs, navigation, remove hymn | `variant="default"` for primary, `variant="outline"` for secondary, `variant="ghost"` for "Quitar", `size="sm"` for inline actions |
| `Input` | Hymn search field | `placeholder="Buscar por numero o nombre..."` |
| `Select` | Hymnal filter, category filter | Controlled, with "Todos" default option |
| `Card` | Search result rows, selected hymn rows | `CardHeader` + `CardContent` omitted — use `Card` as a styled `div` with `p-3` |
| `Badge` | Hymnal name on search results, selected count | `variant="secondary"` for hymnal, `variant="default"` for count |
| `ScrollArea` | Search results list, selected hymns panel | Fixed height: `h-[400px]` on desktop, `h-[300px]` on mobile |
| `RadioGroup` | Layout selection, style selection | Two items each, vertical orientation |
| `Accordion` | Per-hymn audio track expansion | `type="multiple"`, `collapsible` |
| `Checkbox` | Individual audio track toggle, "Seleccionar todo" | Standard shadcn checkbox |
| `Progress` | ZIP generation indicator | Indeterminate: `value={undefined}` with pulsing animation via `animate-pulse` on the bar |
| `Separator` | Between wizard sections | Horizontal, default |
| `Label` | Form field labels | Paired with inputs, selects, checkboxes |

### Custom Components (to build)

| Component | Description |
|-----------|-------------|
| `WizardStepper` | 3-step horizontal indicator with numbered circles, labels, active/completed states |
| `StepSeleccion` | Step 1: search, filters, results list, selected hymns panel |
| `StepConfiguracion` | Step 2: layout radio, style radio, audio accordion per hymn |
| `StepDescarga` | Step 3: summary, generate button, progress, download/reset |
| `HymnResultRow` | Single search result row: number, name, hymnal badge, add button |
| `SelectedHymnChip` | Selected hymn in sidebar: number, name, remove button |
| `AudioTrackRow` | Single audio track checkbox within accordion |

## 6. Layout

### Page Structure

```
Route: /empaquetador
Container: max-w-4xl mx-auto px-4 py-8
```

### Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|--------------|
| `< 640px` (mobile) | Single column. Selected hymns move to collapsible bottom sheet (shadcn Drawer via `vaul`). Filters stack vertically. |
| `>= 640px` (sm) | Filters in a row. Results and selected panel still stacked. |
| `>= 1024px` (lg) | Two-column layout in Step 1: left column (search + results), right column (selected hymns sidebar, `w-80`). |

### Step 1 Layout (Seleccionar Himnos)

```
Desktop (lg+):
+-------------------------------------------+
|          WizardStepper (full width)        |
+-------------------------------------------+
| [Himnario v] [Categoria v]               |
| [Buscar por numero o nombre...        ]  |
+------------------------+------------------+
| Search Results         | Himnos           |
| (ScrollArea h-400)     | Seleccionados    |
|                        | (ScrollArea)     |
| HymnResultRow          | SelectedHymnChip |
| HymnResultRow          | SelectedHymnChip |
| ...                    | ...              |
+------------------------+------------------+
|        [Atras]              [Siguiente]   |
+-------------------------------------------+

Mobile:
+-------------------------------------------+
|          WizardStepper (compact)           |
+-------------------------------------------+
| [Himnario v]                              |
| [Categoria v]                             |
| [Buscar...                             ]  |
+-------------------------------------------+
| Search Results (ScrollArea h-300)         |
| HymnResultRow                             |
| HymnResultRow                             |
+-------------------------------------------+
| [Seleccionados (3)]  <- opens Drawer      |
+-------------------------------------------+
|                              [Siguiente]  |
+-------------------------------------------+
```

### Step 2 Layout (Configurar)

```
+-------------------------------------------+
|          WizardStepper                     |
+-------------------------------------------+
| Impresion                                 |
| +---------------------------------------+ |
| | Layout:  (o) 1 himno por pagina       | |
| |          ( ) 2 himnos por pagina      | |
| | Estilo:  (o) Decorado                 | |
| |          ( ) Plano                    | |
| +---------------------------------------+ |
|                                           |
| Audio                                     |
| [x] Seleccionar todas las pistas         |
| +---------------------------------------+ |
| | > Himno 123 - Nombre del himno        | |
| |   [x] Pista completa                  | |
| |   [x] MIDI                            | |
| |   [ ] Soprano                         | |
| +---------------------------------------+ |
| | Himno 456 - Sin pistas disponibles    | |
| +---------------------------------------+ |
+-------------------------------------------+
|  [Atras]                    [Siguiente]   |
+-------------------------------------------+
```

### Step 3 Layout (Descargar)

```
+-------------------------------------------+
|          WizardStepper                     |
+-------------------------------------------+
| Resumen del Paquete                       |
| +---------------------------------------+ |
| | 3 himnos | 1 por pagina | Decorado    | |
| | 5 pistas de audio                     | |
| +---------------------------------------+ |
|                                           |
|        [ Generar Paquete ]                |
|        [====== Progress ======]           |
|                                           |
|  "Paquete descargado exitosamente!"       |
|        [ Crear otro paquete ]             |
+-------------------------------------------+
```

## 7. Wizard Stepper Design

### Visual Specification

```
  (1)---------(2)---------(3)
Seleccionar  Configurar  Descargar
  Himnos
```

| State | Circle | Label | Connector Line |
|-------|--------|-------|----------------|
| Completed | `bg-primary text-primary-foreground` with Lucide `Check` icon (16px) | `text-sm font-semibold text-foreground` | `bg-primary h-0.5` |
| Active | `bg-primary text-primary-foreground` with step number | `text-sm font-semibold text-foreground` | `bg-border h-0.5` |
| Upcoming | `bg-muted text-muted-foreground` with step number | `text-sm text-muted-foreground` | `bg-border h-0.5` |

Circle size: `w-10 h-10 rounded-full` (40px). On mobile: `w-8 h-8` (32px) with labels hidden (show only on `sm+`).

Completed steps are clickable (`cursor-pointer`). Upcoming steps are not clickable (`cursor-default pointer-events-none`).

## 8. Interaction Contracts

### Search Behavior (Step 1)

| Trigger | Action | Feedback |
|---------|--------|----------|
| User types in search input | Debounce 300ms, then `GET /api/hymns/search?q={value}&hymnal={}&category={}` | Show skeleton rows (3 placeholder cards with `animate-pulse`) while loading |
| User selects hymnal filter | Immediately re-fetch search with new filter | Results update, skeleton during load |
| User selects category filter | Immediately re-fetch search with new filter | Results update, skeleton during load |
| User clicks "Agregar" on result | Add hymn to `selectedHymns` state | Row transitions to "Seleccionado" state: muted background, button replaced by `Badge variant="outline"` reading "Seleccionado" |
| User clicks "Quitar" (X) on selected hymn | Remove hymn from `selectedHymns` state | Hymn disappears from selected panel, result row returns to "Agregar" state |
| Search returns empty results | Show empty state | See Section 9: Copywriting |
| Network error on search | Show inline error below search | `text-destructive text-sm`: "Error al buscar. Intenta de nuevo." |

### Navigation (All Steps)

| Trigger | Action | Guard |
|---------|--------|-------|
| Click "Siguiente" (Step 1) | Advance to Step 2 | Disabled (`opacity-50 pointer-events-none`) if `selectedHymns.length === 0` |
| Click "Siguiente" (Step 2) | Advance to Step 3 | Always enabled (defaults set) |
| Click "Atras" | Return to previous step | All selections preserved |
| Click completed step circle | Jump to that step | Only backwards, all selections preserved |
| Click "Crear otro paquete" | Reset wizard state, go to Step 1 | Clears all state via dispatch `RESET` action |

### Download Flow (Step 3)

| Trigger | Action | Feedback |
|---------|--------|----------|
| Click "Generar Paquete" | POST to `/api/hymns/package` with assembled `PackageRequest` body | Button disabled + "Generando..." label. Progress bar appears with `animate-pulse` indeterminate state |
| Response received (200) | Read response as blob, create `URL.createObjectURL()`, trigger `<a>` click download | Sonner success toast. "Crear otro paquete" button appears |
| Response error (non-200 / network) | Set error state | Sonner error toast with "Reintentar" action button |
| Click "Reintentar" in toast | Re-trigger POST | Same flow as "Generar Paquete" |

## 9. Copywriting Contract

All UI text in Spanish (per UX-03).

### Labels and Headings

| Element | Text |
|---------|------|
| Page title (`<h1>`) | "Empaquetador de Himnos" |
| Step 1 heading | "Seleccionar Himnos" |
| Step 2 heading | "Configurar Impresion y Audio" |
| Step 3 heading | "Generar y Descargar" |
| Stepper label 1 | "Seleccionar Himnos" |
| Stepper label 2 | "Configurar" |
| Stepper label 3 | "Descargar" |
| Search placeholder | "Buscar por numero o nombre..." |
| Hymnal filter default | "Todos los himnarios" |
| Category filter default | "Todas las categorias" |
| Selected panel title | "Himnos Seleccionados" |
| Print section title | "Impresion" |
| Audio section title | "Audio" |
| Summary section title | "Resumen del Paquete" |

### Buttons (CTAs)

| Element | Text | Variant |
|---------|------|---------|
| Add hymn | "Agregar" | `default`, `size="sm"` |
| Remove hymn | X icon (Lucide `X`, 16px) | `ghost`, `size="icon"` |
| Already selected | "Seleccionado" | `Badge variant="outline"` (not a button) |
| Next step | "Siguiente" | `default` |
| Previous step | "Atras" | `outline` |
| Generate package | "Generar Paquete" | `default`, `size="lg"` |
| Generate (loading) | "Generando..." | `default`, `size="lg"`, `disabled` |
| Create another | "Crear otro paquete" | `outline` |
| Select all audio | "Seleccionar todas las pistas" | Checkbox label |

### Radio Options

| Group | Option 1 | Option 2 |
|-------|----------|----------|
| Layout | "1 himno por pagina" | "2 himnos por pagina" |
| Style | "Decorado" | "Plano" |

### Audio Track Labels

| Field Key | Spanish Label |
|-----------|---------------|
| `track_only` | "Pista completa" |
| `midi_file` | "MIDI" |
| `soprano_voice` | "Soprano" |
| `alto_voice` | "Alto" |
| `tenor_voice` | "Tenor" |
| `bass_voice` | "Bajo" |

### Empty States

| Context | Text |
|---------|------|
| No search results | "No se encontraron himnos. Intenta con otro termino de busqueda." |
| No hymns selected (panel) | "Aun no has seleccionado himnos. Busca y agrega himnos desde los resultados." |
| Initial search (before typing) | "Escribe el numero o nombre de un himno para comenzar." |
| Hymn has no audio | "Sin pistas disponibles" (muted text, no accordion) |

### Error States

| Context | Text | Action |
|---------|------|--------|
| Search fetch error | "Error al buscar. Intenta de nuevo." | Inline below search input |
| Package generation error | "Error al generar el paquete. Intenta de nuevo." | Sonner toast with "Reintentar" button |
| Network failure | "Sin conexion. Verifica tu internet e intenta de nuevo." | Sonner toast |

### Destructive Actions

| Action | Confirmation Approach |
|--------|----------------------|
| Remove single hymn ("Quitar") | No confirmation. Instant remove. User can re-add immediately. |
| "Crear otro paquete" (reset wizard) | No confirmation modal. The action is low-stakes since the download already completed. |

No destructive actions in this phase require confirmation dialogs.

## 10. Loading States

| Context | Skeleton/Indicator |
|---------|-------------------|
| Search results loading | 3 skeleton cards: `div.animate-pulse` with `bg-muted rounded-md h-14` stacked with `gap-2` |
| Hymnal/category dropdowns loading | Select shows "Cargando..." as placeholder, `disabled` |
| ZIP generation in progress | `Progress` component with `animate-pulse` on the indicator bar. Button shows "Generando..." |

## 11. Step Transitions

Use Framer Motion `AnimatePresence` + `motion.div` for step transitions.

| Transition | Animation |
|------------|-----------|
| Forward (Step N to N+1) | Slide left: `initial={{ x: 20, opacity: 0 }}` `animate={{ x: 0, opacity: 1 }}` `exit={{ x: -20, opacity: 0 }}` duration 200ms |
| Backward (Step N to N-1) | Slide right: `initial={{ x: -20, opacity: 0 }}` `animate={{ x: 0, opacity: 1 }}` `exit={{ x: 20, opacity: 0 }}` duration 200ms |

Keep `mode="wait"` on `AnimatePresence` to prevent layout overlap.

## 12. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All shadcn components have built-in keyboard support. Tab order: stepper -> filters -> search -> results -> navigation buttons |
| Focus management | On step change, focus moves to the step heading (use `ref` + `focus()` after transition) |
| ARIA labels | Search input: `aria-label="Buscar himnos"`. Selected panel: `aria-label="Himnos seleccionados"`. Stepper: `role="navigation" aria-label="Pasos del empaquetador"` |
| Screen reader | Step circles: `aria-current="step"` on active. Completed: `aria-label="Paso 1 completado"` |
| Color contrast | All shadcn tokens pass WCAG AA by default (slate + indigo palette verified) |
| Reduced motion | Wrap Framer Motion with `useReducedMotion()` hook; disable animations if true |

## 13. Mobile Bottom Sheet (Selected Hymns)

On viewports below `lg` (1024px), the selected hymns panel becomes a `Drawer` (vaul) triggered by a sticky bottom bar.

| Property | Value |
|----------|-------|
| Trigger bar | `fixed bottom-0 left-0 right-0 h-14 bg-card border-t shadow-lg z-40` |
| Trigger text | "Seleccionados ({count})" with `Badge` showing count |
| Drawer height | `snap-points={[0.5, 0.85]}` — half screen default, pull up for full |
| Drawer content | Same `SelectedHymnChip` list as desktop sidebar |
| Visibility | Only visible when `selectedHymns.length > 0` |

## 14. Summary Card (Step 3)

Before the "Generar Paquete" button, display a summary card.

| Field | Format |
|-------|--------|
| Hymns count | "{N} himno(s)" |
| Layout | "1 por pagina" or "2 por pagina" |
| Style | "Decorado" or "Plano" |
| Audio tracks | "{N} pista(s) de audio" (sum of all selected tracks across hymns) |
| No audio selected | "Sin pistas de audio" |

Card uses `bg-card p-4 rounded-lg` with items separated by `Separator`.

## 15. State Shape Reference

For planner/executor alignment with D-20/D-21:

```typescript
interface WizardState {
  step: 1 | 2 | 3;
  selectedHymns: HymnSearchResult[];
  layout: 'one-per-page' | 'two-per-page';
  style: 'decorated' | 'plain';
  audioSelections: Map<string, Set<string>>; // hymnId -> Set<audioFieldName>
  isGenerating: boolean;
  error: string | null;
}
```

Default values: `step: 1`, `layout: 'one-per-page'`, `style: 'decorated'`, `audioSelections: new Map()`, `isGenerating: false`, `error: null`.

## 16. Registry

| Registry | Status |
|----------|--------|
| shadcn/ui official | 49 components installed. No new installs needed. |
| Third-party registries | None declared. |

---

*UI-SPEC created: 2026-03-29*
*Sources: CONTEXT.md (21 decisions), REQUIREMENTS.md (13 phase requirements), components.json, globals.css, tailwind.config.ts*
