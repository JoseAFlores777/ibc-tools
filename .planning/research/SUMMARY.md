# Project Research Summary

**Project:** Empaquetador de Himnos (Hymn Packager)
**Domain:** Server-side ZIP generation with PDF + audio bundling in Next.js
**Researched:** 2026-03-28
**Confidence:** MEDIUM

## Executive Summary

The Hymn Packager is an additive feature on the existing ibc-tools Next.js 16 app that lets church members select multiple hymns from the Directus CMS catalog, configure print layouts, choose voice tracks per hymn, and download a single ZIP file containing a generated PDF plus the selected audio files. This is not a new product — it is the first feature in ibc-tools to require significant client-side wizard state combined with a heavy server-side operation (PDF rendering + multi-file fetching + streaming ZIP assembly). The recommended approach is a 3-step multi-step wizard in the browser posting to a dedicated Next.js API route that orchestrates Directus queries, `@react-pdf/renderer` server-side rendering, and `archiver`-based streaming ZIP generation. Only two new npm dependencies are required (`archiver` and `nuqs`); the existing stack covers everything else.

The critical architectural constraint is that the existing `HymnPagePdf` component uses browser DOM APIs (`document.createElement`) for HTML parsing, which is incompatible with server-side `renderToBuffer()`. This refactor is the highest-risk piece and must be tackled before the ZIP pipeline can work. The ZIP generation must be fully streaming — PDF buffers piped into `archiver` as they are rendered, and audio files streamed from Directus without buffering in memory — to avoid OOM crashes in the Docker container. The Directus data model already contains rich audio data (7 file fields per hymn: track, MIDI, dynamic MIDI, soprano, alto, tenor, bass), which is a genuine differentiator; no competing worship tool packages hymns with multi-voice audio for offline practice.

The highest risks are: (1) memory exhaustion if audio files or PDFs are buffered rather than streamed; (2) `@react-pdf/renderer` font path failures in the Docker server context; (3) HTTP timeout on large packages at the reverse proxy layer. All three are preventable with known techniques documented in PITFALLS.md. The 4-phase build order (Foundation -> PDF Adaptation -> API Routes -> Wizard UI) should be followed strictly because each layer depends on the one below it.

## Key Findings

### Recommended Stack

The existing ibc-tools stack (Next.js 16, React 19, `@react-pdf/renderer`, `react-hook-form`, Zod, shadcn/ui, `cmdk`, `framer-motion`) covers approximately 90% of the feature's needs. Only `archiver` (server-side streaming ZIP) and `nuqs` (URL-synced filter state for hymn search) need to be added. `archiver` is the correct ZIP choice over `JSZip` because it streams chunks directly to the HTTP response instead of buffering the full archive in memory — critical when packages can include 7 audio tracks per hymn across 50 hymns.

**Core technologies:**
- `archiver ^7.0.x`: Server-side ZIP streaming — only viable option for large multi-file audio packages without OOM risk
- `nuqs ^2.x`: URL-synced hymn search filter state — essential for a search-heavy interface where back/bookmark/share must work
- `@react-pdf/renderer ^3.4.4` (existing): Multi-layout PDF generation via `renderToBuffer()` — use existing dependency, new server-compatible components required
- `react-hook-form + Zod` (existing): Wizard state and per-step validation — no wizard library needed for a 3-step flow
- `node-html-parser` (or equivalent): DOM-free HTML parsing for `letter_hymn` content in server context — replaces `document.createElement` usage in `HymnPagePdf`

See `.planning/research/STACK.md` for full version details and verification instructions.

### Expected Features

The hymn packager fills an underserved niche: packaging hymns with multi-voice audio for offline practice. IBC's Directus data model already has 7 audio fields per hymn, making this a genuine capability differentiator that commercial worship tools (Planning Center, CCLI SongSelect, Hymnary.org) do not offer.

