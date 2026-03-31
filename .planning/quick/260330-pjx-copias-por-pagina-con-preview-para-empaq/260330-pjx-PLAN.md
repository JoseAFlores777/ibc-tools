# Quick Task: Copias por página con preview

## Goal
When 1 hymn is selected and printMode=simple, allow 1/2/4 copies per page with live HTML preview and independent font size control.

## Plan

### Task 1: Schema + State + Build Request
**Files:** `app/lib/zip/zip.schema.ts`, `app/empaquetador/hooks/useWizardReducer.ts`, `app/empaquetador/lib/build-package-request.ts`
**Action:**
- Add `copiesPerPage: z.enum(['1','2','4']).optional().default('1')` and `copiesFontSize: z.number().min(6).max(14).optional().default(9)` to packageRequestSchema
- Add `copiesPerPage: 1 | 2 | 4` and `copiesFontSize: number` to WizardState with defaults 1 and 9
- Add `SET_COPIES_PER_PAGE` and `SET_COPIES_FONT_SIZE` actions to WizardAction union
- Handle new actions in wizardReducer
- Pass new fields through in buildPackageRequest and LOAD_PACKAGE action
**Verify:** TypeScript compiles with no errors
**Done:** New fields flow from UI state → request → API

### Task 2: PDF Component + Render Integration
**Files:** `app/components/pdf-components/pdf-pages/HymnPageCopies.tsx` (new), `app/lib/pdf/render-hymn-pdf.ts`, `app/lib/zip/generate-hymn-zip.ts`
**Action:**
- Create `HymnPageCopies.tsx`: renders N copies of a hymn on one LETTER page
  - Props: hymn, verses, copies (2|4), fontSize, style, includeBibleRef
  - 2 copies: 2 columns side by side, each half-width
  - 4 copies: 2x2 grid (2 cols, 2 rows), each quarter
  - Dashed cut lines between copies (gray, 0.5pt dashed)
  - Each copy shows: title, verse markers, lyrics (centered, scaled to fontSize)
  - No header/footer decoration (space is precious) — just title + content
  - Supports decorated/decorated-eco/plain color schemes
- Update `RenderHymnPdfOptions` in render-hymn-pdf.ts: add `copiesPerPage?: 1|2|4` and `copiesFontSize?: number`
- In renderHymnPdf: when `copiesPerPage > 1` and layout is one-per-page, use HymnPageCopies instead
- Update generate-hymn-zip.ts: pass copiesPerPage and copiesFontSize from request to renderHymnPdf (both individual and combined)
**Verify:** `npm run build` passes
**Done:** PDF renders correctly with 2 or 4 copies per page

### Task 3: UI — Copies selector + Preview + Font slider
**Files:** `app/empaquetador/components/StepConfiguracion.tsx`
**Action:**
- After "Diseno de Pagina" section, when `selectedHymns.length === 1 && printMode === 'simple'`:
  - Add "Copias por Pagina" section with 3 buttons: 1, 2, 4
  - Add font size slider (range input, 6-14, step 1) with current value label
  - Add HTML preview box showing the layout:
    - White rectangle with aspect ratio ~letter (8.5:11)
    - Divided into the appropriate grid with dashed borders
    - Each cell shows hymn title + "verso 1..." placeholder text at relative scale
    - Preview updates live as copies/fontSize change
- Hide "Diseno de Pagina" (1 himno / 2 himnos) when copiesPerPage > 1 (force one-per-page)
**Verify:** UI renders without errors, preview updates reactively
**Done:** User can select copies, adjust font, see preview
