# Phase 2: PDF Generation for Server-Side Rendering - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Server-compatible PDF components that render hymns into properly formatted documents using `renderToBuffer()`. Supports two layouts (1 hymn/page full LETTER, 2 hymns/page left/right columns) and two styles (decorated with colors/branding, plain minimalist black-and-white). Consumes Phase 1's `parseHymnHtml()` and `fetchHymnForPdf()`. Does NOT include UI, API routes, or ZIP generation.

</domain>

<decisions>
## Implementation Decisions

### Plain Style Definition
- **D-01:** Plain style includes a header (hymn number, title, hymnal name) and lyrics only. No footer, no church branding, no decorative elements.
- **D-02:** Verse markers (I, II, III, CORO, etc.) rendered as bold centered labels. Lyrics are left-aligned below each marker. Blank line separation between verses.
- **D-03:** Sans-serif font (Helvetica) for plain style. Visually distinct from decorated style's serif font (Adamina). Helvetica is built into react-pdf — no custom font loading needed.

### 2-per-page Layout
- **D-04:** Two hymns per page uses left/right column layout (not top/bottom). Each column gets approximately 4.25 inches of width on LETTER paper.
- **D-05:** A thin vertical line divider separates the two hymn columns. Applies to both decorated and plain styles.
- **D-06:** Decorated style in 2-per-page mode uses a shared header and footer spanning the full page width. Hymn content renders in two columns below the shared header.

### Claude's Discretion
- How to adapt the existing decorated style (dark blue header, gold accents, church logo footer) for the new server-side component — replicate closely vs. modernize
- Font sizes and margins for 2-per-page mode (must remain legible in narrower columns)
- How to handle hymns with very long lyrics that overflow their allocated space in 2-per-page mode (truncate, reduce font size, or overflow to next page)
- Whether to create entirely new components or extract/refactor parts of the existing HymnPagePdf

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Directus Schema
- `contexts/directus.json` — Full Directus schema including hymn collection fields, junction tables, and file references

### Phase 1 Outputs (dependencies)
- `app/lib/pdf/html-to-pdf.ts` — `parseHymnHtml()` returns `ParsedVerse[]`, `extractPlainText()` returns `string[]`
- `app/interfaces/Hymn.interface.ts` — `HymnForPdf`, `ParsedVerse`, `HymnAudioFiles` and related interfaces
- `app/lib/directus/services/hymns.ts` — `fetchHymnForPdf()`, `searchHymns()`, `getAssetUrl()`

### Existing PDF Components (reference for decorated style)
- `app/components/pdf-components/pdf-pages/HymnPagePdf.tsx` — Current decorated hymn page (uses browser DOM — NOT server-safe, but style/layout reference)
- `app/components/pdf-components/pdf-documents/HymnDocPdf.tsx` — Current document wrapper with PDFViewer/PDFDownloadLink (client-side only)

### Existing Fonts and Assets
- `/fonts/adamina/Adamina.ttf` — Serif font used in existing decorated style
- `/images/IBC_Logo-min.png` — Church logo used in footer

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HymnPagePdf.tsx`: Full decorated style reference — dark blue (#393572) header, gold (#9e7f19) accents, Adamina font, LETTER size, church logo footer. Uses `extractParagraphs()` with browser DOM (must be replaced with Phase 1's `parseHymnHtml`).
- `Font.register()` pattern for Adamina font — reuse in new decorated components.
- `StyleSheet.create()` patterns for react-pdf styling.

### Established Patterns
- PDF pages export as named React components with Props interface
- PDF documents wrap pages in `<Document>` component
- `'use client'` directive on existing PDF components (new ones must NOT use this — they need to work server-side)
- Verse detection by keyword matching: `['CORO', 'I', 'II', 'III', ...]` — Phase 1's parser now handles this structurally

### Integration Points
- New components consume `HymnForPdf` interface from Phase 1 (not `ActivityHymn`)
- `renderToBuffer()` from `@react-pdf/renderer` generates PDF bytes server-side — Phase 3 will call this from an API route
- New components should live in `app/components/pdf-components/` alongside existing ones

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches that follow existing PDF patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-pdf-generation-for-server-side-rendering*
*Context gathered: 2026-03-29*
