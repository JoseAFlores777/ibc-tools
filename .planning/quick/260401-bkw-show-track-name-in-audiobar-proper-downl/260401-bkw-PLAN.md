---
phase: quick
plan: 260401-bkw
type: execute
wave: 1
depends_on: []
files_modified:
  - app/visualizador/components/AudioBar.tsx
  - app/visualizador/page.tsx
  - app/components/MidiTrackPlayer.tsx
  - app/empaquetador/components/HymnDetailModal.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "AudioBar displays the hymn name prominently so the user knows which hymn is playing"
    - "Downloaded WAV voice files include the hymn name in the filename (e.g. 'Santo Santo Santo - Soprano.wav')"
    - "Downloaded MIDI files include the hymn name in the filename (e.g. 'Santo Santo Santo - MIDI.mid')"
    - "Downloaded audio files from HymnDetailModal include the hymn name in the filename"
    - "MIDI slider bar advances smoothly during playback reflecting actual progress"
  artifacts:
    - path: "app/visualizador/components/AudioBar.tsx"
      provides: "Hymn name display in audio bar"
    - path: "app/components/MidiTrackPlayer.tsx"
      provides: "Hymn-named downloads and robust progress tracking"
    - path: "app/empaquetador/components/HymnDetailModal.tsx"
      provides: "Hymn-named downloads in empaquetador detail view"
  key_links:
    - from: "app/visualizador/page.tsx"
      to: "app/visualizador/components/AudioBar.tsx"
      via: "hymnName prop"
      pattern: "hymnName="
    - from: "app/empaquetador/components/HymnDetailModal.tsx"
      to: "app/components/MidiTrackPlayer.tsx"
      via: "hymnName prop"
      pattern: "hymnName="
---

<objective>
Three UX improvements for audio playback: (1) show hymn name in the Visualizador AudioBar, (2) use descriptive filenames for all audio/MIDI downloads, (3) fix MIDI slider progress bar not advancing during playback.

Purpose: Users currently cannot see which hymn is playing in the audio bar, downloaded files have generic names making them hard to identify, and the MIDI progress slider does not move during playback.
Output: Updated AudioBar, MidiTrackPlayer, and HymnDetailModal components.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/visualizador/components/AudioBar.tsx
@app/visualizador/page.tsx
@app/components/MidiTrackPlayer.tsx
@app/empaquetador/components/HymnDetailModal.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Show hymn name in AudioBar and add hymnName prop to MidiTrackPlayer for proper download filenames</name>
  <files>app/visualizador/components/AudioBar.tsx, app/visualizador/page.tsx, app/components/MidiTrackPlayer.tsx, app/empaquetador/components/HymnDetailModal.tsx</files>
  <action>
**AudioBar.tsx — show hymn name:**
1. Add `hymnName: string` to `AudioBarProps` interface (line 69).
2. Destructure `hymnName` in the forwardRef component (line 93).
3. In the "Track selector" section (line 382-417), change the `<span>` label from the static "Pista de audio" text to display the hymn name. Replace the block at lines 382-417:
   - Change the label `<span>` (line 383-385) from "Pista de audio" to show `hymnName` when available, falling back to "Pista de audio" when empty.
   - Use truncation: `<span className="text-xs text-muted-foreground leading-none truncate max-w-[200px]">{hymnName || 'Pista de audio'}</span>`

**page.tsx (Visualizador) — pass prop:**
4. At line 508-518 where `<AudioBar>` is rendered, add `hymnName={activeHymn?.hymnData.name ?? ''}` prop.

**MidiTrackPlayer.tsx — add hymnName prop for downloads:**
5. Add `hymnName?: string` to `MidiTrackPlayerProps` interface (line 8).
6. Destructure `hymnName` in the component function signature (line 98).
7. Line 297: Change `a.download = \`${name}.wav\`` to `a.download = hymnName ? \`${hymnName} - ${name}.wav\` : \`${name}.wav\``.
8. Line 359: Change `download={fileInfo.filename_download || 'midi.mid'}` to `download={hymnName ? \`${hymnName} - MIDI.mid\` : (fileInfo.filename_download || 'midi.mid')}`.

