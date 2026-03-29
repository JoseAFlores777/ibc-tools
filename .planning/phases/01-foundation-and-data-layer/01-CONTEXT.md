# Phase 1: Foundation and Data Layer - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the backend query and parsing infrastructure that all downstream phases depend on: hymn search service, hymn data fetcher, server-safe HTML-to-PDF parser, and audio availability detection with file metadata. No UI work — this is pure service layer.

</domain>

<decisions>
## Implementation Decisions

### HTML Parsing Strategy
- **D-01:** Claude's discretion on the parsing library/approach (node-html-parser, regex, or other). Must work server-side without browser DOM APIs.
- **D-02:** Formatting preservation depends on the PDF style: decorated style should preserve verse structure, bold/italic, and paragraph breaks from the HTML; plain style can use text-only extraction.
- **D-03:** The parser must handle the `letter_hymn` HTML field from Directus and produce react-pdf compatible elements (Text, View).

### Audio Availability Detection
- **D-04:** Service must return file metadata per audio field — not just booleans. Include file name, file size, and format (extension) for each available track (track_only, midi_file, soprano_voice, alto_voice, tenor_voice, bass_voice).
- **D-05:** Audio fields are UUIDs pointing to `directus_files`. Need to resolve these to get metadata.

### Claude's Discretion
- HTML parser library choice (node-html-parser, rehype, regex, etc.)
- How to handle hymns with no audio files in the UX (warning indicator vs silent)
- Search service implementation details (debounce timing, result limits, sort order)
- Data contract shapes — whether to extend existing `ActivityHymn` or create new interfaces

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches that follow existing service patterns.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Directus Schema
- `contexts/directus.json` — Full Directus schema including hymn collection fields, junction tables, and file references

### Existing Service Pattern
- `app/lib/directus/services/events.ts` — Established pattern for Directus service functions (readItems, typed fields, error handling)
- `app/lib/directus.tsx` — Directus SDK singleton client

### Existing Hymn Data Fetching
- `app/pdf-gen/hymns/[id]/page.tsx` — Current `getHymn()` implementation with field selection (lyrics, metadata, authors, hymnal)

### Existing Interfaces
- `app/interfaces/Program.interface.ts` — `ActivityHymn`, `Author`, `Hymnal` interfaces used by PDF components

### PDF Components (for parser output compatibility)
- `app/components/pdf-components/pdf-pages/HymnPagePdf.tsx` — Current hymn PDF renderer (uses `'use client'` and browser DOM — the parser output must be compatible with react-pdf elements this component uses)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getHymn()` in `app/pdf-gen/hymns/[id]/page.tsx`: Fetches hymn by ID with lyrics, metadata, authors, hymnal. Can be extracted and extended for the new service.
- `fetchChurchEvents()` in `app/lib/directus/services/events.ts`: Service pattern to follow — readItems with typed fields, error handling with console.error + rethrow.
- `ActivityHymn` interface: Existing shape for hymn data, already used by HymnPagePdf. May need extension for audio metadata.
- `getDirectus()` singleton: Already established, use this for all Directus calls.

### Established Patterns
- Services use `readItems`/`readItem` from `@directus/sdk` with explicit field selection arrays
- Error handling: try/catch with `console.error` and `throw error`
- Types: interfaces in `.interface.ts` files, PascalCase naming
- `@ts-ignore` used on some Directus SDK calls due to generic type complexity

### Integration Points
- New service functions will live in `app/lib/directus/services/` (new file, e.g., `hymns.ts`)
- HTML parser will be a standalone utility, likely in `app/lib/` or `app/lib/pdf/`
- Downstream Phase 2 will import the parser to render PDFs server-side
- Downstream Phase 3 will import the search and fetch services for API routes

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-and-data-layer*
*Context gathered: 2026-03-28*
