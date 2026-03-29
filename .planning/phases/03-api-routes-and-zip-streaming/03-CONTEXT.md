# Phase 3: API Routes and ZIP Streaming - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Server-side API routes that: (1) expose hymn search results with audio availability flags, (2) accept a POST request specifying hymns + layout + style + audio selections, (3) generate a ZIP containing formatted PDFs and selected audio files, and (4) stream the ZIP to the client as it's assembled. Consumes Phase 1's search/fetch services and Phase 2's `renderHymnPdf()`. Does NOT include any UI — that's Phase 4.

</domain>

<decisions>
## Implementation Decisions

### ZIP Streaming Strategy
- **D-01:** Use `archiver` library (zip format) for streaming ZIP generation. It supports piping entries directly to a writable stream, which bridges cleanly to a Web ReadableStream via Node's stream interop.
- **D-02:** The POST endpoint returns a streaming response using `new Response(readableStream, { headers })` with `Content-Type: application/zip` and `Content-Disposition: attachment; filename="himnos.zip"`. No full buffering in memory.
- **D-03:** PDF buffers from `renderHymnPdf()` are appended to the archiver as Buffer entries. Audio files are piped from Directus download response directly into the archiver (no intermediate disk write).

### Audio File Naming & ZIP Structure
- **D-04:** ZIP uses per-hymn folders: `{hymn_number} - {hymn_name}/` containing the PDF and any audio files for that hymn. If hymn has no number, use `himno-{directus_id}`.
- **D-05:** Audio files keep their original filename from Directus (`directus_files.filename_download`). If unavailable, use `{field_name}.{extension}` (e.g., `soprano_voice.mp3`).
- **D-06:** The combined PDF is placed at the ZIP root as `himnos.pdf`. Individual per-hymn PDFs go inside each hymn's folder as `{hymn_number} - {hymn_name}.pdf`.

### Error Handling During Generation
- **D-07:** If a hymn's PDF fails to render, skip that hymn's PDF entry in the ZIP and include a `{hymn_folder}/ERROR.txt` with the error message. Do not fail the entire ZIP.
- **D-08:** If an audio file download from Directus fails (404, timeout, network error), skip that audio entry and note it in the hymn's `ERROR.txt`. Do not fail the entire ZIP.
- **D-09:** If ALL items fail (every hymn PDF and every audio file), return HTTP 500 with JSON error instead of an empty ZIP.

### Progress Reporting (GEN-03)
- **D-10:** No Server-Sent Events or polling. The client shows a spinner/progress indicator locally while waiting for the ZIP download to start. The streaming response begins as soon as the first entry is ready, so the browser's download indicator provides implicit progress.
- **D-11:** The POST endpoint returns a `X-Hymn-Count` response header with the total number of hymns being processed, which the client can use to set expectations.

### Search Endpoint
- **D-12:** GET `/api/hymns/search` wraps the existing `searchHymns()` service. Query params: `q` (text search), `hymnal` (hymnal ID), `category` (category ID), `limit`, `offset`. Returns JSON with hymn results including audio availability flags per hymn.
- **D-13:** The search endpoint is separate from the ZIP endpoint. Search is GET (cacheable), ZIP generation is POST (stateful).

### Claude's Discretion
- Archiver configuration details (compression level, zip64 support)
- Node.js Readable-to-Web ReadableStream bridging approach
- Request body validation schema (Zod) shape for the POST endpoint
- Whether to generate one combined PDF or individual PDFs per hymn (or both — D-06 says both)
- Rate limiting or request size limits on the ZIP endpoint
- Directus file download authentication (use existing SDK client vs direct URL)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Dependencies (consume these)
- `app/lib/pdf/render-hymn-pdf.ts` — `renderHymnPdf({ hymns, layout, style })` returns `Promise<Buffer>` for PDF generation
- `app/lib/pdf/html-to-pdf.ts` — `parseHymnHtml()` returns `ParsedVerse[]`, consumed internally by renderHymnPdf
- `app/lib/directus/services/hymns.ts` — `searchHymns()`, `fetchHymnForPdf()`, `getAssetUrl()` for hymn data and file URLs
- `app/interfaces/Hymn.interface.ts` — `HymnForPdf`, `HymnSearchResult`, `HymnAudioFiles`, `AudioFileInfo` types

### Existing API Pattern
- `app/api/events/route.ts` — Reference for Next.js Route Handler pattern (NextResponse, error handling, caching headers)

### Directus Schema
- `contexts/directus.json` — Full Directus schema including `directus_files` collection and hymn audio field relationships

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `renderHymnPdf()`: Single entry point for all PDF generation — accepts array of HymnForPdf, returns Buffer. Phase 3 calls this directly.
- `searchHymns()`: Already handles text search, hymnal filter, category filter with pagination. Returns `HymnSearchResult[]` with audio availability.
- `fetchHymnForPdf()`: Fetches full hymn data including letter_hymn HTML for PDF rendering.
- `getAssetUrl()`: Constructs Directus asset download URLs from file UUIDs.
- `getDirectus()`: Singleton Directus SDK client — reuse for file downloads.

### Established Patterns
- API routes use `NextResponse.json()` for JSON responses with try-catch error handling
- `force-dynamic` export for non-cacheable routes
- `console.error()` with descriptive context for error logging
- Directus SDK `readItems()`/`readItem()` for data queries

### Integration Points
- New routes: `app/api/hymns/search/route.ts` (GET) and `app/api/hymns/package/route.ts` (POST)
- POST route consumes `renderHymnPdf()` and Directus file downloads
- GET route wraps `searchHymns()` with HTTP query param parsing

</code_context>

<specifics>
## Specific Ideas

No specific requirements — all decisions made at Claude's discretion based on established patterns and technical constraints.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-api-routes-and-zip-streaming*
*Context gathered: 2026-03-29*