**HymnDetailModal.tsx — pass hymnName to MidiTrackPlayer and fix AudioTrackPlayer downloads:**
9. At the `AudioTrackPlayer` inline component (line 75), add `hymnName?: string` to its props destructuring: `{ field, fileInfo, hymnName }`.
10. Line 172: Change `download={fileInfo.filename_download || \`${field}.mp3\`}` to `download={hymnName ? \`${hymnName} - ${AUDIO_LABELS[field] ?? field}.mp3\` : (fileInfo.filename_download || \`${field}.mp3\`)}`.
11. At both MidiTrackPlayer usages (lines 554-560 and 638-644), add `hymnName={hymn.name}` prop.
12. At both AudioTrackPlayer usages (lines 562 and 646), add `hymnName={hymn.name}` prop.
  </action>
  <verify>
    <automated>cd /Volumes/Samsung_SSD_990_EVO_Plus_4TB_Media/Documents/Church/Projects/Alabanza/ibc-tools && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>AudioBar shows hymn name, all download filenames include hymn name, TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Fix MIDI slider progress bar not advancing during playback</name>
  <files>app/components/MidiTrackPlayer.tsx</files>
  <action>
The MIDI progress bar does not advance because the `tick()` function relies on `AudioContext.currentTime` for elapsed time calculation, which can behave unexpectedly when the AudioContext was suspended or has timing quirks. Additionally, the `tick` callback has an empty dependency array but captures `audioCtxRef` and `durationRef` — if `durationRef.current` is 0 when `tick` first fires, it returns immediately without scheduling another frame, breaking the loop permanently.

**Fix the tick function (line 214-221):**
1. Replace the AudioContext.currentTime-based timing with `performance.now()` which is always reliable:

```typescript
const tick = useCallback(() => {
  if (!durationRef.current || !isPlayingRef.current) return;
  const el = playOffsetRef.current + (performance.now() / 1000 - playStartRef.current);
  if (el >= durationRef.current) {
    // Let onended handler deal with cleanup
    return;
  }
  setProgress(Math.min((el / durationRef.current) * 100, 100));
  setCurrentTime(Math.min(el, durationRef.current));
  rafRef.current = requestAnimationFrame(tick);
}, []);
```

2. Update `startPlayback` (line 196) to use `performance.now()` instead of `c.currentTime`:
   - Change `playStartRef.current = c.currentTime;` to `playStartRef.current = performance.now() / 1000;`

3. Update the pause logic in `play` (line 232) to match:
   - Change `playOffsetRef.current += c.currentTime - playStartRef.current;` to `playOffsetRef.current += performance.now() / 1000 - playStartRef.current;`

4. Add `isPlayingRef.current` guard in `tick` (already included above) so the loop self-terminates if playback was stopped by another path.

This ensures the progress bar uses wall-clock time which is always monotonically increasing, regardless of AudioContext state.
  </action>
  <verify>
    <automated>cd /Volumes/Samsung_SSD_990_EVO_Plus_4TB_Media/Documents/Church/Projects/Alabanza/ibc-tools && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>MIDI slider bar advances smoothly during playback. Progress calculation uses performance.now() instead of AudioContext.currentTime. TypeScript compiles without errors.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — no type errors
2. `npm run lint` — no lint errors
3. Manual: Open Visualizador, add a hymn to playlist, verify hymn name appears in audio bar
4. Manual: Play MIDI in MidiTrackPlayer, verify slider advances
5. Manual: Download a voice WAV — filename should be "HymnName - Soprano.wav"
6. Manual: Download MIDI file — filename should be "HymnName - MIDI.mid"
7. Manual: Open HymnDetailModal in empaquetador, download audio — filename includes hymn name
</verification>

<success_criteria>
- AudioBar displays the currently playing hymn's name
- All audio/MIDI downloads use descriptive filenames with hymn name
- MIDI slider progress bar advances during playback
- No TypeScript or lint errors
</success_criteria>

<output>
After completion, create `.planning/quick/260401-bkw-show-track-name-in-audiobar-proper-downl/260401-bkw-SUMMARY.md`
</output>
