# Architecture Patterns

**Domain:** Hymn Packager (ZIP generator with PDFs + audio bundling)
**Researched:** 2026-03-28

## Recommended Architecture

The hymn packager introduces a **client-driven wizard that posts to a server-side ZIP generation API route**. It is the first feature in ibc-tools that requires significant client-side state (multi-step wizard with selections) combined with a heavy server-side operation (PDF rendering + file fetching + ZIP assembly). The architecture adds three new boundaries to the existing system while reusing the Directus service layer and PDF component patterns already in place.

### High-Level Flow

```
Browser (Wizard UI)                    Next.js Server (API Route)              Directus CMS
  |                                       |                                      |
  |  1. Fetch hymn list (filters)         |                                      |
  |-------------------------------------->|  2. readItems('hymn', filters)        |
  |                                       |------------------------------------->|
  |                                       |<-------------------------------------|
  |<--------------------------------------|                                      |
  |                                       |                                      |
  |  3. POST /api/hymn-packager/generate  |                                      |
  |    { hymnIds, layout, audioTracks }   |                                      |
  |-------------------------------------->|  4. For each hymn:                   |
  |                                       |    a. readItem('hymn', id)           |
  |                                       |------------------------------------->|
  |                                       |    b. renderToBuffer(<HymnPage/>)    |
  |                                       |    c. fetch audio files from         |
  |                                       |       DIRECTUS_URL/assets/{uuid}     |
  |                                       |------------------------------------->|
  |                                       |  5. Assemble ZIP (archiver)          |
  |                                       |  6. Stream ZIP response              |
  |<--------------------------------------|                                      |
  |  7. Browser downloads ZIP             |                                      |
```

### Component Boundaries

| Component | Responsibility | Location | Communicates With |
|-----------|---------------|----------|-------------------|
| **Wizard Page** | Multi-step UI: hymn selection, config, download | `app/empaquetador/` (client components) | Hymn Search API, ZIP Generation API |
| **Hymn Search API** | Query hymns with filters, return list for selection | `app/api/hymn-packager/hymns/route.ts` | Directus Service Layer |
| **ZIP Generation API** | Orchestrate PDF rendering + audio fetching + ZIP assembly | `app/api/hymn-packager/generate/route.ts` | PDF Renderer, Directus Asset API, Directus Service Layer |
| **Hymn Service** | Fetch hymn data from Directus (list and detail) | `app/lib/directus/services/hymns.ts` | Directus SDK Client |
| **PDF Page Components** | Render hymn content as PDF pages (multiple layouts) | `app/components/pdf-components/pdf-pages/` | None (pure render) |
| **PDF Document Assembler** | Server-side function that calls `renderToBuffer()` | `app/lib/pdf/hymn-pdf.ts` | PDF Page Components |
| **ZIP Assembler** | Stream-assemble ZIP from PDF buffers + audio buffers | `app/lib/zip/assembler.ts` | None (pure utility) |

## Data Flow

### Step 1: Hymn Search and Selection (Client -> Server -> Directus)

The wizard's first step needs a searchable, filterable hymn list. This is a new API route because the client component needs to issue dynamic queries with user-typed filters.

1. Client component sends GET `/api/hymn-packager/hymns?search=...&hymnal=...&category=...`
2. API route calls `searchHymns()` from the hymn service
3. Service queries Directus `hymn` collection with field selection (id, name, hymn_number, hymnal.name, categories, available audio flags)
4. Returns lightweight hymn summaries (not full lyrics or audio UUIDs)

**Key design decision:** Return boolean flags for audio availability (`has_track_only`, `has_soprano`, etc.) instead of raw UUIDs. The client only needs to know what is available for the selection UI; the actual UUIDs are fetched server-side during ZIP generation.

### Step 2: Configuration (Client-Only State)

No server communication. The wizard stores in React state:
- Selected hymn IDs (from step 1)
- Print layout config: page size (LETTER), hymns per page (1, 2, or 4), orientation
- Style config: decorated vs plain
- Per-hymn audio selections: which tracks to include (track_only, midi_file, soprano_voice, etc.)

Use `react-hook-form` + Zod for this form state. The existing stack already has both.

### Step 3: ZIP Generation (Client -> Server -> Directus -> Response)

