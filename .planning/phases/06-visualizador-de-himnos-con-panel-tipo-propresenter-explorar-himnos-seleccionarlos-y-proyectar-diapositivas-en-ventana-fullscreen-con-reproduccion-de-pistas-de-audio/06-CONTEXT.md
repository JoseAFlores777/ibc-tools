# Phase 6: Visualizador de himnos con panel tipo ProPresenter - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

An in-browser live hymn presentation tool at a new route (e.g., `/visualizador`). Operators browse and select hymns into an ordered playlist, then project lyrics as fullscreen slides in a separate browser window connected to a projector/TV. Includes audio playback controls for accompaniment tracks. This is a live presentation tool — not a file export. The operator controls everything from the main tab while the audience sees only the projected slides.

</domain>

<decisions>
## Implementation Decisions

### Panel Layout (3-Column ProPresenter Style)
- **D-01:** Layout is a 3-column design: Left column = hymn playlist with inline search. Center column = slide thumbnails grid for the active hymn. Right column = live preview showing exactly what the projection window displays.
- **D-02:** Bottom bar spans full width with audio playback controls: play/pause, track selector, seek bar, time display.
- **D-03:** Full-height layout (`h-screen flex`) — no page scrolling. Individual columns scroll independently.

### Hymn Playlist and Navigation
- **D-04:** Left column shows an ordered playlist of hymns. Operator adds hymns via an inline search bar at the top of the playlist column. Reuses existing `useHymnSearch` hook for searching.
- **D-05:** Operator can reorder hymns in the playlist via drag-and-drop. Click a hymn to load its slides in the center column.
- **D-06:** Slide navigation: click any thumbnail in the grid to project it. Arrow keys (left/right) advance between slides. Space bar = next slide.
- **D-07:** Auto-advance: pressing right arrow on the last slide of a hymn automatically loads the first slide of the next hymn in the playlist.

### Fullscreen Projection (Separate Window)
- **D-08:** "Proyectar" button opens a new browser window via `window.open()` + Fullscreen API. The projection window shows ONLY the current slide — no browser chrome, no controls. Operator controls remain in the main tab.
- **D-09:** Communication between main tab and projection window via `BroadcastChannel` API or `window.postMessage()`.
- **D-10:** Projection controls: "Negro" (black screen — solid black, hides all content), "Limpiar" (clear text — shows only background, no lyrics), "Logo" (shows church logo centered on background).
- **D-11:** Fade transition (300-500ms crossfade) between slides for professional appearance.

### Slide Content and Styling
- **D-12:** Default theme: clean dark background (`#1a1a2e` or similar) with white text. Operator can upload a custom background image or choose from built-in presets (solid colors, gradients).
- **D-13:** Slide splitting follows existing pattern: one verse per slide with intercalated chorus. Title slide first showing hymn name + bible reference. Uses `parseHymnHtml()` output with the same verse/chorus segmentation as `generate-hymn-propresenter.ts`.
- **D-14:** Font auto-sizes to fill the projection screen based on content length. Operator can also manually adjust size up/down with +/- buttons or keyboard shortcuts (Ctrl+Plus/Ctrl+Minus).
- **D-15:** Verse label (ESTROFA I, CORO, etc.) displayed subtly above the lyrics text on each slide.

### Audio Playback
- **D-16:** Audio playback is manual — operator clicks play when ready. Audio and slides are independent; operator controls both separately for maximum flexibility during worship.
- **D-17:** Single track at a time. Switching tracks stops the current one. No multi-track mixing.
- **D-18:** Default track selection: `track_only` (pista completa) if available for the hymn. Operator can switch to other available tracks (midi, soprano, alto, tenor, bass).
- **D-19:** Audio streams via existing `/api/hymns/audio/[fileId]` proxy. Reuses `AudioTrackPlayer` component pattern (play/pause, seek bar, time display).
- **D-20:** Audio continues playing when advancing between slides within the same hymn. When switching to a different hymn, audio stops.

