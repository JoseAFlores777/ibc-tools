---
status: draft
phase: 5
phase_name: "Impresion de Himnos — Hoja Simple, Booklet, Orientacion/Fuente/Formato/Versiculo"
design_system: shadcn (slate base, indigo primary, CSS variables)
created: "2026-03-30"
---

# UI-SPEC: Phase 5 — Impresion de Himnos

## Scope

This phase modifies **Step 2 (StepConfiguracion)** of the existing empaquetador wizard to add four new control groups: print mode selector, page orientation selector, font preset selector, and bible reference toggle. It also adds a contextual warning for large booklets. No new pages or routes are created. The PDF output changes are server-side only and do not affect the web UI design contract beyond Step 2.

Primary visual anchor: "Modo de Impresion" selector -- positioned first in the left column; its selection state drives conditional visibility of all other controls.

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | shadcn/ui (Radix + Tailwind) | components.json |
| Base color | Slate | globals.css |
| Primary | Indigo-900 `hsl(242.2 47.4% 34.3%)` | globals.css `--primary` |
| Border radius | 0.5rem (`--radius`) | globals.css |
| CSS variables | Yes | components.json |
| Dark mode | Class-based | tailwind.config.ts |

### Registry

| Source | Safety Gate |
|--------|-------------|
| shadcn/ui official | Trusted — already installed |
| Third-party registries | None |

## Spacing

8-point scale. All spacing values in the web UI use Tailwind utilities mapped to multiples of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| `gap-2` | 8px | Inline icon + label pairs |
| `gap-4` | 16px | Grid gap between selector cards |
| `mb-4` | 16px | Section label to control spacing |
| `space-y-6` | 24px | Between control groups within a Card |
| `gap-6` | 24px | Between left and right columns (existing) |
| `py-8` | 32px | Page top/bottom padding (existing) |
| `mb-8` | 32px | Header to content (existing) |

### Named Exceptions

| Token | Value | Justification |
|-------|-------|---------------|
| `min-h-[48px]` | 48px | Touch target minimum for all interactive controls — WCAG 2.5.5 accessible target size, using standard-set 48px instead of 44px |

## Typography (Web UI)

All typography uses the project's `--font-sans` variable (system sans-serif stack). These values apply to the wizard web UI only, not to PDF output.

| Role | Size | Weight | Line-height | Tailwind class |
|------|------|--------|-------------|----------------|
| Section heading | 24px | 600 (semibold) | 1.33 | `text-2xl font-semibold` |
| Card title | 16px | 600 (semibold) | 1.5 | `text-base font-semibold` (override CardTitle default) |
| Section label | 12px | 600 (semibold) | 1.5 | `text-xs font-semibold tracking-wide uppercase` |
| Control label | 14px | 400 (regular) | 1.43 | `text-sm` |
| Description/warning text | 12px | 400 (regular) | 1.5 | `text-xs text-slate-500` |

Font weights used: 400 (regular) and 600 (semibold). These are the only two weights permitted in the web UI for this phase. Where shadcn CardTitle defaults to `font-medium` (500) or `font-bold` (700), override explicitly with `font-semibold` (600) or remove the weight class to fall back to 400.

## Typography (PDF Output)

Font presets for PDF rendering. These are defined in `pdf-tokens.ts` and consumed by PDF page components.

### Font Preset: Clasica (default)

| Role | Font | Size (1-up) | Size (booklet) |
|------|------|-------------|----------------|
| Display (hymn title) | Adamina | 24pt | 18pt |
| Heading (hymn number) | Adamina | 15pt | 12pt |
| Label (hymnal, bible ref, footer) | Adamina | 10pt | 9pt |
| Body (verse marker, lyric line) | Adamina | 9pt | 8pt |

### Font Preset: Moderna

| Role | Font | Size (1-up) | Size (booklet) |
|------|------|-------------|----------------|
| Display | Helvetica | 22pt | 16pt |
| Heading | Helvetica | 14pt | 11pt |
| Label | Helvetica | 10pt | 9pt |
| Body | Helvetica | 9pt | 8pt |

