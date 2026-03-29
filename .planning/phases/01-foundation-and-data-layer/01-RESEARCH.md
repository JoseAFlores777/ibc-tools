# Phase 1: Foundation and Data Layer - Research

**Researched:** 2026-03-28
**Domain:** Directus SDK data fetching, server-side HTML parsing, TypeScript interfaces
**Confidence:** HIGH

## Summary

Phase 1 builds four foundational pieces: (1) a `searchHymns()` service for querying hymns by number/name/hymnal/category, (2) a `fetchHymnForPdf()` service for complete hymn data including audio file references, (3) a server-safe HTML-to-react-pdf parser to convert the `letter_hymn` rich text field, and (4) audio availability flags with file metadata. All four build on existing patterns already established in the codebase.

The existing codebase provides strong scaffolding: `fetchChurchEvents()` in `events.ts` is a clear service pattern to replicate, `getHymn()` in the hymn PDF page already fetches most needed fields, and the Directus auto-generated types in `directus.interface.ts` fully describe the `Hymn` type including all six audio file fields. The main technical challenge is the HTML parser -- the current `HymnPagePdf.tsx` uses `document.createElement()` (browser DOM) which will not work server-side.

**Primary recommendation:** Use `node-html-parser` (v7.x) for server-safe HTML parsing, follow the existing `events.ts` service pattern for new Directus query functions, and create new interfaces in `app/interfaces/` that extend the existing `ActivityHymn` with audio metadata.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Claude's discretion on the parsing library/approach (node-html-parser, regex, or other). Must work server-side without browser DOM APIs.
- **D-02:** Formatting preservation depends on the PDF style: decorated style should preserve verse structure, bold/italic, and paragraph breaks from the HTML; plain style can use text-only extraction.
- **D-03:** The parser must handle the `letter_hymn` HTML field from Directus and produce react-pdf compatible elements (Text, View).
- **D-04:** Service must return file metadata per audio field -- not just booleans. Include file name, file size, and format (extension) for each available track (track_only, midi_file, soprano_voice, alto_voice, tenor_voice, bass_voice).
- **D-05:** Audio fields are UUIDs pointing to `directus_files`. Need to resolve these to get metadata.

### Claude's Discretion
- HTML parser library choice (node-html-parser, rehype, regex, etc.)
- How to handle hymns with no audio files in the UX (warning indicator vs silent)
- Search service implementation details (debounce timing, result limits, sort order)
- Data contract shapes -- whether to extend existing `ActivityHymn` or create new interfaces

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @directus/sdk | 17.0.2 (installed) | Directus CMS queries | Already in use, singleton pattern established |
| node-html-parser | 7.1.0 (latest) | Server-safe HTML parsing | Zero DOM dependency, fast, well-maintained, returns traversable AST |
| @react-pdf/renderer | 3.4.5 (installed) | PDF element types (Text, View) | Already in use for hymn/program PDFs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript | 5.x (installed) | Type definitions | All new interfaces and services |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node-html-parser | rehype/unified | rehype is more powerful but heavier; hymn HTML is simple (p, br, b, i tags) -- node-html-parser is sufficient and simpler |
| node-html-parser | regex | Fragile for nested HTML; node-html-parser provides proper AST traversal |
| node-html-parser | cheerio | cheerio is larger (includes full jQuery API); overkill for this use case |

**Installation:**
```bash
npm install node-html-parser
```

**Version verification:** `node-html-parser@7.1.0` confirmed via npm registry 2026-03-28. All other libraries already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/
  lib/
    directus/
      services/
        hymns.ts           # NEW: searchHymns(), fetchHymnForPdf()
    pdf/
      html-to-pdf.ts       # NEW: HTML-to-react-pdf parser utility
  interfaces/
    Hymn.interface.ts      # NEW: HymnSearchResult, HymnForPdf, AudioFileMetadata
