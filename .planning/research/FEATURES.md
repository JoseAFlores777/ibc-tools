# Feature Landscape

**Domain:** Hymn packager / worship material generator
**Researched:** 2026-03-28
**Confidence:** MEDIUM (based on domain knowledge of Planning Center Services, CCLI SongSelect, Hymnary.org, OpenLP, OpenSong, and similar tools; web search unavailable for verification)

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hymn search by number | Church members refer to hymns by number in their hymnal. This is the primary lookup method. | Low | Filter on `hymn_number` field, already in Directus |
| Hymn search by name | Second most common lookup. "Busco 'A Dios el Padre Celestial'" | Low | Text search on `name` field |
| Filter by hymnal | IBC uses multiple hymnals. Users need to scope to their hymnal. | Low | Foreign key to `hymnals` collection |
| Multi-hymn selection | The whole point is packaging multiple hymns together. Single-hymn already exists at `/pdf-gen/hymns/[id]`. | Medium | State management for selection list, add/remove UX |
| Selection summary / review | Users need to see what they picked before generating. Prevents wasted generation time. | Low | List component showing selected hymns |
| PDF lyrics generation | Core deliverable. Lyrics PDF is the primary output. | Low | Existing `HymnPagePdf` component handles single hymn rendering already |
| Multi-hymn PDF document | Combine selected hymns into a single PDF rather than individual files. | Medium | New Document wrapper around multiple `HymnPagePdf` pages |
| ZIP download with PDF + audio | The differentiating "package" concept. Without this, it is just a batch PDF tool. | High | Server-side ZIP generation via API route, streaming Directus file assets |
| Audio track selection per hymn | Each hymn has different available tracks (track_only, midi, soprano, alto, tenor, bass). Users must choose which they want. | Medium | Dynamic UI showing only available tracks per hymn based on field presence |
| Progress indicator during generation | ZIP generation with multiple PDFs and audio files takes time. Users will think it is broken without feedback. | Medium | Loading state, possibly SSE or polling for progress |
| Step-by-step wizard UI | Non-technical church members need guided flow, not a single complex form. | Medium | Multi-step form with navigation (already specified in PROJECT.md) |

## Differentiators

Features that set this product apart. Not expected by users (no competing tool in this niche for IBC), but add significant value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Filter by category | Hymns categorized (alabanza, adoracion, comunion, etc.). Useful when preparing thematic worship. | Low | Junction table `hymn_hymn_categories` exists in Directus |
| Filter by author | Useful for musicians who prefer specific composers/arrangers. | Low | Junction table `hymn_authors` exists |
| Free text search across lyrics | "I remember a verse that says X" -- search inside `letter_hymn` content. | Medium | Requires full-text query against Directus, may need search index for performance |
| Print layout options (1/2/4 per page) | Save paper. 4-up layout for practice booklets, full page for projection/large print. | High | Requires new `@react-pdf/renderer` layout components for multi-hymn-per-page arrangements |
| Page orientation toggle | Landscape useful for 2-up side-by-side layouts. | Medium | PDF page size configuration, interacts with layout option |
| Paper size selection | Letter (carta) is default, but half-letter booklets or A4 for international users. | Low | Page size prop to PDF components |
| Style presets (decorated vs plain) | Decorated for special occasions/gifts, plain for weekly rehearsal handouts. | High | Two complete style systems for PDF components (borders, fonts, colors vs minimal) |
| Hymn preview before adding | Quick-look at lyrics without leaving the selection flow. Prevents wrong hymn selection. | Medium | Modal or expandable panel showing `letter_hymn` content |
| Voice part selection across all hymns | "I only need soprano tracks for all hymns" -- batch apply a voice selection. | Low | UI convenience, applies selection uniformly |
| Individual PDF per hymn option | Some users want separate files in the ZIP rather than one combined document. | Medium | Toggle between combined vs individual PDFs in ZIP |
| Hymnal version cross-reference | Show if a hymn appears in multiple hymnal editions. | Low | `hymn_hymnal_versions` junction table exists |
| Bible reference display on PDF | Include `bible_reference` and `bible_text` on printed hymn page. | Low | Data already in model, just needs PDF layout inclusion |
| Author/composer credits on PDF | Proper attribution on printed materials. | Low | Data available through `hymn_authors` with roles |

## Anti-Features

