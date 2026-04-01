---
phase: quick
plan: 260401-bkw
subsystem: ui
tags: [audio, midi, visualizador, empaquetador, ux]

provides:
  - Hymn name display in AudioBar for Visualizador
  - Descriptive download filenames for WAV, MIDI, and audio files
  - Reliable MIDI progress bar using performance.now()
affects: [visualizador, empaquetador]

tech-stack:
  added: []
  patterns:
    - "performance.now() for reliable wall-clock timing in Web Audio playback"

key-files:
  created: []
  modified:
    - app/visualizador/components/AudioBar.tsx
    - app/visualizador/page.tsx
    - app/components/MidiTrackPlayer.tsx
    - app/empaquetador/components/HymnDetailModal.tsx

key-decisions:
  - "Used performance.now() instead of AudioContext.currentTime for MIDI progress — AudioContext timing is unreliable when suspended/resumed"
  - "hymnName prop is optional in MidiTrackPlayer to maintain backward compatibility"

requirements-completed: []

duration: 3min
completed: 2026-04-01
---

# Quick Task 260401-bkw: Show Track Name in AudioBar and Proper Downloads Summary

**AudioBar now shows hymn name, all audio downloads include hymn name in filename, and MIDI progress slider advances reliably using wall-clock timing**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T14:24:55Z
- **Completed:** 2026-04-01T14:28:16Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

### Task 1: Show hymn name in AudioBar and descriptive download filenames
- Added `hymnName: string` prop to AudioBar — displays above track selector dropdown
- Passed `hymnName={activeHymn?.hymnData.name ?? ''}` from Visualizador page
- Added `hymnName?: string` prop to MidiTrackPlayer — WAV downloads become "HymnName - TrackName.wav", MIDI downloads become "HymnName - MIDI.mid"
- Updated AudioTrackPlayer in HymnDetailModal to accept `hymnName` — audio downloads become "HymnName - Label.mp3"
- Both MidiTrackPlayer and AudioTrackPlayer usages in HymnDetailModal now pass `hymnName={hymn.name}`
- **Commit:** 8dc2c65

### Task 2: Fix MIDI slider progress bar not advancing during playback
- Replaced `AudioContext.currentTime` with `performance.now() / 1000` in three locations: startPlayback, tick, and pause offset calculation
- Added `isPlayingRef.current` guard in tick() to prevent stale animation loops when playback stops from another path
- Restructured tick() to check elapsed >= duration and return early (letting onended handle cleanup) instead of continuing to schedule frames
- **Commit:** 8657030

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Verification

- TypeScript compilation: PASSED (no errors in production code; pre-existing test errors in `tests/lib/zip/` are unrelated)
- ESLint: Skipped (ESLint config has pre-existing issues in worktree context)
- Manual verification: Requires running dev server and testing audio playback

## Self-Check: PASSED
