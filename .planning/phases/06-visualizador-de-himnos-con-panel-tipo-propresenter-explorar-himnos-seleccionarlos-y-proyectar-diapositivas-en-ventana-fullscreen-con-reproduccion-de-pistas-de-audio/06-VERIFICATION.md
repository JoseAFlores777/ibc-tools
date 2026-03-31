---
phase: 06-visualizador
verified: 2026-03-31T21:45:00Z
status: human_needed
score: 6/6 automated must-haves verified
re_verification: false
human_verification:
  - test: "Open /visualizador and verify 3-column dark layout with playlist, slide grid, and live preview columns at correct widths (280px, flex, 320px)"
    expected: "Three independent scrolling columns render; dark background forced by layout; minimum-width guard appears for windows under 1024px"
    why_human: "CSS layout and visual appearance require browser rendering to confirm"
  - test: "Search for a hymn in the left column search bar, click a result to add it"
    expected: "Hymn appears in playlist, center grid populates with slide thumbnails showing verse labels and truncated lyrics, right preview shows first slide"
    why_human: "Requires live Directus connection and visual confirmation of slide thumbnails"
  - test: "Drag a playlist item to a new position"
    expected: "Playlist reorders correctly; @dnd-kit drag handle works; active hymn index adjusts"
    why_human: "Drag-and-drop interaction requires manual browser testing"
  - test: "Click 'Proyectar' button and then click the fullscreen overlay in the new window"
    expected: "Popup window opens at /visualizador/proyeccion; fullscreen overlay prompts user; clicking it enters fullscreen; slide renders with dark background"
    why_human: "Window.open, fullscreen API, and popup blocker behavior requires live browser verification"
  - test: "Advance slides with ArrowRight to the last slide of the first hymn, then press ArrowRight again (D-07)"
    expected: "Projection window crossfades to first slide of second hymn automatically (400ms crossfade)"
    why_human: "Crossfade transition timing and auto-advance across hymns require live observation"
  - test: "Press B, C, L keyboard shortcuts and verify projection modes"
    expected: "B: solid black screen; C: themed background, no text; L: church logo or fallback text centered on background"
    why_human: "BroadcastChannel cross-window behavior and visual mode rendering require live verification"
  - test: "Select a hymn with audio tracks; verify audio bar enables; press P to play; switch tracks"
    expected: "AudioBar shows play/pause button, track selector dropdown with only available tracks; P key plays; track switch stops current and loads new src"
    why_human: "Audio streaming requires live Directus audio files and browser audio API behavior"
  - test: "Switch to a different hymn while audio is playing"
    expected: "Audio stops immediately (D-20)"
    why_human: "Audio stop-on-hymn-change behavior requires live timing verification"
  - test: "Navigate to /herramientas and verify the Visualizador card"
    expected: "'Visualizador de Himnos' card with Monitor icon links to /visualizador"
    why_human: "Page render requires browser verification"
---

# Phase 06: Visualizador de Himnos Verification Report

**Phase Goal:** Operator can browse hymns, build a playlist, and project lyrics fullscreen in a separate browser window with crossfade transitions and audio playback controls -- a live worship presentation tool
**Verified:** 2026-03-31T21:45:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Operator can search and add hymns to an ordered playlist with drag-and-drop reordering | ? HUMAN NEEDED | PlaylistColumn.tsx: useHymnSearch wired, DndContext + SortableContext present, onAddHymn dispatches ADD_HYMN via `/api/hymns/${id}` fetch |
| 2 | Clicking a hymn loads its slides (verse/chorus segmented) as thumbnails in the center column | ? HUMAN NEEDED | SlideGridColumn.tsx + SlideThumbnail.tsx exist and wired; buildSlideGroups produces intercalated chorus — 35 tests pass |
| 3 | Clicking "Proyectar" opens a fullscreen projection window showing the current slide with crossfade transitions | ? HUMAN NEEDED | page.tsx: `window.open('/visualizador/proyeccion', ...)` in click handler; proyeccion/page.tsx: AnimatePresence with duration 0.4, PING/PONG handshake |
| 4 | Negro/Limpiar/Logo controls change the projection mode via BroadcastChannel | ? HUMAN NEEDED | ProjectionControls.tsx buttons dispatch SET_PROJECTION_MODE; page.tsx useEffect sends BLACK_SCREEN/CLEAR_TEXT/SHOW_LOGO; proyeccion/page.tsx handles all message types |
| 5 | Audio bar plays accompaniment tracks with seek, and audio stops on hymn change | ? HUMAN NEEDED | AudioBar.tsx: `<audio>` element, Slider seek, DropdownMenu track selector, prevHymnId ref stops audio on hymn change (D-20) |
| 6 | Keyboard shortcuts (arrows, space, B, C, L, P, Ctrl+/-) work for live worship operation | ? HUMAN NEEDED | useKeyboardShortcuts.ts: all 8 shortcut groups implemented with input element guard, wired in page.tsx |