**Must have (table stakes):**
- Hymn search by number and name — primary lookup methods for church members
- Filter by hymnal — IBC uses multiple hymnals; scope is essential
- Multi-hymn selection with summary/review — the fundamental wizard interaction
- Combined PDF lyrics generation — core deliverable, reuses existing `HymnPagePdf`
- Audio track selection per hymn — shows available tracks per hymn based on field presence
- ZIP download with PDF + audio — the differentiating "package" concept
- Step-by-step wizard UI — non-technical users require guided flow
- Progress indicator during generation — users will think it is broken without feedback

**Should have (differentiators for v1.1):**
- Print layout options (1, 2, or 4 hymns per page) — paper saving; 4-up for practice booklets
- Filter by category and author — thematic worship preparation
- Style presets (decorated vs plain) — decorated for gifts, plain for rehearsal handouts
- Hymn preview before adding — prevents wrong hymn selection
- Bible reference and author credits on PDF — data already in model

**Defer to v2+:**
- Saved packages / favorites — requires auth; no demand established for v1
- Individual PDF per hymn option — nice-to-have toggle
- Free text lyrics search — requires Directus full-text index optimization
- User accounts — PROJECT.md explicitly scopes this out

See `.planning/research/FEATURES.md` for the full feature dependency graph.

### Architecture Approach

The feature introduces a client-driven multi-step wizard that posts to two new server-side API routes: a lightweight hymn search route (`GET /api/hymn-packager/hymns`) and a heavy ZIP generation route (`POST /api/hymn-packager/generate`). The wizard stores all configuration in react-hook-form state (selected hymn IDs, layout config, per-hymn audio selections). On submit, the ZIP generation route fetches full hymn data from Directus, renders PDFs server-side via `renderToBuffer()`, fetches audio files as streams from the Directus asset endpoint, and pipes everything into `archiver` which streams the ZIP directly as the HTTP response. The existing Directus service layer pattern is extended with a new `hymns.ts` service.

**Major components:**
1. **Wizard Page** (`app/empaquetador/`) — 3-step client UI: hymn selection, config, download
2. **Hymn Search API** (`/api/hymn-packager/hymns`) — GET, Directus query, returns boolean audio-availability flags (not raw UUIDs)
3. **ZIP Generation API** (`/api/hymn-packager/generate`) — POST, orchestrates PDF render + audio fetch + ZIP streaming
4. **Hymn Service** (`app/lib/directus/services/hymns.ts`) — extends existing pattern with `searchHymns()` and `fetchHymnForPdf()`
5. **Server PDF Components** (`app/components/pdf-components/pdf-pages/`) — DOM-free variants of `HymnPagePdf` using absolute font paths
6. **PDF Document Assembler** (`app/lib/pdf/hymn-pdf.ts`) — `renderToBuffer()` wrapper, pure utility
7. **ZIP Assembler** (`app/lib/zip/assembler.ts`) — archiver streaming utility, pure utility

### Critical Pitfalls

1. **Buffering the entire ZIP in memory** — Use `archiver` streaming; pipe audio directly from Directus `fetch().body` into the archive entry. Never accumulate the full ZIP buffer before sending. Monitor heap usage during testing with 10+ hymns.
2. **DOM APIs in server PDF rendering** — The existing `HymnPagePdf` uses `document.createElement()` for HTML parsing. Create server-compatible PDF components using `node-html-parser` or regex-based extraction. This is the highest-risk refactor and must come first.
3. **Font path failures in Docker** — Server-side `renderToBuffer()` needs absolute filesystem paths for fonts: `path.join(process.cwd(), 'public', 'fonts', 'adamina', 'Adamina.ttf')`. Client-side relative paths (`/fonts/...`) do not work in the server context.
4. **HTTP timeout on large packages** — Export `const maxDuration = 120` in the route file. Configure Dokploy/nginx `proxy_read_timeout` to 180s+. Start streaming immediately (the archiver pipe approach does this naturally).
5. **Corrupt ZIP from premature stream closure** — Process archive entries sequentially (not `Promise.all`). Always listen for archiver `'warning'` and `'error'` events. Test with `unzip -t` on all generated ZIPs.

See `.planning/research/PITFALLS.md` for the full list including moderate pitfalls (filename collisions, multi-up layout overflow, rate limiting) and minor pitfalls.

## Implications for Roadmap