1. Client POSTs to `/api/hymn-packager/generate` with the full configuration payload
2. API route validates the payload with Zod
3. For each selected hymn:
   a. Fetch full hymn data from Directus (lyrics, authors, hymnal, bible text)
   b. Render PDF buffer using `renderToBuffer()` from `@react-pdf/renderer`
   c. For each selected audio track, fetch the binary from `{DIRECTUS_URL}/assets/{uuid}`
4. Stream all buffers into a ZIP using `archiver`
5. Return the ZIP as a streaming response with `Content-Disposition: attachment`

### Data Model: ZIP Generation Request

```typescript
// Zod schema for the POST body
const GeneratePackageSchema = z.object({
  hymns: z.array(z.object({
    id: z.string().uuid(),
    audioTracks: z.array(z.enum([
      'track_only', 'midi_file', 'dynamic_track_midi',
      'soprano_voice', 'alto_voice', 'tenor_voice', 'bass_voice'
    ])).default([]),
  })).min(1).max(50),
  layout: z.object({
    hymnsPerPage: z.enum(['1', '2', '4']),
    orientation: z.enum(['portrait', 'landscape']),
    style: z.enum(['decorated', 'plain']),
  }),
});
```

### Data Model: Directus Hymn Audio Fields

From the auto-generated types, a `Hymn` has these file reference fields (all are UUID strings pointing to `directus_files`):

| Field | Type | Content |
|-------|------|---------|
| `track_only` | UUID -> DirectusFiles | Full accompaniment audio |
| `midi_file` | UUID -> DirectusFiles | MIDI file |
| `dynamic_track_midi` | UUID -> DirectusFiles | Dynamic MIDI track |
| `soprano_voice` | UUID -> DirectusFiles | Soprano vocal track |
| `alto_voice` | UUID -> DirectusFiles | Alto vocal track |
| `tenor_voice` | UUID -> DirectusFiles | Tenor vocal track |
| `bass_voice` | UUID -> DirectusFiles | Bass vocal track |
| `pro_file` | UUID -> DirectusFiles | Pro file (out of scope) |

Audio files are downloaded server-side via `GET {DIRECTUS_URL}/assets/{uuid}` which returns the binary with proper Content-Type.

## Patterns to Follow

### Pattern 1: Server-Side PDF with `renderToBuffer()`

**What:** The existing PDF components use `PDFViewer` (client-side rendering in browser). For ZIP generation, PDFs must be rendered server-side to Buffer using `renderToBuffer()` from `@react-pdf/renderer`.

**Why this matters:** The current `HymnPagePdf` component uses `document.createElement()` for HTML parsing of `letter_hymn` (the `extractParagraphs` function). This will NOT work server-side. The HTML parsing must be refactored to use a Node.js-compatible approach (regex or a library like `node-html-parser`).

**When:** ZIP generation API route, server-side only.

**Example:**
```typescript
import { renderToBuffer } from '@react-pdf/renderer';
import { Document } from '@react-pdf/renderer';

// Server-side PDF generation
async function generateHymnPdf(hymnData: HymnForPdf): Promise<Buffer> {
  const pdfBuffer = await renderToBuffer(
    <Document title={`${hymnData.hymn_number} - ${hymnData.name}`}>
      <HymnPagePdfServer hymn={hymnData} />
    </Document>
  );
  return pdfBuffer;
}
```

**Confidence:** MEDIUM -- `renderToBuffer` is a documented export of `@react-pdf/renderer` in v3.x. Needs verification that it works correctly in Next.js 16 server context.

### Pattern 2: Streaming ZIP Response with Archiver

**What:** Use the `archiver` npm package to stream a ZIP file as the HTTP response. Archiver supports streaming (pipe to a writable stream) which avoids buffering the entire ZIP in memory.

**When:** ZIP generation API route response.