```

### Pattern 1: Directus Service Function (EXISTING PATTERN)
**What:** Async function that wraps Directus SDK `readItems`/`readItem` with typed fields, error handling, and casting.
**When to use:** Every Directus data fetch.
**Example (from existing codebase):**
```typescript
// Source: app/lib/directus/services/events.ts (lines 17-51)
export async function fetchChurchEvents(options?: { limit?: number }) {
  const client = getDirectus();
  const limit = options?.limit ?? 50;
  const fields = [
    'id',
    'title',
    // ... explicit field selection
  ] as const;

  const items = await client.request(
    // @ts-ignore -- established pattern for Directus SDK generic complexity
    readItems('church_events' as any, {
      sort: ['start_datetime'],
      fields: fields as unknown as string[],
      filter: { status: { _neq: 'archived' } },
      limit,
    })
  );

  return items as ChurchEventListItem[];
}
```

### Pattern 2: Relational Field Resolution via Directus SDK
**What:** Use nested field arrays to resolve M2O and M2M relations in a single query.
**When to use:** Fetching hymn with hymnal, categories, authors, and audio file metadata.
**Example (from existing codebase):**
```typescript
// Source: app/pdf-gen/hymns/[id]/page.tsx (lines 23-41)
const queryItem = {
  fields: [
    'name',
    'bible_text',
    'letter_hymn',
    {
      hymnal: ['name', 'publisher'],
      authors: [
        'authors_id.name',
        'author_roles.author_roles_id.description',
      ]
    }
  ],
};
```

### Pattern 3: Audio File Metadata Resolution
**What:** Resolve UUID file references to `directus_files` metadata in a single query using nested field selection.
**When to use:** Getting file name, size, and type for audio availability flags.
**Key insight:** Each audio field (track_only, midi_file, soprano_voice, etc.) is a UUID FK to `directus_files`. Directus SDK can resolve these in the same query using nested fields:
```typescript
// Conceptual -- resolve file metadata inline
fields: [
  'track_only.id',
  'track_only.filename_download',
  'track_only.filesize',
  'track_only.type',
  'midi_file.id',
  'midi_file.filename_download',
  'midi_file.filesize',
  'midi_file.type',
  // ... same for soprano_voice, alto_voice, tenor_voice, bass_voice
]
```

### Anti-Patterns to Avoid
- **Using `document.*` for HTML parsing:** The current `HymnPagePdf.tsx` uses `document.createElement('textarea')` and `document.createElement('div')` -- these fail on the server. All new parsing must use `node-html-parser`.
- **Fetching files in separate requests:** Do NOT make 6 separate requests for each audio file's metadata. Use Directus nested field resolution to get all metadata in one `readItem` call.
- **Extending `ActivityHymn` directly:** The existing `ActivityHymn` interface is tightly coupled to the program PDF component. Create new interfaces rather than modifying the existing one to avoid breaking the program PDF flow.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML parsing | Regex-based parser | node-html-parser | HTML entity decoding, nested tags, self-closing tags are edge-case nightmares |
| HTML entity decoding | Custom `decodeHtmlEntities()` with `document.createElement` | node-html-parser's built-in decode | The existing approach requires browser DOM |
| Directus query builder | Custom fetch wrapper | @directus/sdk `readItems`/`readItem` | SDK handles auth, pagination, field selection, filtering natively |
| File URL construction | String concatenation for asset URLs | `${DIRECTUS_URL}/assets/${fileId}` | Standard Directus asset URL pattern, but keep it in one utility function |

**Key insight:** The current codebase already has the pattern for Directus queries. The only genuinely new work is the HTML parser and the new interfaces.

## Common Pitfalls

### Pitfall 1: Browser DOM in Server Components
**What goes wrong:** Using `document.createElement()`, `DOMParser`, or any browser API in server-side code causes "document is not defined" runtime errors.
**Why it happens:** The existing `HymnPagePdf.tsx` runs as a client component (`'use client'`) so it can use browser DOM. The new parser must work in server components and API routes.
**How to avoid:** Use `node-html-parser` exclusively. Never import `document` or `window` in files under `app/lib/`.
**Warning signs:** `ReferenceError: document is not defined` during build or at request time.

### Pitfall 2: Directus SDK Type Gymnastics
**What goes wrong:** The `@directus/sdk` v17 generic types are extremely complex, causing TypeScript errors on `readItems`/`readItem` calls.
**Why it happens:** The SDK's type system tries to infer field selection types but often fails with custom schemas.
**How to avoid:** Follow the established pattern: use `@ts-ignore` on the SDK call, use `as any` for collection names, and cast the result to the desired type. This is the existing convention in the codebase.
**Warning signs:** TypeScript errors like "Type instantiation is excessively deep and possibly infinite."

### Pitfall 3: Null Audio Fields
**What goes wrong:** Assuming audio fields always have values. Most hymns will have `null` for most/all audio fields.
**Why it happens:** Audio files (track_only, midi_file, soprano_voice, etc.) are optional UUIDs that may be null.
**How to avoid:** Always check for null before resolving file metadata. The `AudioFileMetadata` type should be `| null` for each field. When a field is null, the nested resolution will also return null -- Directus handles this gracefully.
**Warning signs:** `Cannot read properties of null` errors.

### Pitfall 4: M2M Category Filtering
**What goes wrong:** Filtering hymns by category requires filtering through the `hymn_hymn_categories` junction table, not directly on the `hymn` collection.
**Why it happens:** Categories is an M2M relation: `hymn` <-> `hymn_hymn_categories` <-> `hymn_categories`.
**How to avoid:** Use Directus deep filter syntax: `filter: { categories: { hymn_categories_id: { _eq: categoryId } } }`.
**Warning signs:** Empty results when filtering by category, or "field not found" errors.

### Pitfall 5: Search Performance with `_contains`
**What goes wrong:** Using `_contains` filter on name field does case-sensitive substring matching.
**Why it happens:** Directus `_contains` is case-sensitive by default in PostgreSQL.
**How to avoid:** Use `_icontains` for case-insensitive search. For hymn number search, use `_eq` (exact match) since numbers are integers.
**Warning signs:** Users not finding hymns because of case mismatch.

## Code Examples

Verified patterns from the existing codebase and Directus SDK documentation:

### searchHymns() Service Shape
```typescript
// File: app/lib/directus/services/hymns.ts
import { readItems } from '@directus/sdk';
import { getDirectus } from '@/app/lib/directus';

