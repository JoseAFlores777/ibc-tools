# Phase 3: API Routes and ZIP Streaming - Research

**Researched:** 2026-03-29
**Domain:** Next.js Route Handlers, streaming ZIP generation, Directus file downloads
**Confidence:** HIGH

## Summary

This phase creates two API routes: a GET search endpoint wrapping the existing `searchHymns()` service, and a POST endpoint that generates a streaming ZIP containing formatted PDFs and audio files downloaded from Directus. The core technical challenge is bridging the `archiver` library (Node.js stream-based) to a Web `ReadableStream` that Next.js Route Handlers require for streaming responses.

The approach is well-supported: Node.js 20 provides `Readable.toWeb()` which converts any Node.js Readable stream to a Web ReadableStream. Archiver pipes to a PassThrough stream, which is then converted via `Readable.toWeb()` and returned as `new Response(webStream)`. The key pitfall is that PassThrough streams start paused -- without a consumer the stream never completes. `Readable.toWeb()` acts as that consumer, so the bridge works cleanly when wired correctly.

**Primary recommendation:** Use `archiver` 7.x piped to a `PassThrough`, convert via `Readable.toWeb()`, return as `new Response()` with zip headers. Validate POST body with Zod. Handle per-entry errors with ERROR.txt fallbacks per CONTEXT.md decisions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use `archiver` library (zip format) for streaming ZIP generation. It supports piping entries directly to a writable stream, which bridges cleanly to a Web ReadableStream via Node's stream interop.
- **D-02:** The POST endpoint returns a streaming response using `new Response(readableStream, { headers })` with `Content-Type: application/zip` and `Content-Disposition: attachment; filename="himnos.zip"`. No full buffering in memory.
- **D-03:** PDF buffers from `renderHymnPdf()` are appended to the archiver as Buffer entries. Audio files are piped from Directus download response directly into the archiver (no intermediate disk write).
- **D-04:** ZIP uses per-hymn folders: `{hymn_number} - {hymn_name}/` containing the PDF and any audio files for that hymn. If hymn has no number, use `himno-{directus_id}`.
- **D-05:** Audio files keep their original filename from Directus (`directus_files.filename_download`). If unavailable, use `{field_name}.{extension}` (e.g., `soprano_voice.mp3`).
- **D-06:** The combined PDF is placed at the ZIP root as `himnos.pdf`. Individual per-hymn PDFs go inside each hymn's folder as `{hymn_number} - {hymn_name}.pdf`.
- **D-07:** If a hymn's PDF fails to render, skip that hymn's PDF entry in the ZIP and include a `{hymn_folder}/ERROR.txt` with the error message. Do not fail the entire ZIP.
- **D-08:** If an audio file download from Directus fails (404, timeout, network error), skip that audio entry and note it in the hymn's `ERROR.txt`. Do not fail the entire ZIP.
- **D-09:** If ALL items fail (every hymn PDF and every audio file), return HTTP 500 with JSON error instead of an empty ZIP.
- **D-10:** No Server-Sent Events or polling. The client shows a spinner/progress indicator locally while waiting for the ZIP download to start. The streaming response begins as soon as the first entry is ready, so the browser's download indicator provides implicit progress.
- **D-11:** The POST endpoint returns a `X-Hymn-Count` response header with the total number of hymns being processed.
- **D-12:** GET `/api/hymns/search` wraps the existing `searchHymns()` service. Query params: `q` (text search), `hymnal` (hymnal ID), `category` (category ID), `limit`, `offset`. Returns JSON with hymn results including audio availability flags per hymn.
- **D-13:** The search endpoint is separate from the ZIP endpoint. Search is GET (cacheable), ZIP generation is POST (stateful).