**Example:**
```typescript
import archiver from 'archiver';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // ... validate, fetch data, generate PDFs ...

  const archive = archiver('zip', { zlib: { level: 5 } });

  // Add PDF buffers
  archive.append(pdfBuffer, { name: 'himnos/001-himno.pdf' });

  // Add audio buffers
  archive.append(audioBuffer, { name: 'audio/001-himno-soprano.mp3' });

  archive.finalize();

  // Convert archiver stream to Web ReadableStream for Next.js
  const readableStream = new ReadableStream({
    start(controller) {
      archive.on('data', (chunk) => controller.enqueue(chunk));
      archive.on('end', () => controller.close());
      archive.on('error', (err) => controller.error(err));
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="paquete-himnos.zip"',
    },
  });
}
```

**Confidence:** MEDIUM -- Archiver is the most established ZIP library for Node.js streaming. The Node-to-Web-ReadableStream bridge pattern is standard but needs testing in Next.js 16 API routes specifically.

### Pattern 3: Directus Asset Download (Server-Side)

**What:** Fetch binary files from Directus using the public assets endpoint. No SDK method needed -- just a plain `fetch()` to `{DIRECTUS_URL}/assets/{uuid}`.

**When:** Downloading audio files for inclusion in the ZIP.

**Example:**
```typescript
async function fetchDirectusAsset(fileUuid: string): Promise<Buffer> {
  const baseUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
  const response = await fetch(`${baseUrl}/assets/${fileUuid}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Failed to fetch asset ${fileUuid}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

**Confidence:** HIGH -- This is the standard Directus file access pattern. The `/assets/{uuid}` endpoint is public by default if the file's folder permissions allow it.

### Pattern 4: Wizard State Management with react-hook-form

**What:** Use `react-hook-form` with Zod resolver for the multi-step wizard. Each step maps to a section of the form schema. Use `useForm` at the wizard container level and pass control/register to step components.

**Why not zustand/jotai:** The wizard state is local to a single page with a single form. No cross-page state needed. `react-hook-form` is already in the stack and handles validation natively.

**Confidence:** HIGH -- `react-hook-form` is already in `package.json` and used in the cards demo.

### Pattern 5: Service Layer for Hymns

**What:** Create `app/lib/directus/services/hymns.ts` following the exact same pattern as `events.ts`. Two functions: `searchHymns()` for the list view (lightweight fields) and `fetchHymnForPdf()` for full data needed during PDF generation.

**Confidence:** HIGH -- Direct extension of existing pattern.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side ZIP Assembly
**What:** Generating the ZIP in the browser using JSZip or similar.
**Why bad:** Audio files would need to be fetched from Directus through the browser (CORS issues, Directus URL exposure), PDFs would need client-side rendering (already problematic with current `document.createElement` approach), and large ZIPs would consume browser memory.
**Instead:** Server-side ZIP generation via API route. The server has direct access to Directus, can use `renderToBuffer()`, and can stream the response.

### Anti-Pattern 2: Buffering Entire ZIP Before Sending
**What:** Generating all PDFs and fetching all audio into memory, then creating the ZIP, then sending.
**Why bad:** For 50 hymns with audio tracks, memory usage could spike significantly. The Docker container runs on limited resources.
**Instead:** Use archiver's streaming API. Add files to the archive as they are generated, pipe the archive stream directly to the response.

### Anti-Pattern 3: Reusing Client-Side PDF Components Directly
**What:** Importing `HymnPagePdf` (which uses `document.createElement`) in the server-side ZIP generator.
**Why bad:** `document` does not exist in Node.js. The HTML-to-text extraction in the current component will throw.
**Instead:** Create server-compatible versions of the PDF page components, or extract the HTML parsing into a shared utility that uses `node-html-parser` instead of DOM APIs.

### Anti-Pattern 4: Single API Route for Everything
**What:** One mega route that handles hymn search, hymn detail, and ZIP generation.
**Why bad:** The search endpoint is GET with query params (lightweight, cacheable). The ZIP generator is POST with a body (heavy, non-cacheable). Different concerns, different HTTP methods, different caching strategies.
**Instead:** Separate routes: `/api/hymn-packager/hymns` (GET, search) and `/api/hymn-packager/generate` (POST, ZIP).

### Anti-Pattern 5: Sending Audio UUIDs to the Client
**What:** Including Directus file UUIDs in the hymn search response sent to the browser.
**Why bad:** Exposes internal Directus asset identifiers. If Directus requires token-based access later, the client would need credentials.
**Instead:** Send boolean availability flags to the client. The server fetches actual files by UUID during generation.

