# Phase 2: PDF Generation for Server-Side Rendering - Research

**Researched:** 2026-03-29
**Domain:** Server-side PDF rendering with @react-pdf/renderer
**Confidence:** HIGH

## Summary

Phase 2 creates server-safe PDF components that render hymns via `renderToBuffer()` without browser DOM dependencies. The phase requires upgrading `@react-pdf/renderer` from v3.4.5 to v4.3.2, which is the current release and the first version line to support React 19 (the project uses React 19.2.3). The v3.x line only supports React 16-18 and throws `TypeError: Cannot read properties of undefined (reading 'hasOwnProperty')` when `renderToBuffer()` is called in a React 19 environment -- this was verified directly in the project.

The phase produces four component variants: 1-per-page decorated, 1-per-page plain, 2-per-page decorated, and 2-per-page plain. These consume Phase 1's `HymnForPdf` interface and `parseHymnHtml()` output. Font registration must use absolute filesystem paths (via `path.join(process.cwd(), 'public', ...)`) rather than the relative `/fonts/...` paths used in the existing client-side components, which resolve against the browser's origin.

**Primary recommendation:** Upgrade `@react-pdf/renderer` to v4.3.2 first (Wave 0), then build four server-safe PDF components consuming Phase 1's parsed hymn data. Create a shared font registration module and a `renderHymnPdf()` convenience function that Phase 3 will call.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Plain style includes a header (hymn number, title, hymnal name) and lyrics only. No footer, no church branding, no decorative elements.
- **D-02:** Verse markers (I, II, III, CORO, etc.) rendered as bold centered labels. Lyrics are left-aligned below each marker. Blank line separation between verses.
- **D-03:** Sans-serif font (Helvetica) for plain style. Visually distinct from decorated style's serif font (Adamina). Helvetica is built into react-pdf -- no custom font loading needed.
- **D-04:** Two hymns per page uses left/right column layout (not top/bottom). Each column gets approximately 4.25 inches of width on LETTER paper.
- **D-05:** A thin vertical line divider separates the two hymn columns. Applies to both decorated and plain styles.
- **D-06:** Decorated style in 2-per-page mode uses a shared header and footer spanning the full page width. Hymn content renders in two columns below the shared header.

