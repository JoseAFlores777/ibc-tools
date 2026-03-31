---
phase: "06-visualizador"
plan: "04"
subsystem: "audio-playback"
tags: [audio, visualizador, playback, herramientas]
dependency_graph:
  requires: ["06-03"]
  provides: ["audio-bar", "audio-playback", "herramientas-link"]
  affects: ["app/visualizador/page.tsx", "app/herramientas/page.tsx"]
tech_stack:
  added: []
  patterns: ["persistent-audio-element", "broadcast-channel-audio-state"]
key_files:
  created:
    - app/visualizador/components/AudioBar.tsx
  modified:
    - app/visualizador/page.tsx
    - app/herramientas/page.tsx
decisions:
  - "Persistent <audio> element to avoid remount on slide changes (Research pitfall 5)"
  - "Default track preference: track_only first, then voice parts, skip midi_file (D-18)"
  - "NON_PLAYABLE set excludes midi_file from browser playback"
metrics:
  duration: "2min 42s"
  completed: "2026-03-31"
---

# Phase 06 Plan 04: Audio Playback Bar and Herramientas Link Summary

Audio playback bar with play/pause, track selector dropdown, seek slider, and time display wired into the visualizador control panel bottom section. Herramientas page links to /visualizador.

## What Was Built

### AudioBar Component (`app/visualizador/components/AudioBar.tsx`)
- Persistent `<audio>` element with `preload="metadata"` that survives slide changes
- Play/Pause button with Tooltip showing keyboard hint "(P)"
- DropdownMenu track selector showing only available (non-null, playable) tracks
- Slider seek bar with 0.1% step precision and 44px touch target
- Time display in `m:ss / m:ss` format with tabular-nums
- Framer Motion slide-up entrance animation (y: 72 -> 0, 200ms)
- Auto-selects default track (track_only preferred per D-18) on hymn change
- Pauses and resets on hymn change (D-20 compliance)
- Disabled state with opacity-50 when no hymn or no audio available
- "Sin pistas de audio disponibles" message when hymn has no audio

### Page Wiring (`app/visualizador/page.tsx`)
- AudioBar receives hymnAudio, hymnId, activeTrackField, playing from state
- SET_AUDIO_TRACK and SET_AUDIO_PLAYING actions wired to callbacks
- useKeyboardShortcuts hook connected with togglePlayPause callback
- All keyboard shortcuts active: ArrowRight/Left, B, C, L, P, Ctrl+/- 

### Herramientas Link (`app/herramientas/page.tsx`)
- Added "Visualizador de Himnos" card with Monitor icon
- Description: "Proyectar letras de himnos en pantalla completa con pistas de audio."
- Links to /visualizador, follows existing card pattern

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 51c95d8 | feat(06-04): audio bar with play/pause, track selector, seek, and herramientas link |

## Verification

- TypeScript compilation: PASSED (no errors in visualizador or herramientas files)
- All acceptance criteria verified: use client, audio element, ref, API URL, labels, DropdownMenu, Slider, height, preload, track_only default
- Pre-existing errors in PlaylistColumn.tsx (missing @dnd-kit) and test files are out of scope

## Self-Check: PASSED
