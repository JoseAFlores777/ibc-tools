# Domain Pitfalls

**Domain:** Server-side ZIP generation with PDF + audio bundling in Next.js
**Researched:** 2026-03-28

## Critical Pitfalls

Mistakes that cause rewrites, OOM crashes, or unusable features.

### Pitfall 1: Buffering the Entire ZIP in Memory

**What goes wrong:** The API route generates all PDFs and downloads all audio files into memory, then constructs the ZIP buffer, then sends it. For a package of 20 hymns with 4 voice tracks each (soprano, alto, tenor, bass) plus track_only and midi_file, this can easily be 200-500 MB of audio data held simultaneously in Node.js heap memory.

**Why it happens:** The naive approach is `archiver` or `jszip` building the full archive into a Buffer, then returning `new NextResponse(buffer)`. This works for small payloads but collapses at scale. `jszip` in particular is entirely in-memory with no streaming option.

**Consequences:**
- Node.js process OOM kill (standalone Next.js Docker container has ~512 MB default heap)
- Concurrent requests multiply the problem -- two users generating packages simultaneously = 2x memory
- Docker container restarts, affecting all users of ibc-tools (horarios, programs, etc.)

**Prevention:**
- Use `archiver` (not `jszip`) with pipe-to-stream architecture. Create the ZIP as a readable stream and pipe it directly to the HTTP response.
- In Next.js App Router, return a `new Response(readableStream)` from the route handler with proper headers, never accumulating the full buffer.
- Stream audio files from Directus directly into the archiver without buffering: `fetch()` the Directus asset URL, get the response body as a readable stream, and `archive.append(stream, { name: 'filename.mp3' })`.
- Set `NODE_OPTIONS=--max-old-space-size=1024` in Docker as a safety net, but streaming is the real fix.

**Detection:** Monitor response times and memory usage during testing with 10+ hymns. If response time grows linearly with hymn count, you are buffering.

**Phase relevance:** ZIP generation API route implementation (core phase).

---

### Pitfall 2: @react-pdf/renderer Memory Accumulation on Repeated Renders

**What goes wrong:** `@react-pdf/renderer`'s `renderToBuffer()` / `renderToStream()` leaks memory when called repeatedly in the same process. Font registration, style resolution, and layout engine state accumulate. After generating 20-30 PDFs in a single request, memory usage spikes and may not fully GC.

**Why it happens:** `@react-pdf/renderer` was designed for rendering one document at a time in a browser context, not batch server-side generation. The existing codebase registers fonts at module level (`Font.register()` in `HymnPagePdf.tsx` line 11-14) which is fine for single renders but the layout engine creates internal caches that grow.

**Consequences:**
- Progressively slower PDF generation within a single ZIP request
- Memory not reclaimed between PDF renders in the same request lifecycle
- Eventual OOM on large packages (30+ hymns)

**Prevention:**
- Generate PDFs sequentially (not `Promise.all`) to limit concurrent memory usage. Each PDF should complete and its buffer should be piped to the archiver before starting the next.
- Use `renderToStream()` instead of `renderToBuffer()` and pipe each PDF stream directly into the archiver entry.
- Set a hard limit on hymns per package (e.g., 50 hymns max) and validate on the client before sending the request.
- Consider isolating PDF generation into a worker thread (`worker_threads`) for true memory isolation if memory issues persist.

**Detection:** Log `process.memoryUsage().heapUsed` before and after each PDF render during development. If delta per render exceeds 5-10 MB and does not decrease, there is a leak.

**Phase relevance:** ZIP generation API route implementation (core phase).

---

### Pitfall 3: Next.js Route Handler Response Size and Timeout Limits

**What goes wrong:** Next.js standalone server (and especially Vercel/serverless deployments) has default response size limits and execution timeouts. The standalone Docker deployment is less restrictive, but the Node.js HTTP server still has default timeouts (2 minutes). A ZIP with 20 hymns and audio tracks can take 30-120 seconds to generate and stream.

**Why it happens:** Developers test with 2-3 hymns (fast), deploy, then users select 20+ hymns and the request times out or the connection drops.

**Consequences:**
- Users get a network error or partial/corrupt ZIP download
- No feedback during generation (browser shows spinner for minutes)
- Reverse proxy (Dokploy/nginx) may terminate the connection before Node.js does