**Automated score: 6/6 truths have complete implementation** — all blocked by human-verifiable behavior only (live browser, BroadcastChannel, audio API)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/visualizador/lib/types.ts` | All TypeScript interfaces | ✓ VERIFIED | VisualizadorState, VisualizadorAction (14 variants), PlaylistHymn, SlideData, ThemeConfig, ProjectionMode, AudioState all exported |
| `app/visualizador/lib/projection-channel.ts` | BroadcastChannel protocol | ✓ VERIFIED | CHANNEL_NAME='ibc-visualizador', ProjectionMessage with SHOW_SLIDE/BLACK_SCREEN/CLEAR_TEXT/SHOW_LOGO/PING/PONG |
| `app/visualizador/lib/theme-presets.ts` | Theme presets | ✓ VERIFIED | 5 presets (3 solid + 2 gradient), DEFAULT_THEME exported |
| `app/visualizador/lib/build-slides-client.ts` | Client-side slide builder | ✓ VERIFIED | parseHymnHtmlClient (DOMParser) + buildSlideGroups with intercalated chorus; no node-html-parser import |
| `app/visualizador/lib/projection-channel.test.ts` | Tests for protocol | ✓ VERIFIED | 7 tests passing — CHANNEL_NAME and all 6 message discriminants |
| `app/visualizador/lib/build-slides-client.test.ts` | Tests for slide builder | ✓ VERIFIED | 10 tests passing — parser, chorus intercalation, empty input, header skipping |
| `app/visualizador/hooks/useVisualizador.ts` | Main reducer hook | ✓ VERIFIED | visualizadorReducer (14 action handlers) + useVisualizador hook exported; D-07 auto-advance and D-20 audio stop implemented |
| `app/visualizador/hooks/useVisualizador.test.ts` | Reducer tests | ✓ VERIFIED | 18 tests passing — all action types covered |
| `app/visualizador/hooks/useBroadcastChannel.ts` | BroadcastChannel hook | ✓ VERIFIED | useRef lifecycle, CHANNEL_NAME constant, onMessage callback ref pattern |
| `app/visualizador/hooks/useAutoFontSize.ts` | Font auto-sizing | ✓ VERIFIED | Binary search 16-120px, canvas measureText, sizeOffset applied |
| `app/visualizador/hooks/useKeyboardShortcuts.ts` | Keyboard shortcuts | ✓ VERIFIED | ArrowRight/Left/Space/B/L/C/P/Ctrl+=/Ctrl+- with input guard, e.preventDefault() |
| `app/visualizador/page.tsx` | Main control panel | ✓ VERIFIED | 'use client', useVisualizador, useBroadcastChannel, useKeyboardShortcuts, window.open, h-screen flex overflow-hidden, w-[280px]/w-[320px], 1024px guard |
| `app/visualizador/layout.tsx` | Route layout | ✓ VERIFIED | dark class, bg-background, title 'Visualizador de Himnos', no navbar |
| `app/visualizador/components/PlaylistColumn.tsx` | Left column | ✓ VERIFIED | DndContext, SortableContext, useHymnSearch, "Buscar himno por nombre o numero...", "Sin himnos en la lista" |
| `app/visualizador/components/PlaylistItem.tsx` | Playlist item | ✓ VERIFIED | useSortable, GripVertical, border-[#eaba1c] active state, remove button with tooltip |
| `app/visualizador/components/SlideGridColumn.tsx` | Center column | ✓ VERIFIED | SlideThumbnail grid, "Seleccione un himno" empty state, active slide index passed |
| `app/visualizador/components/SlideThumbnail.tsx` | Slide thumbnail | ✓ VERIFIED | aspect-video, bg-[#1a1a2e], ring-[#eaba1c] active, verse label, line-clamp |
| `app/visualizador/components/SlideRenderer.tsx` | Shared slide renderer | ✓ VERIFIED | 4 modes (black/clear/logo/slide), system-ui font, 80px safe area, text-white/50 verse label, image background type supported |
| `app/visualizador/components/LivePreviewColumn.tsx` | Right column | ✓ VERIFIED | SlideRenderer isPreview=true, ProjectionControls, aspect-video, "Proyectando"/"Ventana de proyeccion cerrada" status |
| `app/visualizador/components/ProjectionControls.tsx` | Projection controls | ✓ VERIFIED | Proyectar/Cerrar toggle (Monitor icon), Negro/Limpiar/Logo with active state, Reducir texto/Aumentar texto, Tooltip keyboard hints |
| `app/visualizador/components/AudioBar.tsx` | Audio bar | ✓ VERIFIED | `<audio>` element, preload="metadata", /api/hymns/audio/ URL, Pista completa/Soprano/Alto/Tenor/Bajo labels, DropdownMenu, Slider, h-[72px], track_only default (D-18), D-20 stop on hymn change |
| `app/visualizador/proyeccion/page.tsx` | Projection window | ✓ VERIFIED | BroadcastChannel, CHANNEL_NAME, requestFullscreen, "Haga clic para pantalla completa", AnimatePresence duration 0.4, useAutoFontSize, PING sent on mount |
| `app/herramientas/page.tsx` | Herramientas link | ✓ VERIFIED | "Visualizador de Himnos" card with Monitor icon linking to /visualizador |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `page.tsx` | `hooks/useVisualizador.ts` | useVisualizador hook | ✓ WIRED | `import { useVisualizador }` on line 6; state and dispatch used throughout |
| `page.tsx` | `hooks/useBroadcastChannel.ts` | channel send | ✓ WIRED | `import { useBroadcastChannel }` on line 7; send() called in useEffect and PING handler |
| `page.tsx` | `components/LivePreviewColumn.tsx` | renders right column | ✓ WIRED | `import LivePreviewColumn` on line 11; `<LivePreviewColumn>` in JSX |
| `page.tsx` | `components/AudioBar.tsx` | renders bottom bar | ✓ WIRED | `import AudioBar` on line 12; `<AudioBar>` with hymnAudio/hymnId/activeTrackField/playing props |
| `components/PlaylistColumn.tsx` | `app/empaquetador/hooks/useHymnSearch.ts` | reuses search hook | ✓ WIRED | `import { useHymnSearch }` on line 20; query/pageResults/isLoading destructured |
| `components/LivePreviewColumn.tsx` | `components/SlideRenderer.tsx` | preview render | ✓ WIRED | `import SlideRenderer` on line 8; `<SlideRenderer isPreview={true}>` in JSX |
| `proyeccion/page.tsx` | `lib/projection-channel.ts` | BroadcastChannel protocol | ✓ WIRED | `import { CHANNEL_NAME }` on line 12; `new BroadcastChannel(CHANNEL_NAME)` on line 80 |
| `proyeccion/page.tsx` | `components/SlideRenderer.tsx` | fullscreen rendering | ✓ WIRED | `import SlideRenderer` on line 11; `<SlideRenderer isPreview={false}>` inside AnimatePresence |
| `components/AudioBar.tsx` | `/api/hymns/audio/[fileId]` | audio streaming URL | ✓ WIRED | `/api/hymns/audio/${fileInfo.id}` on line 148; audio element src set dynamically |
| `hooks/useVisualizador.ts` | `lib/types.ts` | TypeScript contracts | ✓ WIRED | `import type { VisualizadorState, VisualizadorAction, PlaylistHymn }` on lines 8-13 |
| `lib/build-slides-client.ts` | `@/app/interfaces/Hymn.interface` | hymn type imports | ✓ WIRED | `import type { ParsedVerse, ParsedLine, HymnForPdf }` on line 9 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `proyeccion/page.tsx` | `currentSlide` | BroadcastChannel SHOW_SLIDE/PONG messages from control panel | Yes — control panel reads from real playlist state | ✓ FLOWING |
| `components/SlideRenderer.tsx` | `slide.text` | Passed as prop from parent (page.tsx -> LivePreviewColumn -> SlideRenderer, or proyeccion/page.tsx) | Yes — derived from buildSlideGroups(parseHymnHtmlClient(hymn.letter_hymn)) | ✓ FLOWING |
| `components/AudioBar.tsx` | `audioRef.src` | `/api/hymns/audio/${fileInfo.id}` where fileInfo comes from `hymnAudio[activeTrackField]` | Yes — hymnAudio comes from `playlist[activeHymnIndex].hymnData.audioFiles` fetched from Directus | ✓ FLOWING |
| `components/PlaylistColumn.tsx` | `pageResults` | `useHymnSearch()` hook — debounced search against `/api/hymns/search` | Yes — existing search infrastructure with real Directus data | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit tests: slide builder, projection channel, reducer | `npx vitest run app/visualizador/ --reporter=verbose` | 175 tests pass (35 unique, duplicated in worktrees) | ✓ PASS |
| TypeScript compilation (all visualizador files) | `npx tsc --noEmit` | 0 errors in visualizador files | ✓ PASS |
| happy-dom installed (test environment) | `ls node_modules/happy-dom` | Present after `npm install happy-dom --legacy-peer-deps` | ✓ PASS (see note below) |
| @dnd-kit packages installed | `package.json` grep | core@^6.3.1, sortable@^10.0.0, utilities@^3.2.2 | ✓ PASS |
| Audio API endpoint exists | `ls app/api/hymns/audio/[fileId]/` | route.ts present | ✓ PASS |
| Hymn detail API endpoint exists | `ls app/api/hymns/[id]/` | route.ts present | ✓ PASS |

**Note on happy-dom:** The package was listed in `package.json` devDependencies but was NOT installed in `node_modules/` at time of verification — causing all 5 test files using `// @vitest-environment happy-dom` to fail with `ERR_MODULE_NOT_FOUND`. Running `npm install happy-dom --legacy-peer-deps` resolved this. This is an environment gap, not a code gap.