### Claude's Discretion
- How to adapt the existing decorated style (dark blue header, gold accents, church logo footer) for the new server-side component -- replicate closely vs. modernize
- Font sizes and margins for 2-per-page mode (must remain legible in narrower columns)
- How to handle hymns with very long lyrics that overflow their allocated space in 2-per-page mode (truncate, reduce font size, or overflow to next page)
- Whether to create entirely new components or extract/refactor parts of the existing HymnPagePdf

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IMPR-01 | Usuario puede elegir layout de 1 himno por pagina (carta completa) | Full-page LETTER layout (612x792pt). Decorated and plain style components each support this as the default single-hymn layout. |
| IMPR-02 | Usuario puede elegir layout de 2 himnos por pagina (media carta) | Left/right column layout per D-04. LETTER page = 612pt wide; two columns ~306pt each minus margins with vertical divider (D-05). |
| IMPR-03 | Usuario puede elegir estilo decorado (con colores, bordes, diseno visual) | Replicate existing HymnPagePdf decorated style: dark blue (#393572) header, gold (#9e7f19) accents, Adamina font, church logo footer. Adapt for server-side rendering with absolute font/image paths. |
| IMPR-04 | Usuario puede elegir estilo plano (texto minimalista, blanco y negro) | Per D-01/D-02/D-03: Helvetica font, header with hymn number/title/hymnal only, bold centered verse markers, left-aligned lyrics, no decorative elements. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-pdf/renderer | 4.3.2 | Server-side PDF generation | Only version supporting React 19; renderToBuffer/renderToStream available |
| react | 19.2.3 | Component rendering | Already installed; required by @react-pdf/renderer v4 |
| node-html-parser | (existing) | HTML parsing for hymn lyrics | Already used by Phase 1's parseHymnHtml |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| path (Node built-in) | - | Absolute font/image path resolution | Font.register() in server context |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @react-pdf/renderer v4 | Keep v3.4.5 + @alexandernanberg/react-pdf-renderer fork | Fork is maintained by a single person; v4 is official with React 19 support |
| @react-pdf/renderer | pdfkit directly | Lose React component model; much more imperative code |

**Upgrade command:**
```bash
npm install @react-pdf/renderer@4.3.2
```

**Version verification:**
- `@react-pdf/renderer` 4.3.2 -- verified via `npm view` on 2026-03-29. Peer deps: `react ^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`. Published as latest.
- Currently installed: 3.4.5 (peer deps: React 16-18 only). Upgrade is **required**.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── components/pdf-components/
│   ├── pdf-pages/
│   │   ├── HymnPagePdf.tsx              # Existing (client-side, keep as-is)
│   │   ├── ProgramPagePdf.tsx           # Existing (client-side, keep as-is)
│   │   ├── HymnPageDecorated.tsx        # NEW: Server-safe decorated, 1-per-page
│   │   ├── HymnPagePlain.tsx            # NEW: Server-safe plain, 1-per-page
│   │   └── HymnPageTwoUp.tsx            # NEW: Server-safe 2-per-page (both styles)
│   ├── pdf-documents/
│   │   ├── HymnDocPdf.tsx               # Existing (client-side, keep as-is)
│   │   └── ProgramDocPdf.tsx            # Existing (client-side, keep as-is)
│   └── shared/
│       └── pdf-fonts.ts                 # NEW: Server-safe font registration
├── lib/pdf/
│   ├── html-to-pdf.ts                   # Phase 1 output
│   └── render-hymn-pdf.ts              # NEW: renderHymnPdf() convenience function
```

### Pattern 1: Server-Safe Font Registration
**What:** Centralized font registration using absolute filesystem paths
**When to use:** All server-rendered PDF components
**Example:**
```typescript
// app/components/pdf-components/shared/pdf-fonts.ts
import { Font } from '@react-pdf/renderer';
import path from 'path';

const fontsDir = path.join(process.cwd(), 'public', 'fonts');

// Register Adamina for decorated style (only needs to run once per process)
Font.register({
  family: 'Adamina',
  src: path.join(fontsDir, 'adamina', 'Adamina.ttf'),
});

// Helvetica is built-in to @react-pdf/renderer -- no registration needed for plain style (D-03)
```

### Pattern 2: Server-Safe Image Paths
**What:** Absolute paths for Image src in server context
**When to use:** Decorated style footer with church logo
**Example:**
```typescript
import path from 'path';

const logoPath = path.join(process.cwd(), 'public', 'images', 'IBC_Logo-min.png');

// In component:
<Image src={logoPath} style={styles.footerLogo} />
```

### Pattern 3: Layout/Style Composition
**What:** Separate layout (1-up vs 2-up) from style (decorated vs plain) using composition
**When to use:** All four component variants
**Example:**
```typescript
// render-hymn-pdf.ts
import { renderToBuffer } from '@react-pdf/renderer';
import { Document } from '@react-pdf/renderer';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';

export type PdfLayout = 'one-per-page' | 'two-per-page';
export type PdfStyle = 'decorated' | 'plain';

export interface RenderHymnPdfOptions {
  hymns: Array<{ hymn: HymnForPdf; verses: ParsedVerse[] }>;
  layout: PdfLayout;
  style: PdfStyle;
}

export async function renderHymnPdf(options: RenderHymnPdfOptions): Promise<Buffer> {
  const document = buildDocument(options);
  return renderToBuffer(document);
}
```

### Pattern 4: No 'use client' Directive
**What:** New server-side PDF components must NOT have `'use client'` at the top
**When to use:** All new components in this phase
**Why:** `renderToBuffer()` runs in Node.js server context. The existing components use `'use client'` because they render via PDFViewer in the browser. New components are consumed by API routes (Phase 3), not browser rendering.

### Anti-Patterns to Avoid
- **Reusing HymnPagePdf directly:** It uses `document.createElement()` for HTML parsing (replaced by Phase 1's `parseHymnHtml`) and relative font paths. Create new components that consume `ParsedVerse[]`.
- **Global font re-registration on every render:** `Font.register()` is process-global and idempotent. Register once in a shared module, import it for side effects.
- **Hardcoding page dimensions in points:** Use named constants (`LETTER_WIDTH = 612`, `LETTER_HEIGHT = 792`) for clarity and reuse in layout math.
- **Using flexWrap for 2-up layout:** react-pdf's flexWrap is unreliable for precise column layouts. Use explicit `flexDirection: 'row'` with fixed-width Views for left/right columns.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom pdfkit stream assembly | @react-pdf/renderer `renderToBuffer()` | Already the project standard; React component model matches existing patterns |
| HTML parsing | Browser DOM or regex | Phase 1's `parseHymnHtml()` | Already built and tested; returns structured `ParsedVerse[]` |
| Font metrics/kerning | Manual character width calculation | @react-pdf/renderer built-in text layout engine | Handles line breaks, font metrics, and text overflow automatically |
| Page size constants | Magic numbers | `size="LETTER"` prop on Page component | react-pdf knows LETTER = 612x792pt |

## Common Pitfalls

### Pitfall 1: React 19 Incompatibility with @react-pdf/renderer v3
**What goes wrong:** `renderToBuffer()` throws `TypeError: Cannot read properties of undefined (reading 'hasOwnProperty')` because v3.4.5 uses a react-reconciler version incompatible with React 19.
**Why it happens:** react-pdf v3 pins `react-reconciler` which expects React 18 internals. React 19 changed the fiber structure.
**How to avoid:** Upgrade to `@react-pdf/renderer@4.3.2` which includes `@react-pdf/reconciler@2.0.0` with React 19 support.
**Warning signs:** Any error mentioning `hasOwnProperty` or `$$$reconciler` in the stack trace.

### Pitfall 2: Font Path Resolution in Server vs Client
**What goes wrong:** `Font.register({ src: '/fonts/adamina/Adamina.ttf' })` works in the browser (relative to origin) but fails server-side (relative path has no meaning in Node.js). PDFs render with fallback Helvetica instead of Adamina.
**Why it happens:** The existing components are `'use client'` and resolve paths through the browser. Server-side `renderToBuffer()` resolves against the filesystem.
**How to avoid:** Use `path.join(process.cwd(), 'public', 'fonts', 'adamina', 'Adamina.ttf')` for server-side font registration.
**Warning signs:** Decorated PDFs look different from the browser-rendered ones (different font).

### Pitfall 3: v4 Upgrade Breaking Existing Client-Side PDFs
**What goes wrong:** Upgrading @react-pdf/renderer from v3 to v4 could change rendering behavior for the existing HymnPagePdf and ProgramPagePdf components that serve the `/pdf-gen/` routes.
**Why it happens:** v4 dropped CommonJS exports and changed some internal layout calculations (e.g., lineHeight behavior changed in v4.1.3).
**How to avoid:** After upgrading, manually verify the existing `/pdf-gen/hymns/[id]` and `/pdf-gen/programs/[id]` routes still render correctly. The existing components use dynamic imports which should work with ESM-only v4 in Next.js. Test lineHeight rendering specifically.
**Warning signs:** Existing PDF pages show layout differences or import errors after upgrade.

### Pitfall 4: 2-Per-Page Column Overflow
**What goes wrong:** Long hymns (6+ verses) overflow their column in 2-per-page layout, with text cut off or overlapping the divider.
**Why it happens:** react-pdf does not auto-paginate content within a fixed-height View. Each column is a fixed-width container; if content exceeds height, it is clipped.
**How to avoid:** Implement overflow handling: reduce font size for long hymns, or allow the hymn to continue on the next page pair. Estimate verse count and adjust font size before rendering.
**Warning signs:** Test with the longest hymn in the database.

### Pitfall 5: Image Component Requires Explicit Dimensions in Server Context
**What goes wrong:** `<Image src={logoPath} />` without explicit width/height may fail or produce zero-size output in server rendering.
**Why it happens:** In browser context, react-pdf can introspect image dimensions. In server context via renderToBuffer, dimensions must be explicit.
**How to avoid:** Always set explicit width and height on Image components.

## Code Examples

### Example 1: Server-Safe Decorated Page (1-per-page)
```typescript
// app/components/pdf-components/pdf-pages/HymnPageDecorated.tsx
// NO 'use client' directive

import { Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';
import '@/app/components/pdf-components/shared/pdf-fonts'; // side-effect: registers Adamina
import path from 'path';

const logoPath = path.join(process.cwd(), 'public', 'images', 'IBC_Logo-min.png');

// LETTER = 612 x 792 pt
const COLORS = {
  headerBg: '#393572',
  goldAccent: '#9e7f19',
  pageBg: '#f7f7f7',
  lightText: '#c2c2c4',
  bodyText: '#444',
};

export interface HymnPageDecoratedProps {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

export const HymnPageDecorated: React.FC<HymnPageDecoratedProps> = ({ hymn, verses }) => {
  return (
    <Page size="LETTER" style={styles.page}>
      {/* Header: dark blue bg, gold border, hymn number + title + hymnal */}
      <View style={styles.header}>
        {/* ... replicate existing HymnPagePdf header pattern ... */}
      </View>

      {/* Body: verses rendered from ParsedVerse[] */}
      <View style={styles.body}>
        {verses.map((verse, i) => (
          <View key={i} style={styles.verse}>
            {verse.type === 'title' ? (
              <Text style={styles.verseTitle}>{verse.lines[0].text}</Text>
            ) : (
              verse.lines.map((line, j) => (
                <Text key={j} style={[
                  styles.lyricLine,
                  line.bold && styles.boldLine,
                  line.italic && styles.italicLine,
                ]}>{line.text}</Text>
              ))
            )}
          </View>
        ))}
      </View>

      {/* Footer: church info + logo */}
      <View style={styles.footer}>
        <Image src={logoPath} style={styles.footerLogo} />
      </View>
    </Page>
  );
};
```

### Example 2: Plain Page (1-per-page)
```typescript
// app/components/pdf-components/pdf-pages/HymnPagePlain.tsx
// NO 'use client' directive

import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';
// No font import needed -- Helvetica is built-in (D-03)

export interface HymnPagePlainProps {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

// Per D-01: header (number, title, hymnal) + lyrics only. No footer. No decorations.
// Per D-02: verse markers bold centered, lyrics left-aligned, blank line separation.
// Per D-03: Helvetica (built-in sans-serif).

export const HymnPagePlain: React.FC<HymnPagePlainProps> = ({ hymn, verses }) => {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.hymnNumber}>
          {hymn.hymn_number ? `Himno #${hymn.hymn_number}` : 'Himno'}
        </Text>
        <Text style={styles.hymnTitle}>{hymn.name}</Text>
        {hymn.hymnal && <Text style={styles.hymnalName}>{hymn.hymnal.name}</Text>}
      </View>

      <View style={styles.body}>
        {verses.map((verse, i) => (
          <View key={i} style={styles.verseBlock}>
            {verse.type === 'title' ? (
              <Text style={styles.verseMarker}>{verse.lines[0].text}</Text>
            ) : (
              verse.lines.map((line, j) => (
                <Text key={j} style={styles.lyricLine}>{line.text}</Text>
              ))
            )}
          </View>
        ))}
      </View>
    </Page>
  );
};

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#fff' },
  header: { marginBottom: 20, textAlign: 'center' },
  hymnNumber: { fontSize: 10, color: '#666' },
  hymnTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  hymnalName: { fontSize: 10, color: '#666', marginTop: 4 },
  body: { flex: 1 },
  verseBlock: { marginBottom: 12 },
  verseMarker: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  lyricLine: { fontSize: 11, textAlign: 'left', lineHeight: 1.4 },
});
```

### Example 3: 2-Per-Page Layout (column structure)
```typescript
// Key layout math for LETTER page, 2-up:
// LETTER width = 612pt, height = 792pt
// Page padding: 30pt each side = 552pt usable width
// Divider: 1pt line + 8pt gap each side = 17pt
// Each column: (552 - 17) / 2 = ~267.5pt (approximately 3.7 inches)
// D-04 says ~4.25 inches; with tighter margins (20pt) we get:
// 612 - 40 = 572pt usable; (572 - 17) / 2 = ~277.5pt = ~3.85 inches

