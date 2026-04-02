---
status: awaiting_human_verify
trigger: "score-playback-invalid-midi: MIDI playback broken in Partitura tab - Invalid MIDI Header error"
created: 2026-04-01T00:00:00Z
updated: 2026-04-01T00:20:00Z
---

## Current Focus

hypothesis: Three bugs combined to prevent MIDI playback: (1) wrong data format for loadNewSongList, (2) missing synth.connect(ctx.destination), (3) duration read synchronously before async parse completes
test: All three fixes applied, user verification needed
expecting: MIDI playback produces audible sound, slider tracks correctly, duration displays correctly
next_action: Await user verification

## Symptoms

expected: Pressing play should reproduce the score as MIDI audio using SpessaSynth
actual: Slider jumps 1 second and resets, timer shows -1:-1 / 0:00, no audio plays
errors: 1. SyntaxError Invalid MIDI Header Expected MThd 2. No songs loaded in sequencer
reproduction: Open any hymn details, go to Partitura tab, press play
started: Never worked since implementation

## Eliminated

- hypothesis: synth.connect(ctx.destination) not needed because WorkletSynthesizer auto-connects
  evidence: WRONG - WorkletSynthesizer does NOT auto-connect. BasicSynthesizer.connect() explicitly calls this.worklet.connect(destinationNode, i) for each output. Constructor never calls connect. The README example is incomplete/produces no audible output without connect.
  timestamp: 2026-04-01T00:15:00Z
  NOTE: This was initially eliminated as "not needed" but reversed after deeper investigation. It IS needed.

## Evidence

- timestamp: 2026-04-01T00:05:00Z
  checked: SpessaSynth SuppliedMIDIData type definition
  found: "type SuppliedMIDIData = BasicMIDI | { binary: ArrayBuffer; fileName?: string }" -- requires object with binary property
  implication: Raw ArrayBuffer is NOT a valid input -- FIX 1

- timestamp: 2026-04-01T00:06:00Z
  checked: SpessaSynth processor loadNewSongList handler (index.js line 1842-1852)
  found: When input lacks "duration" property, it calls BasicMIDI2.fromArrayBuffer(s.binary, s.fileName) -- s.binary is undefined when s is a raw ArrayBuffer
  implication: This causes "Invalid MIDI Header" error

- timestamp: 2026-04-01T00:10:00Z
  checked: BasicSynthesizer.connect() method in index.js line 462-466
  found: connect(destinationNode) iterates i=0..16 calling this.worklet.connect(destinationNode, i). Constructor at line 391-440 never calls connect. WorkletSynthesizer constructor at line 1059-1093 never calls connect either.
  implication: WorkletSynthesizer AudioWorkletNode is NEVER connected to audio destination -- FIX 2

- timestamp: 2026-04-01T00:12:00Z
  checked: Sequencer.loadNewSongList() in index.js line 2641-2646
  found: Sets this.midiData = void 0, sends message to worklet async. seq.duration returns this.midiData?.duration ?? 0 (line 2498-2499). Reading duration immediately after loadNewSongList always returns 0.
  implication: Duration always shows 0 because it's read before worklet finishes parsing -- FIX 3

- timestamp: 2026-04-01T00:14:00Z
  checked: Sequencer handleMessage "songChange" event (index.js line 2687-2694)
  found: When worklet finishes parsing, it sends "songChange" event. At that point midiData is populated and seq.duration returns real value. The sequencer exposes a "songChange" event via eventHandler.
  implication: Must listen for songChange event to read duration at the right time

## Resolution

root_cause: Three compounding bugs prevented MIDI playback: (1) loadNewSongList received raw ArrayBuffer instead of {binary: ArrayBuffer}, causing MIDI parse failure. (2) WorkletSynthesizer was never connected to AudioContext.destination, so even if MIDI loaded, no audio would reach speakers. (3) Duration was read synchronously after async loadNewSongList, always returning 0.
fix: (1) Wrap ArrayBuffer in {binary:...} object for loadNewSongList. (2) Add synth.connect(ctx.destination) after creating WorkletSynthesizer. (3) Listen for songChange event to update duration when worklet finishes parsing.
verification: TypeScript compiles clean; awaiting user runtime verification
files_changed: [app/hooks/useSpessaSynth.ts, app/components/MidiPlayer.tsx]
