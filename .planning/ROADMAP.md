# Roadmap: Empaquetador de Himnos

## Overview

This roadmap delivers a hymn packaging tool that lets any church member search for hymns, configure print layouts, select audio tracks, and download a ZIP with PDFs and audio files. The build order follows a strict bottom-up dependency chain: data layer first, then PDF rendering, then API routes, then the wizard UI. Each layer depends on the one below it and is independently testable before the next begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation and Data Layer** - Hymn service layer, server-safe HTML parser, audio availability detection
- [ ] **Phase 2: PDF Generation for Server-Side Rendering** - Server-compatible PDF components with multi-layout support
- [ ] **Phase 3: API Routes and ZIP Streaming** - Search endpoint and streaming ZIP generation with PDFs and audio
- [ ] **Phase 4: Wizard UI and Download Experience** - 3-step wizard for hymn selection, configuration, and download

## Phase Details

### Phase 1: Foundation and Data Layer
**Goal**: Establish the backend query and parsing infrastructure that all downstream phases depend on
**Depends on**: Nothing (first phase)
**Requirements**: (Infrastructure -- no user-facing requirements; enables Phases 2-4)
**Success Criteria** (what must be TRUE):
  1. A `searchHymns()` function can query Directus hymns by number, name, hymnal, and category, returning results with audio availability flags
  2. A `fetchHymnForPdf()` function retrieves complete hymn data (lyrics, metadata, audio file references) for a given hymn ID
  3. An HTML-to-PDF parser can convert `letter_hymn` HTML content into react-pdf elements without using browser DOM APIs
  4. Audio availability flags correctly reflect which audio fields (track_only, midi, soprano, alto, tenor, bass) actually have files for each hymn
**Plans**: TBD

### Phase 2: PDF Generation for Server-Side Rendering
**Goal**: Users' selected hymns can be rendered into properly formatted PDF documents on the server
**Depends on**: Phase 1
**Requirements**: IMPR-01, IMPR-02, IMPR-03, IMPR-04
**Success Criteria** (what must be TRUE):
  1. A hymn PDF can be generated server-side via `renderToBuffer()` with correct fonts and lyrics rendering
  2. A PDF with 1 hymn per page (full carta size) renders with correct layout and margins
  3. A PDF with 2 hymns per page (media carta) renders both hymns legibly on one page
  4. A decorated style PDF includes visual elements (colors, borders) while a plain style PDF renders minimalist black-and-white text
**Plans**: TBD

### Phase 3: API Routes and ZIP Streaming
**Goal**: A server-side API can generate and stream a ZIP file containing formatted PDFs and selected audio files
**Depends on**: Phase 2
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04
**Success Criteria** (what must be TRUE):
  1. A GET endpoint returns hymn search results with filters (number, name, hymnal, category) and audio availability flags
  2. A POST endpoint generates a ZIP containing PDF documents for the requested hymns with the specified layout and style
  3. The ZIP includes selected audio files (track, midi, voice parts) downloaded from Directus and correctly named
  4. The ZIP streams to the client as it is assembled (no full buffering in memory) and the client can download it
**Plans**: TBD

### Phase 4: Wizard UI and Download Experience
**Goal**: Any church member can search, select, configure, and download a hymn package through a guided step-by-step interface in Spanish
**Depends on**: Phase 3
**Requirements**: BUSQ-01, BUSQ-02, BUSQ-03, BUSQ-04, BUSQ-05, BUSQ-06, BUSQ-07, AUDIO-01, AUDIO-02, AUDIO-03, UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. User can search hymns by number or name and filter by hymnal or category, seeing results update as they type or select filters
  2. User can select multiple hymns, see a summary of selected hymns, and remove hymns from the selection
  3. User can see which audio tracks are available per hymn and select which tracks to include (only showing tracks that exist)
  4. User navigates a 3-step wizard (select hymns, configure print and audio, generate and download) with forward/back navigation
  5. User sees a progress indicator during ZIP generation and downloads the resulting file, with all UI text in Spanish
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Data Layer | 0/0 | Not started | - |
| 2. PDF Generation for Server-Side Rendering | 0/0 | Not started | - |
| 3. API Routes and ZIP Streaming | 0/0 | Not started | - |
| 4. Wizard UI and Download Experience | 0/0 | Not started | - |