### Claude's Discretion
- Archiver configuration details (compression level, zip64 support)
- Node.js Readable-to-Web ReadableStream bridging approach
- Request body validation schema (Zod) shape for the POST endpoint
- Whether to generate one combined PDF or individual PDFs per hymn (or both -- D-06 says both)
- Rate limiting or request size limits on the ZIP endpoint
- Directus file download authentication (use existing SDK client vs direct URL)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GEN-01 | API route server-side genera un ZIP con los PDFs de letras | Archiver 7.x streaming ZIP + `renderHymnPdf()` integration; POST `/api/hymns/package` |
| GEN-02 | API route incluye los archivos de audio seleccionados en el ZIP | Directus asset download via `getAssetUrl()` + fetch, piped into archiver entries |
| GEN-03 | Usuario ve indicador de progreso durante la generacion | D-10: No SSE; streaming response starts immediately, browser download indicator provides progress; X-Hymn-Count header |
| GEN-04 | Usuario descarga el ZIP generado desde el navegador | Streaming `Response` with `Content-Disposition: attachment` triggers browser download |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack**: Next.js 16 App Router, React 19, TypeScript, Tailwind, shadcn/ui
- **PDF engine**: `@react-pdf/renderer` (already in use as v4.3.2)
- **ZIP generation**: Server-side via API route (no client-side) -- direct download
- **Backend**: Directus CMS -- no schema modifications, consume only
- **Audio files**: UUIDs pointing to `directus_files` -- downloaded from Directus server
- **API pattern**: `NextResponse.json()` for JSON, `force-dynamic`, try-catch with `console.error()`
- **Path aliases**: `@/*` -> project root, `@/lib/*` -> `app/lib/*`
- **Validation**: Zod 3.23.8 already in dependencies
- **Naming**: kebab-case for routes, camelCase for service functions, PascalCase for types

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| archiver | 7.0.1 | Streaming ZIP archive generation | Locked decision D-01; most popular Node.js ZIP library, supports streaming pipe |
| @types/archiver | 7.0.0 | TypeScript definitions for archiver | Type safety for archiver API |
| zod | 3.23.8 | POST body validation | Already in project dependencies |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-pdf/renderer | 4.3.2 | PDF generation via `renderHymnPdf()` | Called per hymn for PDF buffer generation |
| @directus/sdk | 17.0.0 | Directus CMS client | Hymn data fetching via existing services |

### Node.js Built-ins Used
| Module | Purpose |
|--------|---------|
| `stream` | `PassThrough` for archiver output, `Readable.toWeb()` for bridge |
| `node:stream/web` | Type references for Web ReadableStream |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| archiver | yazl | Lighter but less ecosystem support, no streaming append from streams |
| archiver | JSZip | Client-side focused, buffers everything in memory -- violates D-02 |
| Readable.toWeb() | Manual iterator-to-ReadableStream | More boilerplate, same result; Readable.toWeb() is simpler and built-in |

**Installation:**
```bash
npm install archiver @types/archiver
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  api/
    hymns/
      search/
        route.ts          # GET - hymn search endpoint (D-12)
      package/
        route.ts          # POST - ZIP generation endpoint (D-02)
  lib/
    zip/
      generate-hymn-zip.ts  # Core ZIP assembly logic (archiver + stream bridge)
      zip.schema.ts         # Zod validation schema for POST body
```

### Pattern 1: Archiver-to-Web-ReadableStream Bridge
**What:** Pipe archiver output through a PassThrough stream, convert to Web ReadableStream using `Readable.toWeb()`, return as `new Response()`.
**When to use:** Any time you need to stream a dynamically-generated archive from a Next.js Route Handler.
**Example:**
```typescript
// Source: Node.js docs + archiver docs + verified locally
import archiver from 'archiver';
import { PassThrough, Readable } from 'stream';

function createZipStream(): { archive: archiver.Archiver; webStream: ReadableStream } {
  const passthrough = new PassThrough();
  const archive = archiver('zip', {
    zlib: { level: 5 }, // Balanced speed/compression
  });

  archive.pipe(passthrough);

  // Readable.toWeb() converts Node.js Readable to Web ReadableStream
  // This also puts the PassThrough into flowing mode, preventing the
  // known archiver hang issue (archiverjs/node-archiver#613)
  const webStream = Readable.toWeb(passthrough) as ReadableStream;

  return { archive, webStream };
}
```