### Requirements Coverage

The D-xx requirement IDs (D-01 through D-20) are Phase 6-specific implementation decisions documented in `06-CONTEXT.md`, not entries in `REQUIREMENTS.md` (which covers Phases 1-4 BUSQ/IMPR/AUDIO/GEN/UX requirements). All 20 D-xx decisions are satisfied:

| Requirement | Source Plan(s) | Description (from 06-CONTEXT.md) | Status | Evidence |
|-------------|---------------|-----------------------------------|--------|----------|
| D-01 | 06-02 | 3-column layout: playlist / slide grid / live preview | ✓ SATISFIED | page.tsx: w-[280px], flex-1, w-[320px] |
| D-02 | 06-04 | Bottom bar (full width) with audio controls | ✓ SATISFIED | AudioBar.tsx h-[72px], flex, full width |
| D-03 | 06-02 | h-screen flex layout, no page scrolling | ✓ SATISFIED | page.tsx: `h-screen flex flex-col overflow-hidden` |
| D-04 | 06-02 | Left column playlist with inline search reusing useHymnSearch | ✓ SATISFIED | PlaylistColumn.tsx: useHymnSearch imported and used |
| D-05 | 06-01, 06-02 | Drag-and-drop playlist reordering | ✓ SATISFIED | @dnd-kit/sortable wired in PlaylistColumn |
| D-06 | 06-01, 06-02 | Click thumbnail to project; arrow keys/space navigate slides | ✓ SATISFIED | SlideGridColumn + useKeyboardShortcuts |
| D-07 | 06-01 | Auto-advance to next hymn on last slide + ArrowRight | ✓ SATISFIED | visualizadorReducer NEXT_SLIDE: advances activeHymnIndex; 18 tests pass |
| D-08 | 06-03 | Proyectar opens separate window via window.open + Fullscreen API | ✓ SATISFIED | page.tsx: window.open, proyeccion/page.tsx: requestFullscreen |
| D-09 | 06-01, 06-03 | BroadcastChannel for cross-window communication | ✓ SATISFIED | CHANNEL_NAME='ibc-visualizador', 6 message types, PING/PONG handshake |
| D-10 | 06-03 | Negro/Limpiar/Logo projection mode controls | ✓ SATISFIED | ProjectionControls.tsx buttons; all 3 modes handled in SlideRenderer.tsx |
| D-11 | 06-01, 06-03 | 300-500ms crossfade between slides | ✓ SATISFIED | proyeccion/page.tsx: AnimatePresence duration=0.4, useReducedMotion support |
| D-12 | 06-01, 06-03 | Dark default theme; 5 built-in presets; image type deferred | ✓ SATISFIED | theme-presets.ts: DEFAULT_THEME #1a1a2e; SlideRenderer handles solid/gradient/image |
| D-13 | 06-01 | Slide splitting: one verse per slide, intercalated chorus, intro slide | ✓ SATISFIED | buildSlideGroups in build-slides-client.ts; 10 tests verify pattern |
| D-14 | 06-01, 06-03 | Auto font size + manual +/- adjust | ✓ SATISFIED | useAutoFontSize binary search; FONT_SIZE_UP/DOWN in reducer; Ctrl+/- keyboard shortcuts |
| D-15 | 06-01, 06-03 | Verse label (ESTROFA I, CORO) above lyrics | ✓ SATISFIED | SlideData.verseLabel field; SlideRenderer renders verseLabel in text-white/50 |
| D-16 | 06-04 | Manual audio play -- operator clicks play when ready | ✓ SATISFIED | AudioBar play/pause button; audio and slides independent |
| D-17 | 06-04 | Single track at a time; switching stops current | ✓ SATISFIED | AudioBar: track change resets src; only one `<audio>` element |
| D-18 | 06-04 | Default track: track_only preferred | ✓ SATISFIED | AudioBar TRACK_PREFERENCE array with track_only first |
| D-19 | 06-04 | Audio streams via /api/hymns/audio/[fileId] | ✓ SATISFIED | AudioBar: `/api/hymns/audio/${fileInfo.id}` src pattern |
| D-20 | 06-01, 06-04 | Audio continues within hymn; stops on hymn change | ✓ SATISFIED | Reducer SET_ACTIVE_HYMN stops audio; AudioBar prevHymnId ref pauses on change |