### Font Preset: Legible

| Role | Font | Size (1-up) | Size (booklet) |
|------|------|-------------|----------------|
| Display | Helvetica | 28pt | 22pt |
| Heading | Helvetica | 18pt | 14pt |
| Label | Helvetica | 12pt | 10pt |
| Body | Helvetica | 12pt | 10pt |

**Note:** For decorated style, header/footer branding elements (church name, logo) always use Adamina regardless of font preset selection. The font preset affects lyric body, verse markers, hymn title, and hymn number.

## Color

The web UI uses the existing shadcn/CSS variable palette. No new colors are introduced.

### 60/30/10 Split

| Layer | Color | CSS Variable | Usage |
|-------|-------|-------------|-------|
| 60% Dominant | Slate-100 | `--background` | Page background |
| 30% Secondary | Slate-200 / White | `--card` | Card surfaces, control backgrounds |
| 10% Accent | Indigo-900 | `--primary` | Selected state borders, active control highlights, icons in active state |

### Accent Reserved For

- Selected control border (`border-primary`)
- Selected control background tint (`bg-primary/5`)
- Active icon color (`text-primary`)
- CTA buttons (existing "Generar y Descargar" in Step 3)

### Semantic Colors

| Color | Usage |
|-------|-------|
| `--destructive` (red-600) | Not used in this phase (no destructive actions) |
| Amber-600 (`text-amber-600`) | Booklet page count warning |
| Amber-50 (`bg-amber-50`) | Warning background |
| Amber-200 (`border-amber-200`) | Warning border |

### PDF Colors (existing, no changes)

| Token | Hex | Usage |
|-------|-----|-------|
| `headerBg` | `#393572` | Decorated header background |
| `goldAccent` | `#9e7f19` | Decorated accent lines |
| `pageBg` | `#f7f7f7` | Page background |
| `bodyText` | `#444444` | Lyric text |
| `divider` | `#cccccc` | 2-per-page divider |

## Component Inventory

### New Components (Web UI)

None. All new controls are added inline to the existing `StepConfiguracion.tsx` component using existing shadcn primitives.

### Existing Components Used

| Component | From | Usage in this phase |
|-----------|------|---------------------|
| `Card`, `CardHeader`, `CardTitle`, `CardContent` | shadcn/ui | Existing print settings card (left column) |
| `Label` | shadcn/ui | Section labels for new control groups |
| `Separator` | shadcn/ui | Dividers between control groups |
| `Switch` | shadcn/ui | Bible reference toggle |
| `Badge` | shadcn/ui | Existing audio count badge |
| Custom selector buttons | Inline (existing pattern) | Print mode, orientation, font preset selectors |

### New Components (PDF)

| Component | File | Purpose |
|-----------|------|---------|
| `HymnPageBooklet` | `pdf-pages/HymnPageBooklet.tsx` | Half-letter content page for booklet (396x612pt) |
| `BookletSheet` | `pdf-pages/BookletSheet.tsx` | Landscape Letter page with two booklet page slots |

### Selector Button Pattern

All selector buttons in Step 2 follow the existing established pattern. This is the interaction contract for the new selectors:

```
Unselected:  border-slate-200 hover:border-slate-300 text-slate-600
Selected:    border-primary bg-primary/5 text-primary
```

Selector buttons use `<button type="button">` with `cn()` for conditional classes. Minimum height: `min-h-[48px]`. All selectors use the icon-above-label layout for card-style selectors (print mode, orientation) or icon-left-label layout for list-style selectors (font preset).

## Layout Contract: Step 2 (StepConfiguracion)

### Structure

The existing 2-column grid (`grid-cols-1 lg:grid-cols-2`) is preserved. The left column ("Ajustes de Impresion") grows to accommodate new controls. The right column ("Seleccion de Audios") is unchanged.

### Left Column Control Order (top to bottom)