export interface HymnSearchFilters {
  query?: string;         // Search by name (icontains)
  hymnNumber?: number;    // Exact match on hymn_number
  hymnalId?: string;      // Filter by hymnal UUID
  categoryId?: number;    // Filter by category through M2M junction
  limit?: number;         // Result limit (default 25)
  offset?: number;        // For pagination
}

export interface HymnSearchResult {
  id: string;
  name: string;
  hymn_number: number | null;
  hymnal: { id: string; name: string } | null;
  categories: Array<{
    hymn_categories_id: { id: number; name: string } | null;
  }>;
  // Audio availability flags with metadata
  audioFiles: {
    track_only: AudioFileInfo | null;
    midi_file: AudioFileInfo | null;
    soprano_voice: AudioFileInfo | null;
    alto_voice: AudioFileInfo | null;
    tenor_voice: AudioFileInfo | null;
    bass_voice: AudioFileInfo | null;
  };
  hasAnyAudio: boolean;
}

export interface AudioFileInfo {
  id: string;
  filename_download: string;
  filesize: number | null;
  type: string | null;  // MIME type, e.g. "audio/midi", "audio/mpeg"
}
```

### fetchHymnForPdf() Service Shape
```typescript
// File: app/lib/directus/services/hymns.ts
export interface HymnForPdf {
  id: string;
  name: string;
  hymn_number: number | null;
  hymn_time_signature: string | null;
  letter_hymn: string | null;
  bible_text: string | null;
  bible_reference: string | null;
  hymnal: { name: string; publisher: string | null } | null;
  authors: Array<{
    authors_id: { name: string } | null;
    author_roles: Array<{
      author_roles_id: { description: string; rol_abbr: string } | null;
    }>;
  }>;
  // Audio file references for ZIP inclusion
  audioFiles: {
    track_only: AudioFileInfo | null;
    midi_file: AudioFileInfo | null;
    soprano_voice: AudioFileInfo | null;
    alto_voice: AudioFileInfo | null;
    tenor_voice: AudioFileInfo | null;
    bass_voice: AudioFileInfo | null;
  };
}
```

### HTML-to-PDF Parser Shape
```typescript
// File: app/lib/pdf/html-to-pdf.ts
import { parse, HTMLElement, TextNode } from 'node-html-parser';

export interface ParsedVerse {
  type: 'title' | 'verse';  // 'title' for CORO, I, II, etc.
  lines: ParsedLine[];
}