## ZIP Directory Structure

The generated ZIP should have a clean, user-friendly structure:

```
paquete-himnos/
  himnos/
    001-NombreDelHimno.pdf
    002-OtroHimno.pdf
    ...
  audio/
    001-NombreDelHimno/
      pista.mp3
      soprano.mp3
      alto.mp3
      ...
    002-OtroHimno/
      pista.mp3
      midi.mid
      ...
```

## Component Dependency Graph and Build Order

```
Phase 1: Foundation (no dependencies)
  |
  +-- Hymn Service (services/hymns.ts)
  |     Depends on: Directus client (existing)
  |
  +-- Server-safe HTML parser utility
  |     Depends on: nothing
  |
  Phase 2: PDF Adaptation (depends on Phase 1)
  |
  +-- Server-compatible HymnPagePdf variants
  |     Depends on: Hymn Service, HTML parser utility
  |     Includes: new layouts (2-up, 4-up, plain style)
  |
  +-- PDF Document Assembler (renderToBuffer wrapper)
  |     Depends on: Server PDF components
  |
  Phase 3: API Routes (depends on Phase 2)
  |
  +-- Hymn Search API (/api/hymn-packager/hymns)
  |     Depends on: Hymn Service
  |
  +-- ZIP Generation API (/api/hymn-packager/generate)
  |     Depends on: PDF Assembler, Directus asset fetcher, archiver
  |
  Phase 4: Wizard UI (depends on Phase 3)
  |
  +-- Wizard container with react-hook-form
  |     Depends on: API routes (fetch/post)
  |
  +-- Step 1: Hymn selector with search/filters
  +-- Step 2: Layout + audio config
  +-- Step 3: Generate + download
```

**Build order rationale:**
1. **Hymn Service first** because everything else depends on being able to query hymn data
2. **PDF adaptation second** because the server-side HTML parsing refactor is the highest-risk piece (current code uses browser DOM APIs) and must be validated before building the ZIP pipeline
3. **API routes third** because they integrate the service + PDF layers and can be tested independently with curl/Postman before any UI exists
4. **Wizard UI last** because it is the consumer of the APIs and has the least technical risk (standard react-hook-form patterns with shadcn/ui components)

## Scalability Considerations

| Concern | 1-5 hymns | 10-20 hymns | 50 hymns (max) |
|---------|-----------|-------------|----------------|
| Memory | Trivial (~10MB) | Moderate (~50MB) | Needs streaming (~150MB+) |
| Response time | 2-5 seconds | 10-20 seconds | 30-60 seconds |
| PDF generation | Sequential OK | Sequential OK | Consider parallel with `Promise.all` (batched) |
| Audio fetch | Sequential OK | Parallel recommended | Parallel with concurrency limit (5 at a time) |

For the 50-hymn case, use `Promise.all` with a concurrency limiter (e.g., `p-limit` or manual batching) to avoid overwhelming the Directus server with simultaneous requests.

The client should show a progress indicator during generation. Since the ZIP streams as it is built, the browser will show download progress natively once the response starts flowing.

## New Dependencies Required

| Package | Purpose | Confidence |
|---------|---------|------------|
| `archiver` | Server-side ZIP streaming | HIGH -- battle-tested, 20M+ weekly downloads |
| `node-html-parser` | Parse `letter_hymn` HTML server-side (replace `document.createElement`) | HIGH -- lightweight, no dependencies |
| `p-limit` | Concurrency control for parallel Directus fetches | MEDIUM -- could use manual batching instead |

`file-saver` is already in `package.json` but is NOT needed for this feature -- the ZIP downloads via native browser `Content-Disposition: attachment` handling, not via client-side blob saving.

## Sources

- Existing codebase analysis: `app/components/pdf-components/`, `app/lib/directus/`, `app/api/events/route.ts`
- Directus auto-generated types: `app/lib/directus/directus.interface.ts` (Hymn type at line 524)
- Current PDF rendering pattern: `app/pdf-gen/hymns/[id]/page.tsx`
- `@react-pdf/renderer` v3.4.4 (installed in package.json)
- Directus asset endpoint: standard `/assets/{uuid}` pattern

---

*Architecture analysis: 2026-03-28*