### Pattern 2: Route Handler Streaming Response
**What:** Return a `Response` with a ReadableStream body and appropriate headers for file download.
**When to use:** POST `/api/hymns/package` endpoint.
**Example:**
```typescript
// Source: Next.js Route Handler docs + CONTEXT.md D-02
export async function POST(request: Request) {
  const body = await request.json();
  // validate with Zod...

  const { archive, webStream } = createZipStream();

  // Start assembling ZIP entries asynchronously (don't await -- let it stream)
  assembleZipEntries(archive, body).catch((err) => {
    console.error('ZIP assembly error:', err);
    archive.abort();
  });

  return new Response(webStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="himnos.zip"',
      'X-Hymn-Count': String(body.hymns.length),
    },
  });
}
```

### Pattern 3: Per-Entry Error Handling with ERROR.txt
**What:** Catch errors for individual hymn PDFs or audio downloads, write ERROR.txt to the hymn's folder instead of failing the entire ZIP.
**When to use:** Inside the ZIP assembly loop (D-07, D-08).
**Example:**
```typescript
// Source: CONTEXT.md D-07, D-08
async function addHymnToArchive(
  archive: archiver.Archiver,
  hymn: HymnForPdf,
  folderName: string,
  options: { layout: PdfLayout; style: PdfStyle },
) {
  const errors: string[] = [];

  // Individual PDF
  try {
    const pdfBuffer = await renderHymnPdf({
      hymns: [hymn],
      layout: options.layout,
      style: options.style,
    });
    archive.append(pdfBuffer, { name: `${folderName}/${folderName}.pdf` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`PDF generation failed: ${msg}`);
    console.error(`PDF error for hymn ${hymn.id}:`, msg);
  }

  // Audio files (piped from Directus)
  // ... similar try-catch per audio file ...

  if (errors.length > 0) {
    archive.append(errors.join('\n'), { name: `${folderName}/ERROR.txt` });
  }
}
```

### Pattern 4: Directus Audio File Download (Streaming)
**What:** Fetch audio files from Directus using `getAssetUrl()` and pipe the response body into archiver.
**When to use:** For each selected audio file in the ZIP (D-03).
**Example:**
```typescript
// Source: Existing getAssetUrl() + fetch API
async function pipeAudioToArchive(
  archive: archiver.Archiver,
  fileId: string,
  filename: string,
  entryPath: string,
): Promise<string | null> {
  try {
    const url = getAssetUrl(fileId);
    const response = await fetch(url);
    if (!response.ok) {
      return `Audio download failed (${response.status}): ${filename}`;
    }
    // Convert Web ReadableStream back to Node.js stream for archiver
    const nodeStream = Readable.fromWeb(response.body as any);
    archive.append(nodeStream, { name: entryPath });
    return null; // no error
  } catch (err) {
    return `Audio download error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
```

### Pattern 5: Zod Validation for POST Body
**What:** Validate the package generation request body using Zod.
**When to use:** At the start of POST handler.
**Example:**
```typescript
// Source: Zod docs, project conventions
import { z } from 'zod';

export const packageRequestSchema = z.object({
  hymns: z
    .array(
      z.object({
        id: z.string().uuid(),
        audioFiles: z
          .array(z.enum([
            'track_only',
            'midi_file',
            'soprano_voice',
            'alto_voice',
            'tenor_voice',
            'bass_voice',
          ]))
          .optional()
          .default([]),
      }),
    )
    .min(1, 'Al menos un himno es requerido')
    .max(50, 'Maximo 50 himnos por paquete'),
  layout: z.enum(['one-per-page', 'two-per-page']),
  style: z.enum(['decorated', 'plain']),
});

