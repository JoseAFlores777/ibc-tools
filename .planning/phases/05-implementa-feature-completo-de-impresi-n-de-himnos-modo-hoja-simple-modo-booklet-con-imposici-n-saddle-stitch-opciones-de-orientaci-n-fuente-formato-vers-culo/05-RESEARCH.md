# Phase 5: Impresion de Himnos — Hoja Simple, Booklet, Orientacion/Fuente/Formato/Versiculo - Research

**Researched:** 2026-03-30
**Domain:** PDF generation, saddle-stitch booklet imposition, @react-pdf/renderer page layout
**Confidence:** HIGH

## Summary

This phase extends the existing hymn PDF generation pipeline with two print modes (simple sheet and booklet), font presets, orientation options, and a bible reference toggle. The existing architecture in `render-hymn-pdf.ts` uses dynamic imports for page components and `pdf-tokens.ts` for design tokens — both patterns extend cleanly for new combinations.

The core technical challenge is **saddle-stitch imposition**: reordering pages so a landscape Letter sheet, printed duplex and folded in half, produces a booklet with pages in reading order. The algorithm is well-defined (pair pages from outside-in: last+first on front of sheet 1, second+second-to-last on back, etc.) and can be implemented as a pure function that takes N content pages and returns an array of sheet-side pairs. `@react-pdf/renderer` v4.3.2 (already installed) supports landscape orientation, custom page sizes via arrays, and all needed layout primitives.