Based on the component dependency graph in ARCHITECTURE.md and the pitfall severity ratings in PITFALLS.md, the natural build order is 4 phases. Each phase has a hard dependency on the previous one.

### Phase 1: Foundation and Data Layer

**Rationale:** Everything downstream depends on being able to query hymn data and parse HTML lyrics server-side. Neither the PDF components nor the API routes can be built until this works. The `is_track_only_exists` boolean flag pitfall (Pitfall 12) and the silent Directus asset download failure pitfall (Pitfall 4) must be addressed here before they propagate upward.
**Delivers:** `Hymn Service` with `searchHymns()` and `fetchHymnForPdf()`, server-safe HTML parser utility, audio availability flag logic
**Addresses:** Hymn search by number/name/hymnal (table stakes), correct audio availability detection
**Avoids:** Pitfall 4 (silent Directus file failures — add pre-validation here), Pitfall 12 (use `is_track_only_exists` boolean, not null check)

### Phase 2: PDF Adaptation for Server-Side Rendering

**Rationale:** This is the highest-technical-risk phase. The current `HymnPagePdf` is `'use client'` and uses browser DOM APIs. Refactoring it to work with `renderToBuffer()` in a Node.js context is a prerequisite for the ZIP pipeline. Validating PDF generation independently (outside the ZIP) de-risks Phase 3. Multi-hymn PDF layouts (1/2/4 per page) are also in scope here because they are pure PDF component work with no UI dependencies.
**Delivers:** Server-compatible `HymnPagePdf` variants with absolute font paths, `PDF Document Assembler` (`renderToBuffer()` wrapper), new 2-up and 4-up layout components
**Uses:** `@react-pdf/renderer renderToBuffer()`, `node-html-parser`, absolute font path registration
**Implements:** Server PDF Components + PDF Document Assembler architectural components
**Avoids:** Pitfall 2 (DOM APIs), Pitfall 9 (font paths in Docker), Pitfall 7 (multi-up layout overflow — design minimal style for 2/4-up)

### Phase 3: API Routes and ZIP Generation

**Rationale:** With the service layer and PDF assembly validated, the API routes integrate them with `archiver` streaming. This phase should be testable end-to-end with `curl` before any wizard UI exists. The streaming architecture (Pitfall 1) and stream corruption prevention (Pitfall 5) must be built correctly from the start, not added as patches later.
**Delivers:** `GET /api/hymn-packager/hymns` (search with filters), `POST /api/hymn-packager/generate` (streaming ZIP response), `ZIP Assembler` utility
**Uses:** `archiver ^7.0.x`, native Node.js `fetch()` + `ReadableStream`, `Readable.toWeb()` bridge
**Implements:** Hymn Search API + ZIP Generation API architectural components
**Avoids:** Pitfall 1 (stream, never buffer), Pitfall 3 (set `maxDuration`, configure nginx), Pitfall 5 (sequential append, error events), Pitfall 6 (hymn-number-prefixed filenames, ASCII-safe)

### Phase 4: Wizard UI and UX Polish

**Rationale:** The wizard is the consumer of Phase 3's APIs and has the lowest technical risk. shadcn/ui components + react-hook-form is a well-established pattern already used in the project. This phase delivers the full user experience including the multi-step flow, hymn search/filter UI, audio track selection per hymn, and download experience. UX concerns (Pitfall 8 — double-submit prevention, Pitfall 11 — no Content-Length progress) are addressed here.
**Delivers:** `/empaquetador` page with full 3-step wizard (Select Hymns, Configure, Download), URL-synced filters, per-hymn audio checkboxes, loading/progress states, toast notifications
**Uses:** `nuqs ^2.x`, `react-hook-form`, Zod per-step schemas, `cmdk` for hymn search, `framer-motion` for step transitions, `sonner` for toasts
**Implements:** Wizard Page architectural component
**Avoids:** Pitfall 8 (disable button on submit, request deduplication), Pitfall 10 (ASCII-safe Content-Disposition header)

### Phase Ordering Rationale