**Prevention:**
- Configure the route handler with appropriate timeout: in Next.js 16 App Router, export `const maxDuration = 120` (or higher) in the route file.
- Set proxy timeouts in Dokploy/nginx to match or exceed the route timeout (proxy_read_timeout 180s).
- Implement Server-Sent Events or a polling endpoint for progress: POST to start generation (returns a job ID), GET to poll status, GET to download when ready. This decouples generation from the HTTP response timeout.
- As a simpler alternative for v1: start streaming the response immediately (HTTP 200 with `Transfer-Encoding: chunked`) so the connection stays alive while the ZIP streams. The archiver pipe approach naturally does this.

**Detection:** Test with the maximum expected package size (e.g., 30 hymns, all voice tracks) on the actual Docker deployment, not just `npm run dev`.

**Phase relevance:** ZIP generation API route implementation + Docker/deployment configuration.

---

### Pitfall 4: Directus File Downloads Failing Silently

**What goes wrong:** Audio file UUIDs in the `hymn` collection (`track_only`, `midi_file`, `soprano_voice`, etc.) reference `directus_files`. When downloading, the Directus asset endpoint (`/assets/{uuid}`) may return 403 (permissions), 404 (file deleted), or timeout. The ZIP gets generated with missing files and the user does not know.

**Why it happens:** The hymn data says a voice track exists (UUID is not null), but the actual file may be inaccessible. Directus file permissions, storage backend issues (the `s3.joseiz.com` remote pattern suggests S3 storage), or simply deleted files cause silent failures. Developers typically handle the "happy path" and `catch` errors with a `console.error`.

**Consequences:**
- ZIP delivered with missing audio files -- user discovers the problem only after extracting
- If errors are not caught per-file, one missing file crashes the entire ZIP generation
- No way for the user to know which files were unavailable

**Prevention:**
- Wrap each file download in individual try/catch. On failure, either skip the file and record it, or include a placeholder text file explaining the file was unavailable.
- Return a manifest/summary in the ZIP (e.g., `CONTENIDO.txt`) listing all included files and any that failed.
- Validate file existence before starting ZIP generation: query Directus for the file metadata (HEAD request or read the `directus_files` record) to pre-check availability. This lets you warn the user before they wait for generation.
- Use the server-side `DIRECTUS_URL` (not the public one) for asset downloads to avoid CORS and public access restrictions.

**Detection:** Test with a hymn that has a null or invalid UUID for one of its audio fields. Ensure the ZIP still generates successfully with the remaining files.

**Phase relevance:** Directus service layer for file downloads (early phase), ZIP generation (core phase).

---

### Pitfall 5: Corrupt ZIP from Premature Stream Closure

**What goes wrong:** The archiver stream finalizes before all entries (PDFs + audio files) have been fully written. The resulting ZIP file is corrupt -- it opens but some files are truncated or missing.

**Why it happens:** Stream piping is asynchronous. If `archive.finalize()` is called before all `archive.append(stream)` calls have completed draining, or if an error in one stream is not propagated to abort the whole archive, the ZIP file format is left in an inconsistent state. This is especially common when mixing `archiver.append()` with async/await incorrectly.

**Consequences:**
- Users download a ZIP that appears valid but contains corrupt files
- Intermittent -- works with small packages, fails with larger ones (race condition)
- Extremely difficult to debug in production

**Prevention:**
- Process entries sequentially: await each `archive.append()` + drain before appending the next entry. Do not use `Promise.all` for appending multiple streams to the archiver.
- Listen for archiver's `'warning'` and `'error'` events and abort the response on error.
- After `archive.finalize()`, await the `'end'` event on the output stream before considering the response complete.
- In the route handler, use `archive.pipe(responseStream)` and let the archiver manage backpressure naturally.

**Detection:** Generate ZIPs with 10+ entries in automated tests. Verify each entry can be extracted. Use `unzip -t` to test integrity.

**Phase relevance:** ZIP generation API route implementation (core phase).

## Moderate Pitfalls

### Pitfall 6: Filename Collisions and Encoding in ZIP