1. **Modo de Impresion** (NEW) -- 2-option card selector: "Hoja Simple" | "Booklet"
2. `<Separator />`
3. **Diseno de Pagina** (EXISTING) -- 2-option card selector: "1 Himno" | "2 Himnos"
   - When `printMode === 'booklet'`: this section is hidden (booklet uses 1 hymn per booklet page always)
4. `<Separator />`
5. **Orientacion** (NEW) -- 2-option card selector: "Vertical" | "Horizontal"
   - When `printMode === 'booklet'`: this section is hidden (booklet manages orientation internally)
6. `<Separator />`
7. **Estilo Visual** (EXISTING) -- 2-option list selector: "Diseno Institucional (IBC)" | "Texto Simple"
8. `<Separator />`
9. **Fuente** (NEW) -- 3-option list selector: "Clasica" | "Moderna" | "Legible"
10. `<Separator />`
11. **Referencia Biblica** (NEW) -- Switch toggle with label
12. **Booklet Warning** (NEW, conditional) -- Amber warning when `printMode === 'booklet'` AND selected hymns > 40

### Conditional Visibility Rules

| Control | When `printMode === 'simple'` | When `printMode === 'booklet'` |
|---------|-------------------------------|-------------------------------|
| Diseno de Pagina | Visible | Hidden |
| Orientacion | Visible | Hidden |
| Estilo Visual | Visible | Visible |
| Fuente | Visible | Visible |
| Referencia Biblica | Visible | Visible |
| Booklet Warning | Hidden | Visible if hymns > 40 |

When a section is hidden, it collapses completely (not rendered in DOM). No empty space remains.

## Copywriting Contract

All UI text is in Spanish. Exact copy for each new element:

### Print Mode Selector

| Element | Copy |
|---------|------|
| Section label | `MODO DE IMPRESION` |
| Option 1 label | `Hoja Simple` |
| Option 1 description | (none -- icon + label only) |
| Option 2 label | `Booklet` |
| Option 2 description | (none -- icon + label only) |

**Icons:** Hoja Simple = `FileText` (lucide). Booklet = `BookOpen` (lucide).

### Orientation Selector

| Element | Copy |
|---------|------|
| Section label | `ORIENTACION` |
| Option 1 label | `Vertical` |
| Option 2 label | `Horizontal` |

**Icons:** Vertical = `Smartphone` (lucide, rotated 0deg). Horizontal = `Smartphone` (lucide, rotated 90deg via `className="rotate-90"`).

### Font Preset Selector

| Element | Copy |
|---------|------|
| Section label | `FUENTE` |
| Option 1 label | `Clasica` |
| Option 1 description | `Tipografia serif elegante (Adamina)` |
| Option 2 label | `Moderna` |
| Option 2 description | `Tipografia sans-serif limpia (Helvetica)` |
| Option 3 label | `Legible` |
| Option 3 description | `Tamano grande para lectura facil` |

**Icons:** Clasica = `Type` (lucide). Moderna = `ALargeSmall` (lucide). Legible = `ZoomIn` (lucide).

Font preset uses the list-style selector pattern (icon left, label + description right), same as the existing "Estilo Visual" selectors.

### Bible Reference Toggle

| Element | Copy |
|---------|------|
| Label | `Incluir referencia biblica` |
| Description | `Muestra el texto y cita biblica en el PDF` |

Uses shadcn `Switch` component with `Label`. Layout: switch on left, label + description on right. Wrapped in a flex row with `items-center gap-2`.

### Booklet Warning

| Element | Copy |
|---------|------|
| Warning text | `Los booklets con mas de 40 paginas son dificiles de engrapar. Considere dividir en varios paquetes.` |

Rendered as a `<div>` with `rounded-lg border border-amber-200 bg-amber-50 p-4` containing a `<p>` with `text-xs text-amber-600`. Prefixed with `AlertTriangle` icon (lucide, `h-4 w-4 text-amber-500`).