export interface ParsedLine {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

/**
 * Parse hymn HTML (letter_hymn field) into structured data
 * for react-pdf rendering. Works server-side with no browser DOM.
 *
 * HTML structure from Directus rich text editor:
 *   <p>CORO</p>
 *   <p>Line 1<br>Line 2<br>Line 3</p>
 *   <p>I</p>
 *   <p>Verse line 1<br>Verse line 2</p>
 */
export function parseHymnHtml(html: string): ParsedVerse[] {
  const root = parse(html);
  const paragraphs = root.querySelectorAll('p');
  // ... transform to ParsedVerse[]
}

/**
 * Plain text extraction (for plain/minimal PDF style).
 * Strips all HTML, preserves paragraph and line breaks.
 */
export function extractPlainText(html: string): string[] {
  const root = parse(html);
  const paragraphs = root.querySelectorAll('p');
  // ... extract text content, split on <br>
}
```

### Directus Filter Construction for Search
```typescript
// Building dynamic filters for searchHymns()
function buildHymnFilter(filters: HymnSearchFilters): Record<string, any> {
  const filter: Record<string, any> = {
    status: { _eq: 'published' },
  };

  if (filters.query) {
    filter.name = { _icontains: filters.query };
  }

  if (filters.hymnNumber !== undefined) {
    filter.hymn_number = { _eq: filters.hymnNumber };
  }

  if (filters.hymnalId) {
    filter.hymnal = { _eq: filters.hymnalId };
  }

  if (filters.categoryId) {
    // M2M deep filter through junction table
    filter.categories = {
      hymn_categories_id: { _eq: filters.categoryId },
    };
  }

  return filter;
}
```

### Directus Asset URL Helper
```typescript
// File: app/lib/directus/services/hymns.ts
export function getAssetUrl(fileId: string): string {
  const baseUrl = process.env.DIRECTUS_URL
    || process.env.NEXT_PUBLIC_DIRECTUS_URL
    || 'http://localhost';
  return `${baseUrl}/assets/${fileId}`;
}
```

## Directus Schema Reference (Hymn Collection)

Complete field map for the `hymn` collection relevant to this phase:

| Field | Type | FK To | Purpose |
|-------|------|-------|---------|
| id | uuid | - | Primary key |
| name | string | - | Hymn name (searchable) |
| hymn_number | integer | - | Hymn number (searchable, default 0) |
| status | string | - | published/draft/archived |
| letter_hymn | text (HTML) | - | Rich text lyrics from Directus editor |
| bible_text | text | - | Associated Bible verse text |
| bible_reference | string | - | Bible verse reference |
| hymn_time_signature | string | - | Musical time signature |
| hymnal | uuid | hymnals.id | M2O to hymnals collection |
| categories | alias (M2M) | hymn_hymn_categories | M2M junction to hymn_categories |
| authors | alias (M2M) | hymn_authors | M2M junction to authors |
| track_only | uuid | directus_files.id | Audio: instrumental track |
| midi_file | uuid | directus_files.id | Audio: MIDI file |
| soprano_voice | uuid | directus_files.id | Audio: soprano voice part |
| alto_voice | uuid | directus_files.id | Audio: alto voice part |
| tenor_voice | uuid | directus_files.id | Audio: tenor voice part |
| bass_voice | uuid | directus_files.id | Audio: bass voice part |
| are_lyrics_exists | boolean | - | Manual flag for lyrics availability |
| is_track_only_exists | boolean | - | Manual flag for track availability |
| original_midi | boolean | - | Manual flag for MIDI availability |
| formatedLyrics | boolean | - | Whether lyrics have been formatted |

**Audio fields note:** The six audio UUID fields (track_only, midi_file, soprano_voice, alto_voice, tenor_voice, bass_voice) all point to `directus_files`. When resolved, they provide `filename_download`, `filesize`, `type` (MIME), and `id` (used for asset URL construction). The boolean flags (is_track_only_exists, original_midi) are manually maintained and may be stale -- always check the actual UUID field for truth.

**DirectusFiles relevant fields:** `id` (uuid), `filename_download` (string), `filesize` (number|null), `type` (string|null, MIME type), `title` (string|null).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.createElement` HTML parsing | node-html-parser (server-safe) | This phase | Enables server-side PDF generation without client component |
| Boolean audio flags | UUID file resolution with metadata | This phase | Accurate availability + file info for download |
| Inline `getHymn()` in page | Shared service in `services/hymns.ts` | This phase | Reusable across PDF routes and API routes |

## Open Questions

1. **Directus file download permissions from server context**
   - What we know: The Directus client uses no authentication token (public access). Asset downloads via `/assets/{id}` should work if Directus roles allow public file access.
   - What's unclear: Whether the server-side context (no cookies/session) can download files. This is flagged as a blocker in STATE.md.
   - Recommendation: Implementation should verify this with a simple test fetch of a known file UUID. If blocked, the Directus URL may need an auth token parameter. This primarily affects Phase 3 (ZIP generation) but the service functions should be designed to support adding auth headers later.

2. **HTML content structure variability**
   - What we know: `letter_hymn` uses Directus rich text editor (TinyMCE) which outputs standard `<p>`, `<br>`, `<strong>`, `<em>` tags.
   - What's unclear: How consistent the HTML structure is across all hymns in the database. Some may have unusual formatting.
   - Recommendation: Build the parser to handle common cases (p, br, strong, em, b, i) and gracefully fall back to plain text extraction for unexpected markup. Log warnings for unrecognized tags.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None currently installed |
| Config file | none -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-1 | searchHymns() queries by number, name, hymnal, category | unit (mocked Directus) | `npx vitest run tests/services/hymns.test.ts` | Wave 0 |
| SC-2 | fetchHymnForPdf() returns complete hymn data with audio refs | unit (mocked Directus) | `npx vitest run tests/services/hymns.test.ts` | Wave 0 |
| SC-3 | HTML parser converts letter_hymn to react-pdf elements | unit (pure function) | `npx vitest run tests/lib/html-to-pdf.test.ts` | Wave 0 |
| SC-4 | Audio availability flags reflect actual file presence | unit (mocked Directus) | `npx vitest run tests/services/hymns.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Install vitest: `npm install -D vitest`
- [ ] `vitest.config.ts` -- framework config with path aliases matching tsconfig
- [ ] `tests/services/hymns.test.ts` -- covers SC-1, SC-2, SC-4
- [ ] `tests/lib/html-to-pdf.test.ts` -- covers SC-3
- [ ] `tests/fixtures/hymn-html-samples.ts` -- sample HTML strings for parser tests

## Project Constraints (from CLAUDE.md)

- **Tech stack locked:** Next.js 16 App Router, React 19, TypeScript, Tailwind, shadcn/ui
- **PDF engine locked:** @react-pdf/renderer
- **Backend locked:** Directus CMS -- no schema modifications, consume only
- **Language:** UI text and comments in Spanish preferred
- **Import aliases:** Use `@/*` and `@/lib/*`, no relative path crawling
- **Error handling:** try/catch with console.error and rethrow
- **Module design:** Named exports for utilities/services, default exports for React components
- **Naming:** PascalCase for interfaces/types in `.interface.ts` files, camelCase for service functions
- **Directus SDK pattern:** `@ts-ignore` on SDK calls, `as any` for collection names, cast results

## Sources

### Primary (HIGH confidence)
- `contexts/directus.json` -- Full Directus schema with all hymn fields, relations, and file FK constraints
- `app/lib/directus/directus.interface.ts` -- Auto-generated TypeScript types for all collections
- `app/lib/directus/services/events.ts` -- Established service function pattern
- `app/pdf-gen/hymns/[id]/page.tsx` -- Existing getHymn() implementation
- `app/components/pdf-components/pdf-pages/HymnPagePdf.tsx` -- Current HTML parsing (browser-dependent)
- `app/interfaces/Program.interface.ts` -- Existing ActivityHymn, Author, Hymnal interfaces
- npm registry: `node-html-parser@7.1.0`, `@directus/sdk@17.0.2` (installed), `@react-pdf/renderer@3.4.5` (installed)

### Secondary (MEDIUM confidence)
- node-html-parser GitHub README -- API surface (parse, querySelectorAll, textContent, innerHTML)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified in npm registry and/or already installed
- Architecture: HIGH -- directly based on existing codebase patterns and Directus schema
- Pitfalls: HIGH -- derived from actual code issues found in current implementation (browser DOM dependency)
- HTML parser choice: HIGH -- node-html-parser is zero-dependency, server-safe, well-maintained

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable domain, no fast-moving dependencies)