**Coverage:** 20/20 D-xx requirements covered. All satisfied by implementation.

**REQUIREMENTS.md cross-check:** REQUIREMENTS.md covers Phase 1-4 items (BUSQ, IMPR, AUDIO, GEN, UX). No Phase 6 requirements exist in that file, and no Phase 6 items are listed in the Traceability table. This is expected and correct — Phase 6 uses design decisions (D-xx) documented in 06-CONTEXT.md rather than formal requirements. No orphaned requirements found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/visualizador/hooks/useKeyboardShortcuts.ts` | 66-67 | `SET_PROJECTION_MODE mode: 'black'` — B key sets black but does not toggle back to 'slide' | ⚠️ Warning | Plan 03 defines toggle behavior for B/C/L; toggle logic lives in page.tsx handlers (handleBlack/handleClear/handleLogo), NOT in useKeyboardShortcuts. The keyboard shortcut unconditionally sets the mode without toggling. This means pressing B twice puts you in black mode, pressing B again sets black mode again (no toggle). The toggle behavior only works for mouse clicks via the buttons. |
| `app/visualizador/hooks/useVisualizador.test.ts` | 1 | `// @vitest-environment happy-dom` — dependency not installed in node_modules at verification time | ⚠️ Warning | Tests failed until `npm install happy-dom --legacy-peer-deps` was run. package.json declares it but lockfile/node_modules were out of sync. |