### Print Instructions (in-app, shown when booklet selected)

| Element | Copy |
|---------|------|
| Instruction text | `Para imprimir: seleccione "Ambos lados" y "Voltear en borde corto". Engrapadora al centro.` |

Rendered below the print mode selector as a `<p>` with `text-xs text-slate-500 mt-2`. Only visible when `printMode === 'booklet'`.

### Empty State

Not applicable. Step 2 always has controls pre-populated with defaults. There is no empty state for configuration.

### Error State

Not applicable for Step 2. Errors occur in Step 3 (download) which is not modified in this phase. The existing error handling in Step 3 is unchanged.

## Interaction Contract

### Default State (initial load of Step 2)

| Field | Default Value | Source |
|-------|---------------|--------|
| printMode | `'simple'` | D-03 |
| layout | `'one-per-page'` | Existing |
| orientation | `'portrait'` | D-04 |
| style | `'decorated'` | Existing |
| fontPreset | `'clasica'` | D-06 |
| includeBibleRef | `true` | D-09 |

### State Transitions

| Trigger | Action | Side Effects |
|---------|--------|-------------|
| Select "Booklet" | `SET_PRINT_MODE` -> `'booklet'` | Hides "Diseno de Pagina" and "Orientacion" sections. Shows booklet instruction text. Shows warning if hymns > 40. |
| Select "Hoja Simple" | `SET_PRINT_MODE` -> `'simple'` | Shows "Diseno de Pagina" and "Orientacion" sections. Hides booklet instruction and warning. |
| Select "Vertical" | `SET_ORIENTATION` -> `'portrait'` | None |
| Select "Horizontal" | `SET_ORIENTATION` -> `'landscape'` | None |
| Select font preset | `SET_FONT_PRESET` -> preset value | None |
| Toggle bible ref | `SET_INCLUDE_BIBLE_REF` -> boolean | None |

### Animations

- Section show/hide: No animation. Immediate mount/unmount via conditional rendering. Keeps implementation simple and avoids layout shift complexity.
- Selector state change: `transition-all` on border and background (existing pattern, ~150ms).

### Keyboard Accessibility

- All selector buttons are native `<button>` elements with visible focus ring (`ring` via shadcn defaults).
- Switch component has built-in keyboard support (Space to toggle).
- Tab order follows visual order (top to bottom, left column then right column).

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| < 1024px (mobile/tablet) | Single column. Left card stacks above right card. |
| >= 1024px (desktop) | Two-column grid (`lg:grid-cols-2`). |

Selector card grids within sections use `grid-cols-2` at all breakpoints (print mode, orientation, layout). Font preset list uses full-width stacked buttons at all breakpoints.

No horizontal scroll. All controls fit within the card width at 320px minimum viewport.

## PDF Output Layout Contract

### Simple Mode - Portrait (existing, unchanged)

- Page: 612 x 792pt (Letter portrait)
- Margins: 40pt (1-per-page), 20pt (2-per-page)

### Simple Mode - Landscape (NEW)

- Page: 792 x 612pt (Letter landscape)
- Margins: 40pt (1-per-page), 20pt (2-per-page)
- Content reflows to wider, shorter area

### Booklet Mode (NEW)

- Physical sheet: 792 x 612pt (Letter landscape)
- Each booklet page: 396 x 612pt (half of landscape width)
- Booklet page margins: 20pt all sides
- Usable area per booklet page: 356 x 572pt
- Pages rendered in saddle-stitch imposition order
- Blank pages inserted to pad to multiple of 4

### Bible Reference Section

- When `includeBibleRef === true`: Renders bible text and reference below hymn header (existing behavior)
- When `includeBibleRef === false`: Section not rendered. Space reclaims via flexbox collapse.

## Destructive Actions

None in this phase. All controls are configuration toggles with no data loss implications. No confirmation dialogs needed.

---

*Phase: 05 -- Impresion de Himnos*
*Created: 2026-03-30*
*Status: draft*