const styles = StyleSheet.create({
  page: { flexDirection: 'column', padding: 20 },
  columnsContainer: { flexDirection: 'row', flex: 1 },
  column: { width: '48%' },   // flex won't work reliably; use percentage
  divider: { width: 1, backgroundColor: '#ccc', marginHorizontal: 8 },
});

// D-06: Decorated 2-up has shared header/footer spanning full width
// Plain 2-up has no header/footer per D-01
```

### Example 4: renderHymnPdf Convenience Function
```typescript
// app/lib/pdf/render-hymn-pdf.ts
import { renderToBuffer } from '@react-pdf/renderer';
import { Document } from '@react-pdf/renderer';
import { parseHymnHtml } from '@/app/lib/pdf/html-to-pdf';
import type { HymnForPdf } from '@/app/interfaces/Hymn.interface';
import React from 'react';

export type PdfLayout = 'one-per-page' | 'two-per-page';
export type PdfStyle = 'decorated' | 'plain';

export interface RenderHymnPdfOptions {
  hymns: HymnForPdf[];
  layout: PdfLayout;
  style: PdfStyle;
}

export async function renderHymnPdf(options: RenderHymnPdfOptions): Promise<Buffer> {
  const { hymns, layout, style } = options;
  const parsedHymns = hymns.map(hymn => ({
    hymn,
    verses: parseHymnHtml(hymn.letter_hymn || ''),
  }));

  // Build document with appropriate page components based on layout + style
  const doc = React.createElement(Document, null,
    // ... page creation logic based on layout/style combination
  );

  return renderToBuffer(doc);
}
```

## Page Dimension Reference

| Paper | Width (pt) | Height (pt) | Width (in) | Height (in) |
|-------|-----------|-------------|-----------|-------------|
| LETTER | 612 | 792 | 8.5 | 11 |
| 1-up usable (40pt margins) | 532 | 712 | 7.39 | 9.89 |
| 2-up column (20pt margins, 17pt divider) | ~277 | ~752 | ~3.85 | ~10.44 |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @react-pdf/renderer v3.x | v4.x series | v4.1.0 (2024) | React 19 support added; CJS dropped; reconciler rewritten |
| `Font.register({ src: '/relative/path' })` for client | `path.join(process.cwd(), ...)` for server | Always required | Server-side rendering requires absolute paths |
| Browser DOM `document.createElement` for HTML parsing | `node-html-parser` via `parseHymnHtml()` | Phase 1 | Server-safe HTML parsing already solved |
| `'use client'` + PDFViewer | `renderToBuffer()` in server context | This phase | Enables API route consumption in Phase 3 |

**Deprecated/outdated:**
- `@react-pdf/renderer` v3.4.5: Incompatible with React 19. Must upgrade.
- `extractParagraphs()` in HymnPagePdf.tsx: Uses browser DOM. Replaced by Phase 1's `parseHymnHtml()`.

## Open Questions

1. **Existing PDF route regression**
   - What we know: Upgrading to v4 may change lineHeight behavior (issue #2988 reported lineHeight regressions in v4.1.3, resolved in later versions).
   - What's unclear: Whether the existing `/pdf-gen/hymns/[id]` and `/pdf-gen/programs/[id]` routes render identically after upgrade.
   - Recommendation: Include a manual verification step after upgrade. If layout breaks, adjust existing component styles (minor).

2. **Long hymn overflow in 2-per-page mode**
   - What we know: Some hymns have 8+ verses. At ~267pt column width and typical font sizes, content will exceed page height.
   - What's unclear: Exact threshold (depends on font size chosen for 2-up mode).
   - Recommendation: Use reduced font size (8-9pt) for 2-up mode. If still overflows, allow content to continue on next page pair. Test with longest hymn from Directus.

3. **Standalone Docker font path in production**
   - What we know: `process.cwd()` in standalone Next.js Docker points to the app directory where `server.js` runs.
   - What's unclear: Whether `public/fonts/` is copied to the standalone output directory.
   - Recommendation: Verify in Dockerfile that `public/` assets are available at `process.cwd()/public/` in the container. The existing Dockerfile copies `public/` so this should work.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IMPR-01 | 1-per-page LETTER layout renders valid PDF buffer | unit | `npx vitest run tests/pdf/render-hymn-pdf.test.ts -t "one-per-page" -x` | No -- Wave 0 |
| IMPR-02 | 2-per-page layout renders valid PDF buffer with 2 hymns | unit | `npx vitest run tests/pdf/render-hymn-pdf.test.ts -t "two-per-page" -x` | No -- Wave 0 |
| IMPR-03 | Decorated style renders PDF buffer (non-zero size) | unit | `npx vitest run tests/pdf/render-hymn-pdf.test.ts -t "decorated" -x` | No -- Wave 0 |
| IMPR-04 | Plain style renders PDF buffer (non-zero size) | unit | `npx vitest run tests/pdf/render-hymn-pdf.test.ts -t "plain" -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/pdf/render-hymn-pdf.test.ts` -- covers IMPR-01 through IMPR-04
- [ ] `tests/fixtures/hymn-pdf-samples.ts` -- mock HymnForPdf data for PDF rendering tests
- [ ] Upgrade `@react-pdf/renderer` to v4.3.2 -- required before any renderToBuffer test can pass

## Project Constraints (from CLAUDE.md)

- **Tech stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind, shadcn/ui
- **PDF engine:** `@react-pdf/renderer` -- maintain consistency with existing patterns
- **Backend:** Directus CMS -- no schema modifications
- **Naming:** PascalCase for components (`.tsx`), camelCase for utilities (`.ts`)
- **Exports:** Default exports for React components, named exports for utilities
- **Path aliases:** `@/*` for project root, `@/lib/*` for `app/lib/*`
- **No 'use client'** on new server-side PDF components (existing client components keep theirs)
- **Comments:** Spanish preferred for domain-specific comments
- **Error handling:** Try-catch with `console.error()` and descriptive context

## Sources

### Primary (HIGH confidence)
- Project codebase: `app/components/pdf-components/pdf-pages/HymnPagePdf.tsx` -- existing decorated style reference
- Project codebase: `app/lib/pdf/html-to-pdf.ts` -- Phase 1 parser interface
- Project codebase: `app/interfaces/Hymn.interface.ts` -- HymnForPdf, ParsedVerse types
- npm registry: `npm view @react-pdf/renderer@4.3.2` -- verified peerDeps include React 19
- Local verification: `renderToBuffer` confirmed available as function export in v3 and v4
- Local verification: `renderToBuffer` with React 19 + v3.4.5 throws hasOwnProperty error (reproduced)

### Secondary (MEDIUM confidence)
- [GitHub Issue #2918](https://github.com/diegomura/react-pdf/issues/2918) -- hasOwnProperty error with React 19 in v3
- [GitHub Issue #2935](https://github.com/diegomura/react-pdf/issues/2935) -- React 19 support tracking
- [GitHub Issue #3111](https://github.com/diegomura/react-pdf/issues/3111) -- unitsPerEm fix in v4.3.0
- [GitHub Issue #2988](https://github.com/diegomura/react-pdf/issues/2988) -- lineHeight regression in v4.1.3
- `.planning/research/PITFALLS.md` -- project-level pitfalls analysis (font paths, memory)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- version compatibility verified locally; npm registry confirms React 19 peer dep in v4.3.2
- Architecture: HIGH -- follows existing project patterns; font path issue well-documented in pitfalls research
- Pitfalls: HIGH -- React 19 incompatibility reproduced locally; font path issue documented in project pitfalls

**Research date:** 2026-03-29
**Valid until:** 2026-04-29 (stable domain; @react-pdf/renderer release cycle is monthly)
