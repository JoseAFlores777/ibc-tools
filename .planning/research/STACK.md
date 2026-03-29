# Technology Stack

**Project:** Empaquetador de Himnos (Hymn Packager)
**Researched:** 2026-03-28
**Overall confidence:** MEDIUM (versions need npm verification -- web tools were unavailable during research)

## Recommended Stack

This is an additive milestone. The existing ibc-tools stack (Next.js 16, React 19, shadcn/ui, Zod, react-hook-form, @react-pdf/renderer) is the foundation. Below are the **new** dependencies needed for the hymn packager feature.

### ZIP Generation (Server-Side)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| archiver | ^7.0.x | Server-side ZIP stream generation in API route | Streaming architecture -- does not buffer entire ZIP in memory. Pipes directly to the HTTP response. Battle-tested (100M+ npm downloads), supports zip64 for large files. Works naturally with Node.js streams which Next.js API routes support. |

**Confidence:** HIGH -- archiver has been the standard Node.js ZIP library for years, streaming API is well-documented and stable.

**Why NOT JSZip:** JSZip buffers the entire archive in memory before producing output. For a package with multiple audio files (WAV/MP3 voice tracks, MIDI files) plus PDFs, this can spike memory usage dangerously in a serverless-ish Next.js environment. Archiver streams chunks as they are added, keeping memory flat.

**Why NOT fflate:** Lower-level, requires more manual work to assemble ZIP archives. Archiver provides a high-level API (`archive.append(stream, { name })`) that maps perfectly to our use case of adding fetched Directus file streams + generated PDF buffers.

### PDF Generation (Multi-Hymn Layouts)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @react-pdf/renderer | ^3.4.4 (existing) | Generate multi-hymn PDF layouts (1/2/4 per page) | Already in the project. The new layouts (2-up, 4-up) are composition changes in @react-pdf, not new dependencies. Use flexbox within `<Page>` to tile hymn content. |

**No new dependency needed.** The 1/2/4 per page layouts are achieved by:
- 1 per page: Current `HymnPagePdf` (exists)
- 2 per page: Two hymn `<View>` blocks in a vertical split within one `<Page>`
- 4 per page: Four hymn `<View>` blocks in a 2x2 grid within one `<Page>`

For server-side PDF buffer generation (inside the API route, not client-side viewer), use `@react-pdf/renderer`'s `renderToBuffer()` or `renderToStream()`:

```typescript
import { renderToBuffer } from '@react-pdf/renderer';
const pdfBuffer = await renderToBuffer(<HymnPackageDoc hymns={hymns} layout="4-per-page" />);
archive.append(pdfBuffer, { name: 'himnos.pdf' });
```

**Confidence:** HIGH -- `renderToBuffer` is a documented API of @react-pdf/renderer for server-side use.

### Multi-Step Wizard UI

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-hook-form | ^7.52.2 (existing) | Form state across wizard steps | Already in the project. Use a single `useForm()` with a shared Zod schema. Each step renders a portion of the form fields. |
| Zod | ^3.23.8 (existing) | Step-by-step validation (discriminated union or per-step schemas) | Already in the project. Define a schema per step, validate only the current step on "next." |

**No new dependency needed for the wizard.** Build it with:
1. A `useState` step counter (0, 1, 2)
2. One `useForm()` wrapping all steps
3. Per-step Zod schemas for incremental validation
4. shadcn/ui `Tabs` or custom stepper UI for visual progress
5. Framer Motion (existing) for step transitions

**Why NOT a dedicated stepper/wizard library:** The 3-step flow is simple (Select Hymns -> Configure -> Download). Adding a library like `react-step-wizard` or `@mantine/stepper` introduces a dependency for something achievable in ~50 lines of state management. The project already has react-hook-form which handles cross-step state natively.

**Confidence:** HIGH -- this is a well-established pattern with react-hook-form.

### Hymn Search and Filtering

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| cmdk | ^1.0.0 (existing) | Command palette for quick hymn search by name/number | Already in the project. Provides the searchable combobox pattern with keyboard navigation. Wraps naturally with shadcn/ui Command component. |
| nuqs | ^2.x | URL-synced filter state (hymnal, category, author) | Type-safe search params state management for Next.js App Router. Keeps filter state in the URL so users can share/bookmark filtered views. Works with server components. |

**Confidence:** MEDIUM for nuqs version -- training data says v2.x is current but exact latest version unverified.

**Alternative considered:** Managing filter state purely in `useState`. Rejected because URL-synced filters are a better UX for a search-heavy interface (back button works, shareable, refreshable).

**Why NOT TanStack Table:** The hymn selection UI is a searchable list with filters, not a data table. Users pick hymns from a filterable grid/list, not analyzing tabular data. A card-based or list-based UI with filter sidebar is more appropriate for this domain. TanStack Table would be over-engineering.

### File Downloads from Directus

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @directus/sdk | ^17.0.0 (existing) | Fetch file metadata and download URLs | Already in the project. Audio files in Directus are referenced by UUID. Download URL pattern: `${DIRECTUS_URL}/assets/${file_uuid}`. |

**No new dependency needed.** The API route fetches audio files from Directus using native `fetch()`:

```typescript
// In the API route (server-side)
const audioResponse = await fetch(`${process.env.DIRECTUS_URL}/assets/${hymn.track_only}`);
const audioStream = audioResponse.body; // ReadableStream
archive.append(audioStream, { name: `${hymn.name}/pista.mp3` });
```

Node.js native `fetch` (available in Node 20) returns a `ReadableStream` body that can be piped into archiver, avoiding buffering audio files in memory.