**Primary recommendation:** Implement booklet imposition as a pure `computeImposition(totalPages)` function in a new `app/lib/pdf/imposition.ts` module, extend `renderHymnPdf()` with new options, add font preset tokens to `pdf-tokens.ts`, and update the wizard UI in Step 2 with new controls.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Booklet automatico completo — el sistema calcula la imposicion automaticamente: reordena paginas en orden saddle-stitch, inserta paginas en blanco si el total no es multiplo de 4, genera PDF listo para imprimir en duplex. El usuario solo elige "Booklet" y listo.
- **D-02:** Solo papel Carta (8.5x11") para booklet. Cada hoja se dobla a la mitad, resultando en paginas de 5.5x8.5". No ofrecer otros tamanos para booklet.
- **D-03:** Nuevo selector "Modo de Impresion" en Step 2 del wizard: Hoja Simple (comportamiento actual) | Booklet. Si elige Booklet, las opciones de layout se adaptan al contexto de cuadernillo (1 himno por pagina booklet = media carta doblada).
- **D-04:** Opciones de orientacion para modo Hoja Simple: Vertical (portrait, default) y Horizontal (landscape). El modo Booklet maneja orientacion internamente (landscape para imposicion).
- **D-05:** Solo papel Carta (Letter 8.5x11") como formato. No ofrecer Media Carta ni A4.
- **D-06:** Presets de fuente por estilo, no selector libre. Tres presets: "Clasica" (Adamina serif, tamano estandar actual), "Moderna" (Helvetica sans-serif, tamano estandar), "Legible" (Helvetica sans-serif, tamano grande para lectura facil). Cada preset define font family + escalas de tamano.
- **D-07:** No agregar fuentes adicionales mas alla de Adamina y Helvetica (ya registradas).
- **D-08:** Todos los versos del himno se imprimen siempre. No hay seleccion de versos.
- **D-09:** Referencia biblica (bible_text + bible_reference) con toggle incluir/excluir en Step 2. Default: incluida.

### Claude's Discretion
- Algoritmo exacto de imposicion saddle-stitch (orden de paginas para el PDF booklet)
- Como adaptar los componentes PDF existentes para booklet vs crear nuevos
- Tamanos de fuente exactos para cada preset (Clasica, Moderna, Legible)
- Como escalar los tokens de diseno de pdf-tokens.ts para las nuevas combinaciones
- Layout del Step 2 actualizado — ubicacion de los nuevos controles
- Como manejar himnos largos que no caben en una pagina booklet (tamano reducido)
- Instrucciones de impresion para el usuario
- Extensiones al schema de PackageRequest y WizardState

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

## Project Constraints (from CLAUDE.md)

- **Tech stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind, shadcn/ui
- **PDF engine:** `@react-pdf/renderer` (v4.3.2 installed with --legacy-peer-deps)
- **ZIP generation:** Server-side via API route
- **Backend:** Directus CMS — no schema modifications, consume only
- **UI language:** Spanish
- **Naming:** PascalCase components, camelCase functions, kebab-case routes
- **Imports:** Use `@/*` and `@/lib/*` aliases, no relative path crawling
- **Module exports:** Default exports for React components, named exports for utilities
- **Server-first:** RSC by default, `'use client'` only when needed
- **Error handling:** try-catch with `console.error()` including context

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-pdf/renderer | 4.3.2 | PDF generation from React components | Already in use, supports landscape, custom sizes, all needed primitives |
| zod | 3.23.8 | Schema validation for PackageRequest | Already in use for zip.schema.ts |
| react-hook-form | 7.52.2 | Form state (if needed for toggle) | Already in use, but wizard uses useReducer |
| lucide-react | 0.429.0 | Icons for UI controls | Already in use in StepConfiguracion |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui (Radix) | latest | Radio groups, switches, cards for Step 2 UI | All new wizard controls |
| tailwind-merge | 2.5.2 | Class merging via cn() | Conditional styling in Step 2 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom imposition logic | pdf-lib for post-render page manipulation | Adds dependency; @react-pdf can handle it natively by rendering pages in imposition order |

**No new dependencies needed.** All required functionality is available in the existing stack.

## Architecture Patterns

### Recommended Module Structure
```
app/
  lib/pdf/
    imposition.ts          # NEW: computeImposition() pure function
    render-hymn-pdf.ts     # MODIFY: accept new options, booklet rendering path
  components/pdf-components/
    shared/
      pdf-tokens.ts        # MODIFY: add font presets, booklet dimensions
      pdf-fonts.ts         # NO CHANGE (Adamina + built-in Helvetica)
    pdf-pages/
      HymnPageBooklet.tsx  # NEW: half-letter page for booklet content
      BookletSheet.tsx     # NEW: landscape letter page with 2 booklet pages side-by-side
  empaquetador/
    hooks/useWizardReducer.ts  # MODIFY: new state fields + actions
    components/StepConfiguracion.tsx  # MODIFY: new controls
    lib/buildPackageRequest.ts  # MODIFY: map new fields to request
  lib/zip/
    zip.schema.ts          # MODIFY: extend schema
```

### Pattern 1: Saddle-Stitch Imposition Algorithm
**What:** Pure function that maps N logical pages to physical sheet positions for center-fold booklet binding.
**When to use:** When printMode is 'booklet' in renderHymnPdf.

**Algorithm:**
1. Pad total content pages to next multiple of 4 (insert blank pages at end)
2. Total sheets = totalPages / 4 (each physical sheet has 4 page slots: front-left, front-right, back-left, back-right)
3. For a booklet with N pages (after padding):
   - Sheet 1 front: page N (left), page 1 (right)
   - Sheet 1 back: page 2 (left), page N-1 (right)
   - Sheet 2 front: page N-2 (left), page 3 (right)
   - Sheet 2 back: page 4 (left), page N-3 (right)
   - Continue until all pages assigned

**Generalized formula:**
```typescript
interface SheetSide {
  left: number;  // 1-based page number, 0 = blank
  right: number;
}

interface Sheet {
  front: SheetSide;
  back: SheetSide;
}

function computeImposition(totalContentPages: number): Sheet[] {
  // Pad to multiple of 4
  const totalPages = Math.ceil(totalContentPages / 4) * 4;
  const sheets: Sheet[] = [];
  const numSheets = totalPages / 4;

  for (let i = 0; i < numSheets; i++) {
    const frontLeft = totalPages - (2 * i);
    const frontRight = (2 * i) + 1;
    const backLeft = (2 * i) + 2;
    const backRight = totalPages - (2 * i) - 1;

    sheets.push({
      front: {
        left: frontLeft > totalContentPages ? 0 : frontLeft,
        right: frontRight > totalContentPages ? 0 : frontRight,
      },
      back: {
        left: backLeft > totalContentPages ? 0 : backLeft,
        right: backRight > totalContentPages ? 0 : backRight,
      },
    });
  }

  return sheets;
}
```

**Example for 8 pages (2 sheets):**
- Sheet 1 front: [8, 1] — Sheet 1 back: [2, 7]
- Sheet 2 front: [6, 3] — Sheet 2 back: [4, 5]

**Example for 3 content pages (padded to 4, 1 sheet):**
- Sheet 1 front: [4(blank), 1] — Sheet 1 back: [2, 3]

### Pattern 2: Booklet Page Rendering with @react-pdf/renderer
**What:** Each physical sheet is a landscape Letter page. Each side has two half-letter content areas (left and right) rendered side-by-side.
**When to use:** For booklet mode PDF generation.

**Key dimensions:**
- Physical sheet: Landscape Letter = 792 x 612 points (width x height)
- Each booklet page: 396 x 612 points (half of landscape width x full height)
- With margins: ~376 x 572 points usable per booklet page

```typescript
// In pdf-tokens.ts
export const BOOKLET_SHEET_WIDTH = 792;  // Landscape letter width
export const BOOKLET_SHEET_HEIGHT = 612; // Landscape letter height
export const BOOKLET_PAGE_WIDTH = 396;   // Half of landscape width
export const BOOKLET_MARGIN = 20;

// Page component usage
<Page size="LETTER" orientation="landscape" style={styles.sheet}>
  <View style={{ flexDirection: 'row', flex: 1 }}>
    <View style={{ width: 396 }}>{/* Left booklet page content */}</View>
    <View style={{ width: 396 }}>{/* Right booklet page content */}</View>
  </View>
</Page>
```

### Pattern 3: Font Preset System
**What:** Named presets that map to font family + size scale tokens.
**When to use:** All PDF rendering paths.

```typescript
// In pdf-tokens.ts
export type FontPreset = 'clasica' | 'moderna' | 'legible';

export const FONT_PRESETS: Record<FontPreset, {
  family: string;
  scale: {
    display: number;    // Hymn title
    heading: number;    // Hymn number
    label: number;      // Hymnal name, bible text, footer
    body: number;       // Verse marker, lyric line
  };
}> = {
  clasica: {
    family: 'Adamina',
    scale: { display: 24, heading: 15, label: 10, body: 9 },
  },
  moderna: {
    family: 'Helvetica',
    scale: { display: 22, heading: 14, label: 10, body: 9 },
  },
  legible: {
    family: 'Helvetica',
    scale: { display: 28, heading: 18, label: 12, body: 12 },
  },
};

// Booklet variants (smaller to fit half-letter)
export const FONT_PRESETS_BOOKLET: Record<FontPreset, {
  family: string;
  scale: {
    display: number;
    heading: number;
    label: number;
    body: number;
  };
}> = {
  clasica: {
    family: 'Adamina',
    scale: { display: 18, heading: 12, label: 9, body: 8 },
  },
  moderna: {
    family: 'Helvetica',
    scale: { display: 16, heading: 11, label: 9, body: 8 },
  },
  legible: {
    family: 'Helvetica',
    scale: { display: 22, heading: 14, label: 10, body: 10 },
  },
};
```

### Pattern 4: Extended RenderHymnPdfOptions
**What:** New options for the render pipeline.

```typescript
export type PrintMode = 'simple' | 'booklet';
export type Orientation = 'portrait' | 'landscape';
export type FontPreset = 'clasica' | 'moderna' | 'legible';

export interface RenderHymnPdfOptions {
  hymns: HymnForPdf[];
  layout: PdfLayout;         // existing: 'one-per-page' | 'two-per-page'
  style: PdfStyle;           // existing: 'decorated' | 'plain'
  printMode?: PrintMode;     // NEW, default 'simple'
  orientation?: Orientation; // NEW, default 'portrait' (only for simple mode)
  fontPreset?: FontPreset;   // NEW, default 'clasica'
  includeBibleRef?: boolean; // NEW, default true
}
```

### Pattern 5: WizardState Extension
**What:** New fields in wizard state and corresponding actions.

```typescript
export interface WizardState {
  step: 1 | 2 | 3;
  selectedHymns: HymnSearchResult[];
  layout: 'one-per-page' | 'two-per-page';
  style: 'decorated' | 'plain';
  printMode: 'simple' | 'booklet';           // NEW
  orientation: 'portrait' | 'landscape';      // NEW
  fontPreset: 'clasica' | 'moderna' | 'legible'; // NEW
  includeBibleRef: boolean;                   // NEW
  audioSelections: Map<string, Set<string>>;
  isGenerating: boolean;
  error: string | null;
}

// New actions
| { type: 'SET_PRINT_MODE'; printMode: 'simple' | 'booklet' }
| { type: 'SET_ORIENTATION'; orientation: 'portrait' | 'landscape' }
| { type: 'SET_FONT_PRESET'; fontPreset: 'clasica' | 'moderna' | 'legible' }
| { type: 'SET_INCLUDE_BIBLE_REF'; includeBibleRef: boolean }
```

### Pattern 6: PackageRequest Schema Extension
**What:** Zod schema with new optional fields for backward compatibility.

```typescript
export const packageRequestSchema = z.object({
  hymns: z.array(z.object({
    id: z.string().uuid(),
    audioFiles: z.array(z.enum([...])).optional().default([]),
  })).min(1).max(50),
  layout: z.enum(['one-per-page', 'two-per-page']),
  style: z.enum(['decorated', 'plain']),
  printMode: z.enum(['simple', 'booklet']).optional().default('simple'),
  orientation: z.enum(['portrait', 'landscape']).optional().default('portrait'),
  fontPreset: z.enum(['clasica', 'moderna', 'legible']).optional().default('clasica'),
  includeBibleRef: z.boolean().optional().default(true),
});
```

### Anti-Patterns to Avoid
- **Post-render page manipulation:** Do NOT generate a portrait PDF first and then try to rearrange pages. Instead, render content in imposition order directly. @react-pdf/renderer does not support page reordering after render.
- **Separate font registration per preset:** Adamina is already registered. Helvetica is a built-in PDF font, no registration needed. Do not re-register fonts per render call.
- **Hardcoding font sizes in components:** Use the token system in pdf-tokens.ts. Components should receive a font preset and look up sizes from the token map.
- **Complex conditional rendering in existing components:** Create new booklet-specific page components rather than bloating HymnPageDecorated/HymnPagePlain with booklet conditionals.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF page layout | Custom canvas drawing | @react-pdf/renderer Page + View | Already proven in codebase, handles text wrapping, pagination |
| Font metrics | Manual text measurement | @react-pdf/renderer's built-in text layout | Handles line breaks, font metrics automatically |
| Page size presets | Magic numbers scattered in code | LETTER_WIDTH/HEIGHT constants in pdf-tokens.ts | Centralized, consistent |

## Common Pitfalls

### Pitfall 1: Booklet Page Order Off-By-One
**What goes wrong:** Pages end up in wrong order when folded because the imposition algorithm indexes from 0 instead of 1, or front/back sides are swapped.
**Why it happens:** The algorithm is conceptually simple but the indexing is subtle — front of sheet has pages in reverse reading order (right page reads first).
**How to avoid:** Write unit tests for computeImposition() with known inputs: 4 pages (1 sheet), 8 pages (2 sheets), 3 pages (padded to 4). Verify against manual calculation.
**Warning signs:** Test with a physical print — fold the paper and check page sequence.

### Pitfall 2: Landscape Booklet Content Upside Down
**What goes wrong:** When printing duplex, the back side content appears upside down relative to the front.
**Why it happens:** Duplex printers flip on short edge or long edge. Booklet printing requires short-edge flip.
**How to avoid:** Add user instructions: "Imprimir en ambos lados, voltear en borde corto" (Print on both sides, flip on short edge). Also ensure back-side pages are NOT rotated in the PDF — the printer handles the flip.
**Warning signs:** Back pages appear upside down when folded.

### Pitfall 3: Bible Reference Conditional Breaks Layout
**What goes wrong:** Removing bible reference creates excessive whitespace in the header area for decorated style.
**Why it happens:** The bible section takes significant vertical space in HymnPageDecorated header. When removed, the layout doesn't collapse gracefully.
**How to avoid:** Pass `includeBibleRef` as a prop. When false, simply don't render the `bibleSection` View. @react-pdf/renderer handles flexbox collapse automatically — missing children means the space is reclaimed.
**Warning signs:** Large empty gap between header and body when bible ref is off.

### Pitfall 4: Font Preset Changes Break Existing Styles
**What goes wrong:** Changing font family in decorated style breaks the visual design (Adamina is integral to the IBC brand look).
**Why it happens:** Decorated style was designed specifically for Adamina. Helvetica has different metrics and feel.
**How to avoid:** For decorated style, the font preset only affects body/verse text sizes, NOT the header/footer branding. The "Moderna" and "Legible" presets primarily change the lyric font and size. Alternatively, make decorated style always use Adamina and only apply font preset to plain style. Recommend: font preset affects both styles but header branding elements always use Adamina for decorated.
**Warning signs:** Decorated headers look wrong with Helvetica.

### Pitfall 5: Booklet Mode with Many Hymns Creates Too Many Sheets
**What goes wrong:** 50 hymns = 50 booklet pages = 13 sheets = 52-page booklet. Saddle-stitch binding becomes impractical above ~20 sheets.
**How to avoid:** Add a soft warning in the UI when booklet mode is selected with many hymns: "Los booklets con mas de 40 paginas son dificiles de engrapar. Considere dividir en varios booklets." This is a UX concern, not a hard limit.
**Warning signs:** Booklet with > 80 pages won't fold properly.

## Code Examples

### Imposition Function (pure, testable)
```typescript
// app/lib/pdf/imposition.ts
export interface SheetSide {
  left: number;   // 1-based page index, 0 = blank
  right: number;
}

export interface ImpositionSheet {
  front: SheetSide;
  back: SheetSide;
}

/**
 * Computes saddle-stitch imposition order for a booklet.
 * @param totalContentPages Number of actual content pages
 * @returns Array of sheets with front/back page assignments
 */
export function computeImposition(totalContentPages: number): ImpositionSheet[] {
  if (totalContentPages <= 0) return [];

  const totalPages = Math.ceil(totalContentPages / 4) * 4;
  const numSheets = totalPages / 4;
  const sheets: ImpositionSheet[] = [];

  for (let i = 0; i < numSheets; i++) {
    const frontLeft = totalPages - (2 * i);
    const frontRight = (2 * i) + 1;
    const backLeft = (2 * i) + 2;
    const backRight = totalPages - (2 * i) - 1;

    sheets.push({
      front: {
        left: frontLeft > totalContentPages ? 0 : frontLeft,
        right: frontRight > totalContentPages ? 0 : frontRight,
      },
      back: {
        left: backLeft > totalContentPages ? 0 : backLeft,
        right: backRight > totalContentPages ? 0 : backRight,
      },
    });
  }

  return sheets;
}
```

### Booklet Sheet Component
```typescript
// BookletSheet.tsx — landscape Letter page with two booklet page slots
<Page size="LETTER" orientation="landscape" style={sheetStyles.page}>
  <View style={sheetStyles.container}>
    <View style={sheetStyles.leftPage}>
      {leftContent ? (
        <BookletPageContent hymn={leftContent.hymn} verses={leftContent.verses} fontPreset={fontPreset} />
      ) : (
        <View /> {/* blank page */}
      )}
    </View>
    <View style={sheetStyles.rightPage}>
      {rightContent ? (
        <BookletPageContent hymn={rightContent.hymn} verses={rightContent.verses} fontPreset={fontPreset} />
      ) : (
        <View />
      )}
    </View>
  </View>
</Page>
```

### Render Pipeline Extension
```typescript
// In render-hymn-pdf.ts — booklet branch
if (printMode === 'booklet') {
  // 1. Render each hymn as a booklet-sized content page element
  const contentPages = parsedHymns.map((ph, i) =>
    React.createElement(HymnPageBooklet, {
      key: i,
      hymn: ph.hymn,
      verses: ph.verses,
      fontPreset: fontPreset ?? 'clasica',
      includeBibleRef: includeBibleRef ?? true,
    })
  );

  // 2. Compute imposition order
  const imposition = computeImposition(contentPages.length);

  // 3. Build landscape sheet pages in imposition order
  pages = [];
  for (const sheet of imposition) {
    // Front side
    pages.push(
      React.createElement(BookletSheet, {
        key: `f-${pages.length}`,
        left: sheet.front.left > 0 ? parsedHymns[sheet.front.left - 1] : null,
        right: sheet.front.right > 0 ? parsedHymns[sheet.front.right - 1] : null,
        fontPreset,
        includeBibleRef,
      })
    );
    // Back side
    pages.push(
      React.createElement(BookletSheet, {
        key: `b-${pages.length}`,
        left: sheet.back.left > 0 ? parsedHymns[sheet.back.left - 1] : null,
        right: sheet.back.right > 0 ? parsedHymns[sheet.back.right - 1] : null,
        fontPreset,
        includeBibleRef,
      })
    );
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded Adamina font only | Font preset system (Clasica/Moderna/Legible) | This phase | Users can choose readability vs aesthetics |
| Portrait Letter only | Portrait + Landscape + Booklet imposition | This phase | Professional booklet output for church use |
| Bible ref always shown | Configurable toggle | This phase | Cleaner output when reference not needed |

## Open Questions

1. **Long hymns in booklet mode**
   - What we know: Half-letter (5.5x8.5") has significantly less space than full letter. Some hymns with many verses may not fit.
   - What's unclear: Whether @react-pdf/renderer's `wrap` prop on Page handles overflow to a second booklet page within the imposition. If a hymn needs 2 booklet pages, imposition page count changes.
   - Recommendation: Start with `wrap={false}` per booklet page and auto-reduce font size for long hymns (use "moderna" or "legible" preset body sizes as reference for minimum readable size). If a hymn overflows, truncate with "..." — extremely long hymns are rare in this hymnal corpus. Alternative: allow wrap and let the imposition handle multi-page hymns (increases complexity).

2. **Decorated style in booklet mode**
   - What we know: The decorated style has a large header and footer that consume significant vertical space on full Letter. On half-letter, this would leave almost no room for lyrics.
   - What's unclear: Whether to support decorated style in booklet mode at all, or force plain style.
   - Recommendation: Booklet mode should use a simplified decorated variant — smaller header, no footer, just the hymn title/number/hymnal in a compact colored bar. Or restrict booklet to plain style only, simplifying implementation significantly.

3. **Print instructions delivery**
   - What we know: Booklet requires duplex printing with short-edge flip. Users need clear instructions.
   - What's unclear: Where to show instructions — in the UI before download, as a cover page in the PDF, or both.
   - Recommendation: Add a brief instruction paragraph in the UI when booklet mode is selected, AND include a single instruction page as the first page of the PDF (before the booklet sheets): "Instrucciones de impresion: Seleccione 'Imprimir en ambos lados' y 'Voltear en borde corto'. Engrapadora al centro."

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via vitest.config.mts) |
| Config file | vitest.config.mts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IMP-01 | computeImposition returns correct page pairs for 4,8,3 pages | unit | `npx vitest run tests/pdf/imposition.test.ts -t "imposition"` | Wave 0 |
| IMP-02 | renderHymnPdf booklet mode produces valid PDF | unit | `npx vitest run tests/pdf/render-hymn-pdf.test.ts -t "booklet"` | Extend existing |
| IMP-03 | renderHymnPdf simple+landscape produces valid PDF | unit | `npx vitest run tests/pdf/render-hymn-pdf.test.ts -t "landscape"` | Extend existing |
| IMP-04 | renderHymnPdf respects fontPreset option | unit | `npx vitest run tests/pdf/render-hymn-pdf.test.ts -t "font preset"` | Extend existing |
| IMP-05 | renderHymnPdf respects includeBibleRef=false | unit | `npx vitest run tests/pdf/render-hymn-pdf.test.ts -t "bible ref"` | Extend existing |
| IMP-06 | PackageRequestSchema validates new fields | unit | `npx vitest run tests/lib/zip/generate-hymn-zip.test.ts` | Extend existing |
| IMP-07 | wizardReducer handles new actions | unit | `npx vitest run tests/empaquetador/wizardReducer.test.ts` | Extend existing |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `tests/pdf/imposition.test.ts` -- covers IMP-01 (new file)
- [ ] Extend `tests/pdf/render-hymn-pdf.test.ts` -- covers IMP-02 through IMP-05
- [ ] Extend `tests/empaquetador/wizardReducer.test.ts` -- covers IMP-07
- [ ] Extend `tests/lib/zip/generate-hymn-zip.test.ts` or `tests/api/hymn-package.test.ts` -- covers IMP-06

## Sources

### Primary (HIGH confidence)
- @react-pdf/renderer v4.3.2 — installed and verified in project (`npm ls @react-pdf/renderer`)
- [react-pdf.org/components](https://react-pdf.org/components) — Page component API: size, orientation props
- Existing codebase files (pdf-tokens.ts, render-hymn-pdf.ts, HymnPageDecorated.tsx, HymnPagePlain.tsx, HymnPageTwoUp.tsx) — direct code analysis

### Secondary (MEDIUM confidence)
- [Formax Printing: Booklet Layout for Saddle-Stitched Booklets](https://www.formaxprinting.com/blog/2016/11/booklet-layout-how-to-arrange-the-pages-of-a-saddle-stitched-booklet) — imposition algorithm reference
- [ColorCopiesUSA Booklet Page Order Tool](https://www.colorcopiesusa.com/booklet-page-order-tool.html) — verification tool for imposition order

### Tertiary (LOW confidence)
- Font size recommendations for booklet preset — based on existing token ratios scaled down proportionally. Needs validation with actual PDF output.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and proven in project
- Architecture: HIGH - extends existing patterns (dynamic imports, tokens, reducer)
- Imposition algorithm: HIGH - well-documented printing industry standard
- Font presets: MEDIUM - exact sizes need visual validation with printed output
- Booklet component design: MEDIUM - depends on how decorated style adapts to half-letter

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable domain, no fast-moving dependencies)
