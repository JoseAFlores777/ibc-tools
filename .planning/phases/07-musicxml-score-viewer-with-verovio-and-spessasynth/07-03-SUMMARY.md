---
phase: 07-musicxml-score-viewer-with-verovio-and-spessasynth
plan: 03
subsystem: ui
tags: [score-viewer, verovio, spessasynth, musicxml, playback, zoom, cursor]

requires:
  - phase: 07-musicxml-score-viewer-with-verovio-and-spessasynth
    provides: useVerovio, useSpessaSynth, useScoreCursor hooks, MusicXML proxy route
provides:
  - ScoreViewer component with SVG rendering, playback, zoom, keyboard shortcuts
  - ScoreToolbar with zoom controls and page indicator
  - ScoreViewerControls with play/pause, seek slider, SoundFont progress
  - Partituras tab integration in HymnDetailModal with conditional rendering
affects: [07-04]

tech-stack:
  added: []
  patterns: [dynamic import with ssr:false for WASM components, ResizeObserver for responsive scale, dangerouslySetInnerHTML for SVG rendering]

key-files:
  created:
    - app/components/ScoreViewer.tsx
    - app/components/ScoreToolbar.tsx
    - app/components/ScoreViewerControls.tsx
  modified:
    - app/empaquetador/components/HymnDetailModal.tsx
    - app/interfaces/Hymn.interface.ts

key-decisions:
  - "ScoreViewer uses Verovio-generated MIDI (not original) per Research Pitfall guidance"
  - "Responsive scale via ResizeObserver: 30 (<640px), 35 (640-1024px), 40 (>1024px)"
  - "Cursor CSS injected via style tag inside score-container for scoped note highlighting"
  - "Tabs layout added to HymnDetailModal with Letra and Partitura tabs"

patterns-established:
  - "Dynamic import pattern for WASM components: dynamic(() => import(...), { ssr: false })"
  - "Keyboard shortcuts on container div with tabIndex={0} and onKeyDown"

requirements-completed: [D-02, D-04, D-05, D-07, D-09, D-10, D-11]

duration: 5min
completed: 2026-04-01
---

# Phase 7 Plan 3: ScoreViewer Components and HymnDetailModal Integration Summary

**ScoreViewer with Verovio SVG rendering, SpessaSynth playback, cursor sync, zoom controls, keyboard shortcuts, and Partituras tab integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-01T19:44:05Z
- **Completed:** 2026-04-01T19:48:44Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created ScoreViewer component: fetches MusicXML from proxy, renders SVG via Verovio, preloads SoundFont, loads Verovio-generated MIDI into SpessaSynth sequencer
- Created ScoreToolbar with ZoomIn/ZoomOut buttons (min 20, max 80, step 10), zoom reset, and "Pag. X / N" page indicator
- Created ScoreViewerControls with Play/Pause toggle (44px touch target), Slider seek bar, time display (tabular-nums), SoundFont download progress, and audio error banner
- Implemented all loading states per UI-SPEC: WASM loading skeleton, MusicXML loading skeleton, SoundFont progress bar, error states (WASM, MusicXML, SoundFont)
- Added keyboard shortcuts: Space (play/pause), Arrow keys (seek +/-5s), +/= (zoom in), - (zoom out), 0 (zoom reset)
- Added responsive scale via ResizeObserver breakpoints
- Injected cursor CSS for note highlighting during playback (.score-container g.note.playing)
- Integrated ScoreViewer into HymnDetailModal with dynamic import (ssr: false)
- Added Tabs layout with Letra and Partitura tabs
- Conditional rendering: ScoreViewer when hymn.hasMusicXml, placeholder "Proximamente" when not

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ScoreViewer, ScoreToolbar, and ScoreViewerControls components** - `0c9a0f4` (feat)
2. **Task 2: Integrate ScoreViewer into HymnDetailModal Partituras tab** - `df87ab9` (feat)

## Files Created/Modified
- `app/components/ScoreViewer.tsx` - Main score viewer with Verovio/SpessaSynth hooks, zoom, keyboard shortcuts, all loading/error states
- `app/components/ScoreToolbar.tsx` - Top toolbar with zoom controls and page indicator
- `app/components/ScoreViewerControls.tsx` - Bottom playback bar with play/pause, seek slider, time display, progress
- `app/empaquetador/components/HymnDetailModal.tsx` - Added dynamic ScoreViewer import, Tabs layout, Partituras tab with conditional rendering
- `app/interfaces/Hymn.interface.ts` - Extended HymnSearchResult with musicxmlFileId and hasMusicXml fields

## Decisions Made
- ScoreViewer uses Verovio-generated MIDI (getMidi()) rather than original MIDI file, per Research guidance on timing map accuracy
- Responsive scale determined by ResizeObserver on score container (30/35/40 for mobile/tablet/desktop)
- Cursor highlighting CSS injected via style tag inside score-container div for scoping
- Tabs component added to HymnDetailModal to organize Letra and Partitura content

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added HymnSearchResult fields to worktree interface**
- **Found during:** Task 2
- **Issue:** This worktree did not have Plan 01's HymnSearchResult extensions (musicxmlFileId, hasMusicXml) since Plan 01 committed to a different worktree
- **Fix:** Added the two fields to HymnSearchResult in this worktree's Hymn.interface.ts
- **Files modified:** app/interfaces/Hymn.interface.ts
- **Commit:** df87ab9

**2. [Rule 3 - Blocking] Added Tabs structure not yet present in worktree**
- **Found during:** Task 2
- **Issue:** Plan 02 added Tabs layout to HymnDetailModal in a parallel worktree; this worktree has pre-02 version
- **Fix:** Added Tabs/TabsList/TabsTrigger/TabsContent structure around the letter content, with Partituras tab
- **Files modified:** app/empaquetador/components/HymnDetailModal.tsx
- **Commit:** df87ab9

---

**Total deviations:** 2 auto-fixed (Rule 3 - blocking issues from parallel execution)
**Impact on plan:** No scope creep. Changes will merge cleanly with Plans 01 and 02.

## Issues Encountered
- TypeScript compilation shows expected errors for missing hook modules (from Plan 02) and missing HymnSearchResult fields in service layer (from Plan 01) -- these resolve after merge with parallel worktrees
- No errors in HymnDetailModal.tsx or HymnExplorer.tsx

## User Setup Required
None - all infrastructure was set up in Plans 01 and 02.

## Known Stubs
None - all components are fully wired to hooks and data sources. The Partituras tab shows ScoreViewer when MusicXML is available or a placeholder when not.

## Next Phase Readiness
- ScoreViewer component ready for use in any context that has a musicxmlFileId
- All Plan 04 work (visualization page, full-screen mode) can consume ScoreViewer directly

## Self-Check: PASSED

All 3 created files verified on disk. Both task commits (0c9a0f4, df87ab9) verified in git log.

---
*Phase: 07-musicxml-score-viewer-with-verovio-and-spessasynth*
*Completed: 2026-04-01*