- **Bottom-up dependency chain:** Service layer -> PDF rendering -> API routes -> UI. No layer can be built without the one below it working correctly.
- **Highest-risk first:** The DOM API refactor (Phase 2) is the least predictable item technically. Tackling it early leaves time to adjust scope if the refactor proves complex.
- **Independent testability:** Each phase produces something testable in isolation. Phase 1 via unit tests, Phase 2 via a standalone script calling `renderToBuffer()`, Phase 3 via `curl`, Phase 4 via browser.
- **v1.1 layout features included in Phase 2:** Building 2/4-up layouts as part of PDF adaptation (not a separate phase) avoids revisiting the PDF component architecture a second time.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (PDF server-side rendering):** `@react-pdf/renderer`'s server-side behavior in Next.js 16 with `renderToBuffer()` needs hands-on verification. Memory accumulation behavior (Pitfall 2) and the exact font registration API for server context should be validated with a spike before committing to the full implementation.
- **Phase 3 (ZIP streaming in Next.js App Router):** The Node.js stream to Web ReadableStream bridge (`Readable.toWeb()`) in a Next.js 16 Route Handler needs a working proof-of-concept before full implementation. Archiver's behavior with Next.js's request/response lifecycle is MEDIUM-confidence.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Directus service layer):** Direct extension of the existing `events.ts` pattern. Well-understood, HIGH confidence.
- **Phase 4 (Wizard UI):** react-hook-form multi-step wizard + shadcn/ui is a well-documented pattern, already partially implemented in the project (cards demo page). No research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Only 2 new packages. Versions unverified via live npm (web tools unavailable during research). Run `npm view archiver version` and `npm view nuqs version` before installing. |
| Features | MEDIUM | Based on domain knowledge of Planning Center, CCLI SongSelect, OpenLP. No live competitor verification. The Directus data model is HIGH confidence (codebase analysis). |
| Architecture | MEDIUM | Directus service pattern extension is HIGH confidence (existing code). `renderToBuffer()` server behavior and archiver/Next.js stream bridge are MEDIUM (needs spike). |
| Pitfalls | MEDIUM | Critical pitfalls (OOM, DOM APIs, font paths) derived from codebase analysis — HIGH confidence they are real risks. Severity estimates for large packages (30+ hymns) are inference. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **`renderToBuffer()` in Next.js 16 App Router:** Needs a working spike before Phase 2 planning. Validate that font registration, image embedding, and memory behavior are acceptable in the actual Docker environment.
- **Archiver + Web ReadableStream bridge:** A small proof-of-concept in the Next.js Route Handler should be created at the start of Phase 3 planning. The theory is sound but cross-stream compatibility in Next.js 16 is MEDIUM confidence.
- **Directus file permissions:** Audio files in Directus may require authentication tokens to download from the server. Verify whether `DIRECTUS_URL/assets/{uuid}` is accessible without a token from the server-side API route context, or if a service token must be added to the fetch call.
- **Package size limits:** The 50-hymn max is a reasonable estimate, not a measured limit. Actual memory and response time benchmarks with the Docker container should be established during Phase 3 to tune the limit.
- **nuqs version:** Verify `npm view nuqs version` — v2.x is training-data-based and may be outdated.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `package.json`, `app/lib/directus/`, `app/components/pdf-components/`, `app/api/events/route.ts`, `Dockerfile` — direct analysis
- Directus types: `app/lib/directus/directus.interface.ts` — hymn audio field inventory (HIGH confidence, authoritative)
- `@react-pdf/renderer` v3.4.4 package in `node_modules` — `renderToBuffer` export confirmed

### Secondary (MEDIUM confidence)
- Training data: archiver npm package, streaming patterns, Node.js stream interop — community consensus across multiple sources
- Training data: nuqs v2.x for Next.js App Router URL state management
- Domain knowledge: Planning Center Services, CCLI SongSelect, Hymnary.org, OpenLP, OpenSong — feature landscape benchmarking

### Tertiary (LOW confidence)
- Version numbers for `archiver ^7.0.x`, `@types/archiver ^6.0.x`, `nuqs ^2.x` — unverified at time of research, must be confirmed before installation

---
*Research completed: 2026-03-28*
*Ready for roadmap: yes*