Features to explicitly NOT build. These are scope traps.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User accounts / saved packages | PROJECT.md explicitly scopes this out. Adds auth complexity, database writes, session management. Zero value for v1 where usage is occasional. | Keep tool stateless. If demand emerges, revisit in v2 with Directus user roles. |
| Lyrics editing | Lyrics come from Directus as source of truth. Editing creates divergence, versioning headaches, and authorization needs. | Members who find errors report to the person managing Directus. |
| Audio streaming / playback | Streaming requires media player UI, buffering logic, codec handling. The use case is offline practice, not online listening. | Download only. Users play files in their preferred media player. |
| Chord charts / sheet music | Different domain entirely (music notation rendering). Enormous complexity with libraries like VexFlow/abcjs. Not in the data model. | The `midi_file` and voice tracks serve musicians. Sheet music is a separate product. |
| Transposition | Requires music theory engine, key detection, re-rendering. Way beyond scope. | Provide MIDI files which users can transpose in dedicated music software. |
| Worship service planning | Already exists at `/pdf-gen/programs/[id]`. The hymn packager is a complementary tool, not a replacement. | Link to existing program generator from the packager UI if useful. |
| Batch audio format conversion | Converting MIDI to MP3, or WAV to MP3, etc. Server-intensive, complex, and users have tools for this. | Serve files in their original format from Directus. |
| Social sharing / collaboration | "Share this package with your choir" -- adds complexity with links, permissions, storage. | Users download ZIP and share via WhatsApp/email themselves. This is the natural workflow for IBC. |
| Offline / PWA support | Service workers, caching strategy, IndexedDB storage. High complexity for a tool used occasionally. | Standard web app. The ZIP download IS the offline artifact. |
| Print directly from browser | Browser print APIs are unreliable for styled content. The PDF IS the print-ready artifact. | Generate PDF, user prints from their PDF viewer. |

## Feature Dependencies

```
Hymn search/filter ──> Multi-hymn selection ──> Selection review
                                                      │
                                           ┌──────────┴──────────┐
                                           v                      v
                                  Print config              Audio track selection
                                  (layout, style,           (per hymn, based on
                                   orientation)              availability)
                                           │                      │
                                           └──────────┬──────────┘
                                                      v
                                              ZIP generation
                                              (API route)
                                                      │
                                                      v
                                              ZIP download
```

Key dependency chains:

- `Hymn search` must exist before `Multi-selection` (nothing to select without search)
- `Multi-selection` must exist before `Print config` or `Audio selection` (nothing to configure without hymns)
- `Print config` and `Audio selection` are independent of each other (can be built in parallel)
- `ZIP generation` depends on both `Print config` (to know how to render PDFs) and `Audio selection` (to know which files to include)
- `Progress indicator` depends on `ZIP generation` (nothing to show progress for without it)
- `Style presets` depends on `Print config` (style is a sub-option of print configuration)
- `Layout options (1/2/4 per page)` depends on base PDF generation working for single hymn first

## MVP Recommendation

Prioritize (in build order):

1. **Hymn search by number + name + hymnal filter** -- Core navigation. Without this, users cannot find hymns. Low complexity, high value.
2. **Multi-hymn selection with summary** -- The fundamental interaction pattern. Medium complexity, essential.
3. **Combined PDF generation** -- Primary output. Reuses existing `HymnPagePdf`. Medium complexity.
4. **Audio track selection per hymn** -- Shows available tracks, lets user pick. Medium complexity, core to the "packager" concept.
5. **ZIP generation and download** -- Ties everything together. High complexity but is the core deliverable.
6. **Step-by-step wizard UI** -- Wraps the above in a guided flow. Medium complexity, critical for non-technical users.

Defer to v1.1:

- **Layout options (1/2/4 per page):** High complexity PDF layout work. Start with 1 hymn per page (existing pattern) and add multi-up layouts after core flow works.
- **Style presets (decorated vs plain):** High complexity requiring two complete style systems. Ship with one clean default style first.
- **Free text lyrics search:** Medium complexity, requires Directus search optimization. Number + name + hymnal covers 90% of use cases.
- **Category and author filters:** Low complexity but lower priority than core flow. Add after wizard is stable.

Defer to v2 (if demand):

- **Saved packages / favorites** -- Requires auth, database writes
- **Individual PDF per hymn option** -- Nice-to-have toggle, not essential

## Sources

- Project codebase analysis: Directus type definitions (`directus.interface.ts`), existing PDF components (`HymnDocPdf.tsx`, `HymnPagePdf.tsx`), interfaces (`Program.interface.ts`)
- PROJECT.md requirements and constraints
- Domain knowledge of worship planning tools: Planning Center Services (worship team scheduling + song management), CCLI SongSelect (song lyrics database + print), Hymnary.org (hymn encyclopedia + PDF), OpenLP (church presentation software), OpenSong (worship presentation). Confidence: MEDIUM -- based on training data, not live verification.
- Key insight from competitor analysis: Most worship tools focus on projection (slides) or licensing (CCLI). The "package hymns with audio for offline practice" niche is underserved. IBC's rich audio data (4 voice parts + track + MIDI per hymn) is a genuine differentiator that commercial tools do not offer.