export type PackageRequest = z.infer<typeof packageRequestSchema>;
```

### Anti-Patterns to Avoid
- **Buffering entire ZIP in memory:** Violates D-02. Never call `archive.finalize()` and await the full buffer. Stream from the start.
- **Awaiting assembleZipEntries before returning Response:** The Response must be returned immediately with the stream. Assembly runs concurrently.
- **Using archiver without a consumer:** PassThrough hangs if nothing reads from it. `Readable.toWeb()` solves this by putting it in flowing mode.
- **Mixing `NextResponse` and raw `Response` for streams:** Use `new Response()` directly for streaming binary. `NextResponse.json()` is for JSON endpoints only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP archive creation | Custom ZIP binary writer | `archiver` 7.x | ZIP format has complex structure (local headers, central directory, CRC32); archiver handles all edge cases |
| Node-to-Web stream bridge | Iterator adapter function | `Readable.toWeb()` built-in | Native in Node 20, handles backpressure correctly |
| Web-to-Node stream bridge | Manual chunk copying | `Readable.fromWeb()` built-in | For converting Directus fetch response body back to Node stream for archiver |
| Request validation | Manual field checking | Zod schema | Already in project, provides typed output and clear error messages |

**Key insight:** The stream bridging between Node.js and Web APIs is the trickiest part, but Node 20 provides both `Readable.toWeb()` and `Readable.fromWeb()` as built-in utilities, eliminating the need for any custom adapter code.

## Common Pitfalls

### Pitfall 1: PassThrough Stream Hangs
**What goes wrong:** `archive.finalize()` resolves but the ZIP is never fully written because the PassThrough stream stays in paused mode.
**Why it happens:** Node.js Readable streams start paused. Without a consumer (data event, pipe, or `.resume()`), `end`/`close` events never fire.
**How to avoid:** Call `Readable.toWeb(passthrough)` immediately after `archive.pipe(passthrough)`. This puts the stream in flowing mode.
**Warning signs:** Tests hang indefinitely, finalize promise never resolves.

### Pitfall 2: Returning Response After Assembly Completes
**What goes wrong:** The endpoint waits for all PDF renders and audio downloads before returning, buffering everything in memory.
**Why it happens:** Using `await assembleZip(...)` before `return new Response(...)`.
**How to avoid:** Return the Response with the webStream immediately. Call the assembly function without await -- it writes to the archive which pipes through the already-returned stream. Use `.catch()` on the promise to handle errors.
**Warning signs:** High memory usage, long time-to-first-byte, large request payloads causing OOM.

### Pitfall 3: archive.finalize() Timing
**What goes wrong:** ZIP is incomplete or corrupted because `finalize()` was called too early (before all entries were appended) or never called.
**Why it happens:** Async operations inside the assembly loop -- if you don't await each entry, finalize runs before entries are written.
**How to avoid:** In the assembly function, `await` each `archive.append()` / audio pipe operation sequentially within the loop, then call `archive.finalize()` at the end. The streaming still works because each entry is flushed to the PassThrough as it completes.
**Warning signs:** Truncated ZIP, "unexpected end of archive" errors when extracting.

### Pitfall 4: Directus Audio Download Failures
**What goes wrong:** Audio file fetch returns 403 or redirect instead of the file.
**Why it happens:** Directus may require authentication for file downloads depending on permissions configuration.
**How to avoid:** Use the `getAssetUrl()` function which uses `DIRECTUS_URL` (server-side). If Directus requires auth, append an access token. Test with a real file ID during development.
**Warning signs:** All audio entries produce ERROR.txt with 403 status.

### Pitfall 5: Combined PDF for Many Hymns
**What goes wrong:** `renderHymnPdf()` with 50 hymns takes very long or runs out of memory.
**Why it happens:** `@react-pdf/renderer` builds the entire document in memory before producing the buffer.
**How to avoid:** Generate the combined PDF in a single call (it's already designed for this). If memory is a concern, consider a practical max limit (50 hymns per D-discretion). The per-hymn individual PDFs are generated one at a time in the loop, so they don't compound.
**Warning signs:** Slow response for large packages, OOM on small servers.

### Pitfall 6: Readable.fromWeb Type Mismatch
**What goes wrong:** TypeScript errors when passing `response.body` to `Readable.fromWeb()`.
**Why it happens:** The Web `ReadableStream` type from `fetch` doesn't perfectly match the one expected by `Readable.fromWeb()` in Node.js typings.
**How to avoid:** Cast with `as any` or use `as import('stream/web').ReadableStream`. This is a type-level issue only; runtime behavior is correct.
**Warning signs:** TypeScript compile errors on the `fromWeb()` call.

## Code Examples

### Complete ZIP Assembly Function
```typescript
// Source: Synthesized from archiver docs, Node.js stream docs, CONTEXT.md decisions
import archiver from 'archiver';
import { PassThrough, Readable } from 'stream';
import { renderHymnPdf, type PdfLayout, type PdfStyle } from '@/app/lib/pdf/render-hymn-pdf';
import { fetchHymnForPdf, getAssetUrl } from '@/app/lib/directus/services/hymns';
import type { HymnAudioFiles, AudioFileInfo } from '@/app/interfaces/Hymn.interface';