**What goes wrong:** Two hymns with the same name produce duplicate filenames in the ZIP. Or hymn names with special characters (accents are common in Spanish: "Cuan Grande es El", tildes, question marks) produce filenames that break on Windows extraction.

**Prevention:**
- Use a naming scheme that includes the hymn number or ID: `001_Cuan_Grande_es_El/letra.pdf`, `001_Cuan_Grande_es_El/pista.mp3`.
- Sanitize filenames: replace accented characters with ASCII equivalents, remove special chars, limit length to 100 chars.
- Organize by folder per hymn to avoid flat namespace collisions.

**Phase relevance:** ZIP structure design (early phase).

---

### Pitfall 7: PDF Layout Changes Breaking Multi-Hymn-Per-Page Layouts

**What goes wrong:** The PROJECT.md specifies layouts of 1, 2, or 4 hymns per page. The existing `HymnPagePdf` component renders a single hymn per page with fixed styling (header image, gradients, borders). Adapting this to 2-up or 4-up layout is not a simple scale-down -- text becomes unreadable, headers take too much space, and page breaks land in the middle of verses.

**Why it happens:** `@react-pdf/renderer` does not support CSS grid or flexbox-wrap. Laying out multiple hymns on a single page requires manual calculation of available space, and hymn content length varies wildly (some hymns have 2 verses, others have 8).

**Consequences:**
- Hymn text overflows the allocated area and is cut off
- Inconsistent visual quality between 1-up (which looks great) and 4-up (which looks broken)
- Significant development time spent on layout math

**Prevention:**
- Design the multi-hymn layouts as new components from scratch rather than trying to scale down the existing `HymnPagePdf`.
- For 4-up layout, use the "texto plano minimalista" style only (no headers, no images, no borders) -- this is explicitly in the requirements as a style option.
- Implement content measurement: estimate verse count and text length to decide if a hymn fits in its allocated slot, and overflow to the next page if not.
- Test with the longest hymn in the database and the shortest, in all layout combinations.

**Detection:** Visual testing with actual hymn data from Directus, not lorem ipsum. Pay special attention to hymns with 6+ verses.

**Phase relevance:** PDF layout/style implementation phase.

---

### Pitfall 8: No Request Deduplication or Rate Limiting

**What goes wrong:** A user clicks "Generate" multiple times (because no loading feedback), or multiple users request the same package simultaneously. Each request independently generates all PDFs and downloads all audio files from Directus.

**Prevention:**
- Disable the generate button immediately on click and show a progress indicator.
- Implement a simple in-memory request deduplication: hash the request parameters (hymn IDs + config), and if a generation is already in progress for the same hash, wait for it rather than starting a new one.
- Add basic rate limiting on the API route (e.g., max 3 concurrent ZIP generations).
- Consider caching generated ZIPs for a short TTL (5-10 minutes) keyed by the request hash, so identical requests serve from cache.

**Phase relevance:** API route implementation (core phase) + UI loading states (UI phase).

---

### Pitfall 9: Standalone Docker Output Missing Static Assets for PDF

**What goes wrong:** The existing PDF components reference static assets from `/public/` (e.g., font files at `/fonts/adamina/Adamina.ttf`, header images). In standalone output mode, Next.js copies `.next/static` and `public/` to the runner image, but `@react-pdf/renderer` resolves font and image paths differently than Next.js static file serving.

**Why it happens:** `Font.register({ src: '/fonts/adamina/Adamina.ttf' })` works in `npm run dev` because the dev server serves `/public/` at `/`. In standalone Docker, the font path resolution depends on whether the PDF is rendered server-side (needs filesystem path) or client-side (needs HTTP URL). The current component is marked `'use client'` which means it renders in the browser during navigation, but the ZIP generator will render server-side.

**Consequences:**
- PDFs generated server-side in the API route have missing fonts (falls back to Helvetica)
- Different visual output between the existing hymn PDF page (client-rendered) and the ZIP-packaged PDF (server-rendered)

**Prevention:**
- For server-side `renderToStream()`/`renderToBuffer()`, register fonts with absolute filesystem paths: `path.join(process.cwd(), 'public', 'fonts', 'adamina', 'Adamina.ttf')`.
- Or register fonts with a full HTTP URL to the running server (less reliable).
- Create a dedicated server-side PDF component (no `'use client'` directive) that handles font registration correctly for the server context.
- Test PDF generation in the Docker container, not just in dev mode.