### Claude's Discretion
- Route path (e.g., `/visualizador` or `/presentador`)
- Responsive behavior for smaller screens (this is primarily a desktop tool)
- Background image presets and upload UX
- Exact keyboard shortcuts beyond arrow keys and space
- Slide thumbnail size and grid layout in center column
- How to handle hymns with no lyrics (letter_hymn is null)
- Loading states and error handling for audio streaming
- Whether to persist playlist to localStorage between sessions
- Church logo source (Directus asset or static public file)
- Animation library choice for fade transitions

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Presentation/Slide Logic (reuse patterns)
- `app/lib/presentation/generate-hymn-propresenter.ts` — Slide segmentation logic: buildSlides() with intercalated chorus pattern, title slide structure
- `app/components/pdf-components/pdf-documents/HymnPresentation.tsx` — PDF presentation component with dark theme colors (#393572 bg, #eaba1c gold), landscape slide layout

### Hymn Data and Parsing
- `app/interfaces/Hymn.interface.ts` — HymnForPdf, HymnSearchResult, ParsedVerse, HymnAudioFiles, AudioFileInfo types
- `app/lib/pdf/html-to-pdf.ts` — `parseHymnHtml()` converts letter_hymn HTML to ParsedVerse[], `extractPlainText()` for flat text
- `app/lib/directus/services/hymns.ts` — `searchHymns()`, `fetchHymnForPdf()`, audio field definitions (track_only, midi_file, soprano_voice, alto_voice, tenor_voice, bass_voice)

### Audio Infrastructure
- `app/api/hymns/audio/[fileId]/route.ts` — Audio proxy: server-side auth, range requests, caching. Client URL pattern: `/api/hymns/audio/${fileInfo.id}`

### Search and UI Patterns (reuse from empaquetador)
- `app/empaquetador/hooks/useHymnSearch.ts` — Debounced search hook, client-side filtering, 500-result batch fetch
- `app/empaquetador/hooks/useWizardReducer.ts` — Reducer pattern for complex UI state management
- `app/empaquetador/components/StepSeleccion.tsx` — Search/filter/results pattern, HymnDetailView with audio playback

### UI Component Library
- `app/lib/shadcn/ui/` — Full shadcn/ui library (49 components). Key for this phase: ScrollArea, Button, Slider, Tooltip, Dialog, DropdownMenu, Separator
- `app/lib/shadcn/utils.ts` — `cn()` utility

### Hymn Detail and Audio Player
- `app/empaquetador/components/HymnDetailModal.tsx` — Contains AudioTrackPlayer component with play/pause, seek bar, time display

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useHymnSearch` hook — drop into the playlist search for hymn browsing
- `AudioTrackPlayer` component pattern — reuse for the bottom audio bar (play/pause, seek, time)
- `parseHymnHtml()` — already segments lyrics into `ParsedVerse[]` with type='title'|'verse'
- `buildSlides()` logic in generate-hymn-propresenter.ts — verse/chorus intercalation and title slide pattern
- Audio proxy at `/api/hymns/audio/[fileId]` — handles auth, range requests, caching
- `fetchHymnForPdf()` — fetches complete hymn data including audio file references
- 49 shadcn/ui components — no new installs needed
- Framer Motion available for fade transitions

### Established Patterns
- Client components use `'use client'` directive
- Full-height layouts with `h-screen flex flex-col overflow-hidden` (empaquetador pattern)
- `useReducer` for complex state management (wizard pattern)
- shadcn components imported from `@/lib/shadcn/ui`
- Tailwind for all styling
- Spanish language for all UI text
- `<audio>` element with ref for playback control

### Integration Points
- New route: `app/visualizador/page.tsx` (or similar)
- Link from herramientas page or navbar
- Consumes: `/api/hymns/search` (GET), `/api/hymns/[id]` (GET for full hymn data), `/api/hymns/audio/[fileId]` (GET for audio streaming)
- New: projection window page (e.g., `app/visualizador/projection/page.tsx`) — the fullscreen output
- Communication: BroadcastChannel or postMessage between main tab and projection window

</code_context>

<specifics>
## Specific Ideas

- The projection window must be a clean, minimal page — no layout chrome, no navbar, no footer. Just the slide content filling the entire viewport.
- Keyboard shortcuts are critical for live use — the operator should be able to advance slides, play/pause audio, and black out the screen without reaching for the mouse.
- The "Logo" button should show the church logo (from Directus or public/) centered on the dark background, used for pre-service or between-song moments.
- Background image/color preference should persist via localStorage so the operator doesn't reconfigure every session.

</specifics>

<deferred>
## Deferred Ideas

- Multi-track audio mixer with individual volume sliders per voice part (v2 feature)
- Auto-advance slides based on audio timestamps / beat detection
- Remote control from mobile device (phone as slide clicker)
- Shared playlists saved to Directus for reuse across sessions
- Song arrangement editor (custom verse order per performance)
- Countdown timer between songs
- Scripture/announcement slides (non-hymn content)

</deferred>

---

*Phase: 06-visualizador-de-himnos-con-panel-tipo-propresenter-explorar-himnos-seleccionarlos-y-proyectar-diapositivas-en-ventana-fullscreen-con-reproduccion-de-pistas-de-audio*
*Context gathered: 2026-03-31*