**Stub classification for anti-patterns:** Neither is a functional stub blocking the goal. The keyboard toggle behavior discrepancy is a UX inconsistency (clicks toggle, key presses set-only). The happy-dom gap is an environment setup issue, not a code defect.

### Human Verification Required

The following items require live browser testing. Automated checks confirmed all code exists, is substantive, and is wired. These items test runtime behavior.

#### 1. 3-Column Layout and Dark Mode

**Test:** Open `http://localhost:3000/visualizador` on a wide screen (1280px+) and a narrow screen (<1024px)
**Expected:** Wide: 3 columns render in dark mode, no navbar visible, independent column scrolling. Narrow: "El visualizador requiere una pantalla de al menos 1024px" message appears
**Why human:** CSS layout rendering and Tailwind dark mode class behavior require browser verification

#### 2. Hymn Search and Add to Playlist

**Test:** Type a hymn name in the left column search input
**Expected:** Dropdown results appear with hymn_number and name; clicking a result fetches `/api/hymns/${id}`, adds hymn to playlist with slides populating in center grid
**Why human:** Requires live Directus connection; API response structure must match HymnForPdf interface

#### 3. Projection Window + Crossfade Transitions

**Test:** Add 2 hymns. Click "Proyectar". In the projection window, click the fullscreen overlay. Press ArrowRight repeatedly to advance through slides including the boundary between hymn 1 and hymn 2.
**Expected:** Popup opens; fullscreen enters on click; slides crossfade at ~400ms; on last slide of hymn 1 pressing ArrowRight loads first slide of hymn 2 in projection window
**Why human:** window.open popup behavior, Fullscreen API, BroadcastChannel cross-window sync, and animation timing require live observation