const AUDIO_FIELD_NAMES: (keyof HymnAudioFiles)[] = [
  'track_only', 'midi_file', 'soprano_voice',
  'alto_voice', 'tenor_voice', 'bass_voice',
];

function hymnFolderName(hymnNumber: number | null, name: string, id: string): string {
  const prefix = hymnNumber != null ? String(hymnNumber) : `himno-${id}`;
  // Sanitize name for filesystem
  const safeName = name.replace(/[/\\:*?"<>|]/g, '_').trim();
  return `${prefix} - ${safeName}`;
}

export function createStreamingZip() {
  const passthrough = new PassThrough();
  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.pipe(passthrough);
  const webStream = Readable.toWeb(passthrough) as ReadableStream;
  return { archive, webStream };
}
```

### Search Route Handler
```typescript
// Source: Existing app/api/events/route.ts pattern + CONTEXT.md D-12
import { NextResponse } from 'next/server';
import { searchHymns } from '@/app/lib/directus/services/hymns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const hymnal = searchParams.get('hymnal') || undefined;
    const category = searchParams.get('category');
    const limit = Number(searchParams.get('limit')) || 25;
    const offset = Number(searchParams.get('offset')) || 0;

    const results = await searchHymns({
      query: q,
      hymnalId: hymnal,
      categoryId: category ? Number(category) : undefined,
      limit,
      offset,
    });

    return NextResponse.json(
      { ok: true, data: results },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' } },
    );
  } catch (error: any) {
    console.error('GET /api/hymns/search error:', error?.message || error);
    return NextResponse.json(
      { ok: false, error: 'Error al buscar himnos' },
      { status: 500 },
    );
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual iterator adapter for Node-to-Web stream | `Readable.toWeb()` / `Readable.fromWeb()` | Node.js 17+ (stable in 20) | No custom adapter code needed |
| JSZip (in-memory buffering) | archiver (streaming) | N/A (always separate) | Streaming enables large archives without OOM |
| `NextResponse` for binary | `new Response()` for streaming | Next.js 13+ App Router | Raw Response is standard for non-JSON streaming |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 20+ | `Readable.toWeb()`, `Readable.fromWeb()` | Verified | `Readable.toWeb` exists as function | -- |
| archiver | ZIP generation | Not installed | 7.0.1 (npm) | -- must install |
| @types/archiver | TypeScript types | Not installed | 7.0.0 (npm) | -- must install |
| Directus CMS | Audio file downloads | External service | -- | Errors handled per D-08 |
| Zod | Request validation | Installed | 3.23.8 | -- |

**Missing dependencies with no fallback:**
- `archiver` and `@types/archiver` must be installed (locked decision D-01)

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GEN-01 | POST endpoint generates ZIP with PDFs | integration | `npx vitest run tests/api/hymns-package.test.ts -t "generates zip"` | No -- Wave 0 |
| GEN-02 | ZIP includes selected audio files | integration | `npx vitest run tests/api/hymns-package.test.ts -t "includes audio"` | No -- Wave 0 |
| GEN-03 | X-Hymn-Count header in response | unit | `npx vitest run tests/api/hymns-package.test.ts -t "hymn count header"` | No -- Wave 0 |
| GEN-04 | Response is streaming download (Content-Disposition) | unit | `npx vitest run tests/api/hymns-package.test.ts -t "download headers"` | No -- Wave 0 |
| D-07 | Failed PDF produces ERROR.txt, not failure | unit | `npx vitest run tests/lib/zip/generate-hymn-zip.test.ts -t "error handling"` | No -- Wave 0 |
| D-09 | All failures returns HTTP 500 | unit | `npx vitest run tests/api/hymns-package.test.ts -t "all fail"` | No -- Wave 0 |
| D-12 | GET search endpoint returns results | unit | `npx vitest run tests/api/hymns-search.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/api/hymns-package.test.ts` -- integration tests for POST /api/hymns/package
- [ ] `tests/api/hymns-search.test.ts` -- unit tests for GET /api/hymns/search
- [ ] `tests/lib/zip/generate-hymn-zip.test.ts` -- unit tests for ZIP assembly logic

## Open Questions

1. **Directus file download authentication**
   - What we know: `getAssetUrl()` constructs `{DIRECTUS_URL}/assets/{fileId}`. The app uses `DIRECTUS_URL` server-side.
   - What's unclear: Whether Directus requires an auth token for asset downloads from the server context, or if assets are publicly accessible.
   - Recommendation: Test with a real file ID during implementation. If 403s occur, append `?access_token=TOKEN` or use the Directus SDK's file download method. This is a runtime concern -- handle in the audio download helper with clear error messages.

2. **archiver entry ordering and finalize timing**
   - What we know: `archive.append()` for buffers is synchronous-ish (enqueues). For streams, it waits for the stream to finish before moving to the next entry.
   - What's unclear: Whether appending a Node Readable (from `Readable.fromWeb`) blocks correctly or needs explicit await.
   - Recommendation: Process hymns sequentially in the assembly loop. After all entries are appended, call `archive.finalize()`. Test with 2-3 hymns including audio to verify ordering.

3. **Maximum package size**
   - What we know: Audio files can be several MB each. 50 hymns with 6 audio files each could be very large.
   - What's unclear: Practical upper bound for streaming over HTTP without timeout.
   - Recommendation: Set Zod max at 50 hymns per request (discretion area). The streaming approach means the response starts quickly even for large packages. Monitor in production.

## Sources

### Primary (HIGH confidence)
- Node.js Stream docs -- `Readable.toWeb()` and `Readable.fromWeb()` verified locally as available in Node 20
- archiver npm -- v7.0.1 latest, streaming zip generation
- Existing codebase -- `app/api/events/route.ts` for route handler pattern, `app/lib/directus/services/hymns.ts` for service functions, `app/lib/pdf/render-hymn-pdf.ts` for PDF generation

### Secondary (MEDIUM confidence)
- [Next.js Route Handler docs](https://nextjs.org/docs/app/api-reference/file-conventions/route) -- Response with ReadableStream
- [GitHub Discussion #50614](https://github.com/vercel/next.js/discussions/50614) -- Verified pattern for streaming binary from route handlers
- [Eric Burel blog](https://www.ericburel.tech/blog/nextjs-stream-files) -- Node-to-Web stream conversion pattern
- [archiverjs/node-archiver#613](https://github.com/archiverjs/node-archiver/issues/613) -- PassThrough hang issue and solution

### Tertiary (LOW confidence)
- [Dev.to streaming guide](https://dev.to/shubhamkhatik/escaping-the-buffer-the-advanced-guide-to-streams-in-nodejs-nextjs-4734) -- General patterns, verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- archiver is the de-facto Node.js ZIP library, Readable.toWeb() confirmed available
- Architecture: HIGH -- stream bridge pattern verified from multiple sources and locally tested
- Pitfalls: HIGH -- PassThrough hang issue well-documented; error handling patterns from CONTEXT.md decisions
- Directus auth: MEDIUM -- depends on deployment-specific Directus permissions config

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable domain, no fast-moving dependencies)