**Confidence:** HIGH -- standard Directus asset URL pattern, documented in Directus docs.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| archiver | ^7.0.x | ZIP stream generation | API route for package generation |
| @types/archiver | ^6.0.x | TypeScript types for archiver | Dev dependency |
| nuqs | ^2.x | URL-synced filter state | Hymn selection page filters |

**Confidence:** MEDIUM -- exact latest versions unverified.

## Existing Stack (No Changes Needed)

These existing dependencies cover significant portions of the feature:

| Existing | Used For |
|----------|----------|
| @react-pdf/renderer ^3.4.4 | PDF generation (adapt for multi-layout) |
| react-hook-form ^7.52.2 | Wizard form state management |
| @hookform/resolvers ^3.9.0 | Zod integration for form validation |
| Zod ^3.23.8 | Per-step validation schemas |
| cmdk ^1.0.0 | Command palette for hymn search |
| file-saver ^2.0.5 | Client-side file download trigger (if needed as fallback) |
| sonner ^1.5.0 | Toast notifications for progress/errors |
| framer-motion ^11.11.1 | Step transition animations |
| lucide-react ^0.429.0 | Icons for UI (search, filter, download, etc.) |
| @directus/sdk ^17.0.0 | CMS data fetching |
| shadcn/ui (Radix + Tailwind) | All UI components (buttons, selects, checkboxes, badges, cards) |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| ZIP generation | archiver | JSZip | Buffers entire ZIP in memory; bad for multi-file audio packages |
| ZIP generation | archiver | fflate | Lower-level API, more manual work for ZIP assembly |
| ZIP generation | archiver | yazl | Less popular, smaller community, archiver wraps similar internals |
| Wizard UI | react-hook-form + useState | react-step-wizard | Unnecessary dependency for a 3-step flow |
| Wizard UI | react-hook-form + useState | @mantine/stepper | Would introduce Mantine dependency into a shadcn/ui project |
| Search | cmdk (existing) | Fuse.js | cmdk already provides the search UX; server-side Directus queries handle the actual filtering |
| Filter state | nuqs | useState | URL-synced state is better UX for search-heavy pages |
| Filter state | nuqs | next/navigation manual | nuqs provides type-safe, declarative API with less boilerplate |
| Data display | Card list + filters | TanStack Table | Not a tabular data use case; hymn selection is visual/card-based |
| PDF multi-layout | @react-pdf flexbox | pdf-lib | Would require abandoning React component model; @react-pdf handles layout natively |

## Architecture Notes for Stack

### API Route Design (Next.js App Router)

The ZIP generation API route should use Next.js Route Handlers with streaming response:

```typescript
// app/api/hymn-package/route.ts
import archiver from 'archiver';
import { renderToBuffer } from '@react-pdf/renderer';

export async function POST(request: Request) {
  const { hymnIds, layout, audioSelections } = await request.json();
  // Validate with Zod schema

  const archive = archiver('zip', { zlib: { level: 5 } });

  // Create a ReadableStream from archiver
  const stream = new ReadableStream({
    start(controller) {
      archive.on('data', (chunk) => controller.enqueue(chunk));
      archive.on('end', () => controller.close());
      archive.on('error', (err) => controller.error(err));
    }
  });

  // Add PDF
  const pdfBuffer = await renderToBuffer(<HymnPackageDoc ... />);
  archive.append(pdfBuffer, { name: 'himnos.pdf' });

  // Add audio files (streamed from Directus)
  for (const hymn of hymns) {
    // fetch and append audio streams
  }

  archive.finalize();

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="paquete-himnos.zip"',
    }
  });
}
```

**Important consideration:** `@react-pdf/renderer`'s `renderToBuffer` requires a server environment. The existing HymnPagePdf uses `'use client'` and DOM APIs (`document.createElement`) for HTML parsing. The server-side version will need a DOM-free HTML parser (e.g., a simple regex-based or string-based parser) to extract paragraphs from `letter_hymn` HTML content. This is a **refactoring requirement**, not a new dependency.

### Node.js Stream Compatibility

archiver uses Node.js streams. Next.js App Router Route Handlers use Web Streams (ReadableStream). A bridge is needed between the two. Options:

1. Use `Readable.toWeb()` (Node.js 17+) to convert Node readable stream to web ReadableStream
2. Manual adapter as shown above

Since the project targets Node.js 20, `Readable.toWeb()` is available and preferred.

**Confidence:** HIGH -- Node.js 20 stream interop is well-documented.

## Installation

```bash
# New dependencies (only 2 new packages!)
npm install archiver nuqs

# Dev dependencies
npm install -D @types/archiver
```

## Version Verification Needed

The following versions should be verified at implementation time since web tools were unavailable during research:

| Package | Stated Version | Verification |
|---------|---------------|--------------|
| archiver | ^7.0.x | Run `npm view archiver version` |
| @types/archiver | ^6.0.x | Run `npm view @types/archiver version` |
| nuqs | ^2.x | Run `npm view nuqs version` |

## Key Decisions Summary

| Decision | Rationale |
|----------|-----------|
| Only 2 new dependencies (archiver + nuqs) | Existing stack covers 90% of the feature needs |
| archiver over JSZip | Streaming prevents memory spikes with audio files |
| No wizard library | 3-step flow is trivial with react-hook-form + useState |
| nuqs for filter state | URL-synced filters are essential UX for search-heavy interface |
| No TanStack Table | Card/list selection UI, not tabular data |
| Refactor HymnPagePdf for server-side | Current component uses DOM APIs incompatible with server rendering |

## Sources

- Existing codebase analysis (package.json, PDF components, Directus types)
- Training data for library recommendations (MEDIUM confidence -- versions unverified via live sources)
- archiver streaming API is a well-established pattern in Node.js ecosystem (HIGH confidence from training data consistency)

---

*Stack research: 2026-03-28*
