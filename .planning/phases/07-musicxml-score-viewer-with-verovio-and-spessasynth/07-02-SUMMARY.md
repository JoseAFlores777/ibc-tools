---
phase: 07-musicxml-score-viewer-with-verovio-and-spessasynth
plan: 02
subsystem: ui
tags: [verovio, spessasynth, wasm, hooks, midi, soundfont, indexeddb, raf]

requires:
  - phase: 07-musicxml-score-viewer-with-verovio-and-spessasynth
    provides: verovio and spessasynth_lib packages, WASM webpack config, AudioWorklet processor, proxy routes
provides:
  - useVerovio hook for WASM init, MusicXML loading, SVG rendering, MIDI generation
  - useSpessaSynth hook for SoundFont caching, synth/sequencer lifecycle, playback controls
  - useScoreCursor hook for RAF-based cursor sync with container-scoped DOM manipulation
  - MidiPlayer component as SpessaSynth-based drop-in replacement for MidiTrackPlayer
affects: [07-03, 07-04]

tech-stack:
  added: []
  patterns: [IndexedDB SoundFont caching, RAF cursor sync loop, container-scoped DOM manipulation]

key-files:
  created:
    - app/hooks/useVerovio.ts
    - app/hooks/useSpessaSynth.ts
    - app/hooks/useScoreCursor.ts
    - app/components/MidiPlayer.tsx
  modified:
    - app/empaquetador/components/HymnDetailModal.tsx

key-decisions:
  - "IndexedDB SoundFont cache shared between useSpessaSynth hook and MidiPlayer component (same DB/key)"
  - "useScoreCursor uses direct DOM manipulation (classList) instead of React state for RAF performance"
  - "MidiPlayer replicates MidiTrackPlayer visual UI exactly, only engine changes"
  - "Verovio renderToMIDI called immediately after loadData to build timing map (Pitfall 4 guard)"

patterns-established:
  - "SoundFont caching: ibc-audio-cache DB, files store, ibc-soundfont-v1 key"
  - "Container-scoped DOM queries: containerRef.current.querySelectorAll instead of document"

requirements-completed: [D-04, D-06, D-07, D-09, D-10, D-11]

duration: 9min
completed: 2026-04-01
---

# Phase 7 Plan 2: Core Hooks and MidiPlayer Summary

**Three Verovio/SpessaSynth hooks (WASM init, synth lifecycle, RAF cursor sync) plus MidiPlayer drop-in replacement with IndexedDB SoundFont caching**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-01T19:24:34Z
- **Completed:** 2026-04-01T19:34:12Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created useVerovio hook: WASM initialization, MusicXML loading with timing map build, SVG page rendering, scale adjustment
- Created useSpessaSynth hook: SoundFont download with progress tracking and IndexedDB caching, AudioWorklet synth, sequencer with play/pause/seek, automatic cleanup
- Created useScoreCursor hook: requestAnimationFrame sync loop reading sequencer time, highlighting active SVG notes via classList, page change detection for auto-scroll (D-11)
- Created MidiPlayer component as visually identical replacement for MidiTrackPlayer using SpessaSynth engine, with per-channel muting and SoundFont caching
- Migrated all MidiTrackPlayer import sites (HymnDetailModal) to MidiPlayer

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useVerovio, useSpessaSynth, and useScoreCursor hooks** - `a5a163e` (feat)
2. **Task 2: Create MidiPlayer component and migrate ALL MidiTrackPlayer import sites** - `39f3770` (feat)

## Files Created/Modified
- `app/hooks/useVerovio.ts` - Verovio WASM init, MusicXML loading, SVG rendering, MIDI generation
- `app/hooks/useSpessaSynth.ts` - SpessaSynth synth/sequencer lifecycle with IndexedDB SoundFont cache
- `app/hooks/useScoreCursor.ts` - RAF-based cursor sync with container-scoped DOM manipulation
- `app/components/MidiPlayer.tsx` - SpessaSynth-based MIDI player, drop-in replacement for MidiTrackPlayer
- `app/empaquetador/components/HymnDetailModal.tsx` - Migrated MidiTrackPlayer imports to MidiPlayer

## Decisions Made
- IndexedDB SoundFont cache shared between useSpessaSynth hook and MidiPlayer component using same DB name and key, avoiding duplicate downloads
- useScoreCursor uses direct DOM manipulation (classList.add/remove) instead of React state for RAF loop performance, per UI-SPEC interaction contract
- MidiPlayer preserves exact visual layout of MidiTrackPlayer (same icons, CSS classes, progress bar, voice muting UI) to ensure zero visual regression
- Verovio renderToMIDI() called immediately after loadData() inside loadScore to build internal timing map (Research Pitfall 4 guard)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. SoundFont setup was done in Plan 01.

## Known Stubs
None - all hooks and component are fully wired with real data sources.

## Next Phase Readiness
- All three hooks ready for consumption by ScoreViewer component (Plan 03)
- MidiPlayer can be used anywhere MidiTrackPlayer was used
- useVerovio provides loadScore/renderPage/getElementsAtTime for score display
- useSpessaSynth provides play/pause/seek for MIDI playback
- useScoreCursor provides real-time note highlighting during playback

## Self-Check: PASSED

All 4 created files verified on disk. Both task commits (a5a163e, 39f3770) verified in git log.

---
*Phase: 07-musicxml-score-viewer-with-verovio-and-spessasynth*
*Completed: 2026-04-01*