#### 4. Projection Mode Buttons (Negro / Limpiar / Logo)

**Test:** With projection open and a slide showing, click Negro, then click Negro again
**Expected:** First click: projection goes black. Second click: projection returns to slide mode (toggle behavior via button). Verify B key sets black but note it does NOT toggle back (see anti-pattern above).
**Why human:** BroadcastChannel cross-window behavior and mode rendering require live verification

#### 5. Audio Bar Playback and Hymn-Change Stop

**Test:** Add a hymn with audio. Press P. Let audio play. Click a different hymn in the playlist.
**Expected:** Audio starts playing; on hymn change audio stops immediately; new default track (track_only preferred) auto-selects
**Why human:** Audio API behavior, `<audio>` element src management, and cross-event timing require live browser testing

#### 6. Herramientas Page Link

**Test:** Open `http://localhost:3000/herramientas`
**Expected:** "Visualizador de Himnos" card with Monitor icon appears and links to `/visualizador`
**Why human:** Page render with image assets and routing require browser verification

### Gaps Summary

No blocker gaps were found. All 23 artifacts are present, substantive, and wired. All 20 D-xx requirements are satisfied by the implementation. The 175 unit tests pass (after resolving the happy-dom installation gap which is an environment issue, not a code defect).

Two minor items noted:

1. **Keyboard shortcut toggle inconsistency (Warning):** The B/C/L keyboard shortcuts in `useKeyboardShortcuts.ts` unconditionally set the projection mode without toggling back to 'slide'. The toggle logic exists in `page.tsx` handlers (handleBlack/handleClear/handleLogo) for mouse clicks but was not extended to keyboard shortcuts. Pressing B twice leaves the projection in black mode instead of toggling back. This is functional but inconsistent with the documented behavior in the plan.

2. **happy-dom not installed (Warning):** The package.json declares `"happy-dom": "^20.8.9"` but it was absent from `node_modules/`. This caused all `// @vitest-environment happy-dom` test files to fail with `ERR_MODULE_NOT_FOUND`. Required `npm install happy-dom --legacy-peer-deps` to resolve. After installation: 175/175 tests pass.

Human verification covers the full 22-step workflow from Plan 04 and is the final gate before the phase can be declared complete.

---

_Verified: 2026-03-31T21:45:00Z_
_Verifier: Claude (gsd-verifier)_