**Detection:** Generate a PDF via the API route in Docker and open it -- if fonts look different from the browser-rendered version, font paths are wrong.

**Phase relevance:** PDF component adaptation (early phase).

## Minor Pitfalls

### Pitfall 10: Content-Disposition Header Encoding for Spanish Filenames

**What goes wrong:** The ZIP filename in the `Content-Disposition` response header contains Spanish characters (e.g., `Himnos_Seleccion.zip`). Browsers handle RFC 5987 encoding differently, and some older browsers may mangle the filename.

**Prevention:**
- Use the `filename*=UTF-8''` encoding in Content-Disposition alongside a plain ASCII `filename=` fallback:
  ```
  Content-Disposition: attachment; filename="Himnos_Paquete.zip"; filename*=UTF-8''Himnos_Paquete.zip
  ```
- Keep the ZIP filename simple and ASCII-safe. Put descriptive Spanish names inside the ZIP structure.

**Phase relevance:** API route response headers (core phase).

---

### Pitfall 11: Not Setting Content-Length Leading to Poor Download UX

**What goes wrong:** When streaming a ZIP, the `Content-Length` header is unknown upfront. Browsers cannot show a progress bar or estimated time for the download -- they just show "downloading..." with no progress indication.

**Prevention:**
- Accept this tradeoff for streaming (no Content-Length is inherent to streaming).
- Compensate with client-side UX: show a "generating..." state, then switch to "downloading..." when the stream starts.
- If progress is critical, use the two-phase approach: generate ZIP to a temp file first, then serve it with known Content-Length. This trades streaming efficiency for UX but re-introduces the memory/disk concern.

**Phase relevance:** UX polish phase.

---

### Pitfall 12: Ignoring the `is_track_only_exists` Boolean Flag

**What goes wrong:** The Directus schema has `is_track_only_exists` as a separate boolean from the `track_only` file UUID field. Code checks only for `track_only !== null` to decide if audio exists, but the boolean flag may indicate the track was intentionally removed or is known to be missing.

**Prevention:**
- Use `is_track_only_exists` as the primary check for track availability in the UI selector. Only attempt download if the boolean is true AND the UUID is non-null.
- Query both fields in the hymn data fetch.

**Phase relevance:** Hymn data service layer (early phase).

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Hymn selector UI | Fetching all hymns at once for search/filter | Implement server-side search with Directus filters, paginate results |
| PDF component adaptation | Font paths differ between client and server rendering | Create server-specific PDF components with absolute font paths |
| Multi-hymn PDF layouts | Content overflow in 2-up and 4-up layouts | Design minimal layouts for multi-hymn; full styling only for 1-up |
| ZIP generation API route | Memory exhaustion from buffering | Stream everything: Directus audio -> archiver -> response |
| ZIP generation API route | Archiver stream corruption | Sequential entry processing, proper error handling on all streams |
| Directus file downloads | Silent failures on missing/inaccessible files | Per-file error handling, manifest file in ZIP, pre-validation |
| Docker deployment | Timeout from reverse proxy | Configure Dokploy/nginx proxy_read_timeout to 180s+ |
| Download UX | User clicks generate multiple times | Disable button, show progress, request deduplication |
| Testing | Only testing with 1-2 hymns | Always test with maximum expected package size (30+ hymns, all tracks) |

## Sources

- Codebase analysis: `app/pdf-gen/hymns/[id]/page.tsx`, `app/components/pdf-components/pdf-pages/HymnPagePdf.tsx`, `app/lib/directus.tsx`, `app/api/events/route.ts`
- Directus schema: `app/lib/directus/directus.interface.ts` (hymn audio fields)
- Existing concerns: `.planning/codebase/CONCERNS.md` (PDF rendering limits, type safety, no error boundaries)
- Docker deployment: `Dockerfile` (standalone output, node:20-bookworm-slim)
- Next.js config: `next.config.mjs` (standalone output, no-store on PDF routes)
- Confidence: MEDIUM -- based on codebase analysis and established Node.js streaming patterns. Web search was unavailable for verification of latest library versions and known issues.

---

*Pitfalls audit: 2026-03-28*
