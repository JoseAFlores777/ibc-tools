---
status: awaiting_human_verify
trigger: "MIDI playback doesn't stop on hymn navigation; progress slider doesn't support dragging"
created: 2026-04-03T00:00:00Z
updated: 2026-04-03T00:00:00Z
---

## Current Focus

hypothesis: Two confirmed bugs — (1) MidiPlayer key doesn't include hymn ID so React reuses instance across hymns, (2) slider uses onClick only, no drag support
test: Apply fixes and verify
expecting: MIDI stops on navigation, slider supports drag
next_action: Apply fixes to both files

## Symptoms

expected: When user navigates to next/previous hymn, any playing MIDI should stop. The progress slider should be draggable.
actual: MIDI continues playing after navigating to another hymn. The slider only responds to click, not drag.
errors: No error messages — behavioral bug.
reproduction: (1) Open hymn with MIDI, play it, navigate to next hymn — MIDI keeps playing. (2) Try to drag progress indicator — only responds to clicks.
started: Since MidiPlayer was implemented.

## Eliminated

(none — root causes confirmed from pre-analysis)

## Evidence

- timestamp: 2026-04-03
  checked: HymnDetailModal.tsx lines 565-566 and 703-704
  found: MidiPlayer rendered with key={field} where field is always "midi_file" — same key across hymns
  implication: React reuses component instance, no unmount/remount, MIDI keeps playing

- timestamp: 2026-04-03
  checked: MidiPlayer.tsx line 121
  found: Cleanup effect only runs on unmount, doesn't close AudioContext
  implication: Even if unmounted, AudioContext leaks

- timestamp: 2026-04-03
  checked: MidiPlayer.tsx lines 348-359
  found: Progress bar uses only onClick={seek} on a div — no mouse/touch drag handlers
  implication: Slider only responds to clicks, not drag gestures

## Resolution

root_cause: (1) MidiPlayer key doesn't include hymn identity, so React reuses same instance when navigating between hymns. (2) Progress slider is a div with only onClick — no drag support.
fix: (1) Change key to include hymn.id in both render sites. Add audioCtxRef.close() to cleanup. (2) Replace div-based slider with proper drag-supporting implementation using onPointerDown/Move/Up.
verification: 
files_changed: [app/components/MidiPlayer.tsx, app/empaquetador/components/HymnDetailModal.tsx]
