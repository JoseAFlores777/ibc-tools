# Phase 7: MusicXML Score Viewer with Verovio and SpessaSynth - Research

**Researched:** 2026-04-01
**Domain:** Music notation rendering (WASM), MIDI synthesis (Web Audio), score-audio synchronization
**Confidence:** HIGH

## Summary

This phase integrates two specialized libraries -- Verovio (music notation engraving via WASM) and SpessaSynth (SoundFont-based MIDI synthesis via AudioWorklet) -- to create an interactive score viewer with synchronized cursor playback. Verovio renders MusicXML to SVG and provides a timing API (`getElementsAtTime`, `getTimeForElement`, `renderToTimemap`) that maps MIDI time to SVG note elements. SpessaSynth replaces the existing Tone.js-based MidiTrackPlayer with a proper SoundFont synthesizer running in an AudioWorklet thread, providing higher-fidelity playback.

The main technical challenges are: (1) configuring Next.js webpack for WASM (`asyncWebAssembly`) and AudioWorklet files, (2) synchronizing SpessaSynth's sequencer time with Verovio's note highlighting via a polling loop, and (3) caching the SoundFont file (~30MB) aggressively on the client side. The existing codebase already has patterns for dynamic imports without SSR, server-side asset proxying, and tab-based UI in HymnDetailView, making integration straightforward.

**Primary recommendation:** Use `verovio` 6.1.0 for MusicXML-to-SVG rendering and `spessasynth_lib` 4.2.7 for MIDI playback. Remove `tone` and `@tonejs/midi` entirely. Synchronize cursor via a 50ms `requestAnimationFrame` loop that reads `sequencer.currentHighResolutionTime` and calls `toolkit.getElementsAtTime()`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** MusicXML files already exist in Directus under `hymn -> materials -> musicxml`. No schema changes.
- **D-02:** Viewer only appears when hymn has MusicXML (conditional, no fallback).
- **D-03:** MusicXML served via server proxy (`/api/hymns/score/[fileId]`), consistent with audio proxy pattern.
- **D-04:** `ScoreViewer` is a reusable `'use client'` component with dynamic import (no SSR).
- **D-05:** Integrates in HymnExplorer as "Partituras" tab, conditional on MusicXML existence.
- **D-06:** SpessaSynth replaces MidiTrackPlayer completely. All MIDI playback migrates.
- **D-07:** Cursor syncs with MIDI playback note-by-note in real time.
- **D-08:** SoundFont stored in Directus, served via server proxy.
- **D-09:** Full SATB score as default view. No part selector.
- **D-10:** Auto-scale to container width + manual zoom controls.
- **D-11:** Auto-scroll follows cursor during playback.

### Claude's Discretion
- Visual design of Partituras tab (spacing, borders, colors)
- Playback controls layout and style (play/pause, seek, tempo)
- Loading state handling (WASM load, SoundFont download)
- Fallback if SpessaSynth fails (visual-only cursor, no audio)
- Next.js webpack configuration for WASM
- Verovio initialization API (version-dependent)
- SoundFont client-side caching strategy (~30MB)

### Deferred Ideas (OUT OF SCOPE)
- Part selector (solo Soprano, Tenor, etc.)
- Score transposition
- Score download as PDF
- Practice mode with metronome
- Score annotations/marks
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| verovio | 6.1.0 | MusicXML/MEI to SVG rendering via WASM | Only production-grade music engraving library for the web; used by RISM, MuseScore web |
| spessasynth_lib | 4.2.7 | SoundFont MIDI synthesis via AudioWorklet | Full SF2/SF3/DLS support, AudioWorklet threading, TypeScript-first, actively maintained |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| spessasynth_core | 4.2.5 (peer dep) | Core types and MIDI parser | Auto-installed with spessasynth_lib; provides BasicMIDI, SequencerEvent types |

### Packages to Remove
| Package | Reason |
|---------|--------|
| tone | Replaced by spessasynth_lib for MIDI synthesis |
| @tonejs/midi | Replaced by spessasynth_core's MIDI parser |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| verovio | OpenSheetMusicDisplay (OSMD) | OSMD uses VexFlow, less mature MIDI timing API, no built-in timemap |
| spessasynth_lib | Tone.js + @tonejs/midi | Already in use but requires sample loading (Salamander), no SoundFont support, heavier CPU for offline rendering |
| spessasynth_lib | WebAudioFont | Less actively maintained, no sequencer, no AudioWorklet |

**Installation:**
```bash
npm install verovio@6.1.0 spessasynth_lib@4.2.7
npm uninstall tone @tonejs/midi
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  components/
    ScoreViewer.tsx           # 'use client' - main score viewer component
    ScoreViewerControls.tsx   # Play/pause, seek, tempo, zoom controls
    MidiPlayer.tsx            # SpessaSynth wrapper (replaces MidiTrackPlayer)
  hooks/
    useVerovio.ts             # WASM init, load data, render SVG, timemap
    useSpessaSynth.ts         # Synth init, SoundFont loading, sequencer lifecycle
    useScoreCursor.ts         # Sync loop: sequencer time -> note highlighting
  api/hymns/
    score/[fileId]/route.ts   # MusicXML proxy (replicates audio proxy pattern)
    soundfont/route.ts        # SoundFont proxy (cached aggressively)
public/
    spessasynth_processor.min.js  # AudioWorklet processor (copied from node_modules)
```

### Pattern 1: Verovio WASM Initialization
**What:** Load the WASM module and create a VerovioToolkit instance
**When to use:** On component mount (once per session)
**Example:**
```typescript
// Source: https://book.verovio.org/installing-or-building-from-sources/javascript-and-webassembly.html
import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';

async function initVerovio(): Promise<VerovioToolkit> {
  const VerovioModule = await createVerovioModule();
  const tk = new VerovioToolkit(VerovioModule);
  tk.setOptions({
    scale: 40,
    adjustPageWidth: true,
    svgViewBox: true,       // Enables responsive scaling
    pageWidth: 2100,        // Will be overridden per container width
    footer: 'none',
    header: 'none',
  });
  return tk;
}
```

### Pattern 2: SpessaSynth Sequencer Setup
**What:** Initialize WorkletSynthesizer, load SoundFont, create Sequencer
**When to use:** When user first interacts with score playback
**Example:**
```typescript
// Source: spessasynth_lib README + TypeScript definitions
import { WorkletSynthesizer, Sequencer } from 'spessasynth_lib';

async function initSynth(soundFontBuffer: ArrayBuffer) {
  const ctx = new AudioContext();
  // Worklet processor must be served from public/
  await ctx.audioWorklet.addModule('/spessasynth_processor.min.js');
  const synth = new WorkletSynthesizer(ctx);
  await synth.soundBankManager.addSoundBank(soundFontBuffer, 'main');
  await synth.isReady;
  return { ctx, synth };
}
```

### Pattern 3: Score-Audio Cursor Synchronization
**What:** RAF loop reads sequencer time, maps to SVG note IDs, adds/removes CSS classes
**When to use:** During active playback
**Example:**
```typescript
// Source: https://book.verovio.org/interactive-notation/playing-midi.html
function syncLoop(tk: VerovioToolkit, seq: Sequencer) {
  const timeMs = seq.currentHighResolutionTime * 1000;
  // Clear previous highlights
  document.querySelectorAll('g.note.playing').forEach(el =>
    el.classList.remove('playing')
  );
  // Get elements at current time
  const result = tk.getElementsAtTime(timeMs);
  if (result.page > 0) {
    for (const noteId of result.notes) {
      document.getElementById(noteId)?.classList.add('playing');
    }
  }
  if (!seq.paused) {
    requestAnimationFrame(() => syncLoop(tk, seq));
  }
}
```

### Pattern 4: Verovio MIDI for SpessaSynth
**What:** Verovio generates MIDI from the score; SpessaSynth plays it. This keeps score timing in sync.
**When to use:** Always -- do NOT use the original MIDI file from Directus for score playback. Use Verovio-generated MIDI so timemap matches.
**Example:**
```typescript
// Verovio renders MIDI as base64
const base64midi = tk.renderToMIDI();
const midiBytes = Uint8Array.from(atob(base64midi), c => c.charCodeAt(0));
const seq = new Sequencer(synth);
seq.loadNewSongList([midiBytes.buffer]);
seq.play();
```

### Pattern 5: Next.js Webpack Config for WASM + AudioWorklet
**What:** Enable asyncWebAssembly experiment and copy worklet processor
**When to use:** next.config.mjs modification
**Example:**
```javascript
// next.config.mjs
const nextConfig = {
  // ... existing config ...
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };
    }
    return config;
  },
};
```

### Anti-Patterns to Avoid
- **Using original MIDI file for score playback:** The original MIDI from Directus may have different timing than Verovio's rendering. Always use `tk.renderToMIDI()` for score-synced playback so `getElementsAtTime()` returns correct note IDs.
- **Loading SoundFont on every page visit:** SoundFont is ~30MB. Cache it in IndexedDB or Cache API after first download. Check cache before fetching.
- **SSR of Verovio or SpessaSynth:** Both require browser APIs (WASM, Web Audio, AudioWorklet). Always use `dynamic(() => import(...), { ssr: false })`.
- **Polling sequencer time with setInterval:** Use `requestAnimationFrame` for smooth cursor movement. The sequencer's `currentHighResolutionTime` property is specifically designed for visualization (smoothed, not affected by AudioContext stutter).
- **Re-rendering entire SVG on page change:** Use `tk.renderToSVG(pageNumber)` per page and swap only the changed page's innerHTML.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MusicXML to SVG | Custom parser/renderer | `verovio` | 20+ years of music engraving rules, hundreds of edge cases in notation layout |
| MIDI synthesis | Tone.js + sample loading | `spessasynth_lib` | SoundFont standard handles thousands of instruments, AudioWorklet threading |
| Score timing map | Manual XML parsing for timing | `tk.renderToTimemap()`, `tk.getElementsAtTime()` | Verovio already computes note-to-time mapping internally |
| WAV encoding from AudioBuffer | Custom ArrayBuffer writing | `audioBufferToWav` from spessasynth_lib | Already exported by the library |
| AudioWorklet processor | Custom DSP worklet | `spessasynth_processor.min.js` | Pre-built, optimized, handles all SF2 synthesis edge cases |

**Key insight:** Music notation rendering and SoundFont synthesis are each decades-old standards with enormous specification surface area. Both Verovio and SpessaSynth implement these standards comprehensively. Any hand-rolled alternative would be orders of magnitude less capable.

## Common Pitfalls

### Pitfall 1: WASM Loading Fails Silently in Next.js Production Build
**What goes wrong:** Verovio WASM file not found at runtime in production standalone output
**Why it happens:** Next.js standalone output doesn't include all node_modules files; WASM files may not be copied
**How to avoid:** Test with `npm run build && npm start` early. May need to configure webpack to handle `.wasm` files or copy them to public/. The `asyncWebAssembly: true` experiment should handle this but verify.
**Warning signs:** Component renders blank, console shows 404 for .wasm file

### Pitfall 2: AudioWorklet Processor Not Found
**What goes wrong:** `audioWorklet.addModule()` throws 404 or MIME type error
**Why it happens:** The worklet file `spessasynth_processor.min.js` must be served as a static file from a URL accessible to the browser. It's at `node_modules/spessasynth_lib/dist/spessasynth_processor.min.js`.
**How to avoid:** Copy it to `public/spessasynth_processor.min.js` during build or use a postinstall script. Ensure Content-Type is `application/javascript`.
**Warning signs:** AudioContext creation succeeds but synthesis produces no sound

### Pitfall 3: SoundFont Download Blocks First Interaction
**What goes wrong:** User clicks play, waits 10+ seconds for 30MB SoundFont download
**Why it happens:** SoundFont is large and loaded on-demand
**How to avoid:** Start preloading SoundFont when the Partituras tab becomes visible (not on click). Cache in IndexedDB. Show a progress indicator during download.
**Warning signs:** Long silence after pressing play

### Pitfall 4: Verovio renderToMIDI Must Be Called Before getElementsAtTime
**What goes wrong:** `getElementsAtTime()` returns empty results
**Why it happens:** Verovio builds the internal timing map during `renderToMIDI()`. Without calling it first, timing data doesn't exist.
**How to avoid:** Always call `renderToMIDI()` after `loadData()` and before any time-based queries.
**Warning signs:** Cursor never highlights any notes during playback

### Pitfall 5: CSP Blocks WASM or Worklet Execution
**What goes wrong:** WASM or AudioWorklet fails in production due to Content Security Policy
**Why it happens:** The existing CSP in `next.config.mjs` has `script-src 'self' 'unsafe-inline' 'unsafe-eval'`. WASM requires `'wasm-unsafe-eval'` (or the existing `'unsafe-eval'` covers it). AudioWorklet scripts loaded from same origin should be fine with `'self'`.
**How to avoid:** Verify CSP allows WASM execution. The current `'unsafe-eval'` in CSP should permit WASM. Test in production mode.
**Warning signs:** Console error "Refused to compile or instantiate WebAssembly module"

### Pitfall 6: Score Page Changes During Playback
**What goes wrong:** Music continues but cursor stops highlighting because the visible SVG page changed
**Why it happens:** Verovio renders one page at a time. When playback advances past the current page, the visible SVG no longer contains the active notes.
**How to avoid:** Check `result.page` from `getElementsAtTime()`. If it differs from the currently displayed page, render the new page's SVG and swap the DOM content. This implements auto-scroll (D-11).
**Warning signs:** Cursor stops moving partway through the piece

### Pitfall 7: MidiTrackPlayer Removal Breaks HymnDetailModal
**What goes wrong:** Build errors or missing MIDI playback in HymnDetailModal
**Why it happens:** `HymnDetailModal.tsx` imports `MidiTrackPlayer` at lines 22, 562, 693. Removing MidiTrackPlayer without replacing it breaks the component.
**How to avoid:** Create a new `MidiPlayer` component with the same props interface that uses SpessaSynth internally. Update imports in `HymnDetailModal.tsx`.
**Warning signs:** Build errors immediately after deleting MidiTrackPlayer.tsx

## Code Examples

### Verovio Responsive Rendering
```typescript
// Render score SVG sized to container width
function renderScore(tk: VerovioToolkit, containerWidth: number): string[] {
  // Verovio uses internal units; scale appropriately
  const zoom = 40; // percent scale
  const pageWidth = (containerWidth * 100) / zoom;
  
  tk.setOptions({
    pageWidth: Math.round(pageWidth),
    scale: zoom,
    adjustPageWidth: true,
    svgViewBox: true,
  });
  tk.redoLayout();
  
  const pageCount = tk.getPageCount();
  const pages: string[] = [];
  for (let i = 1; i <= pageCount; i++) {
    pages.push(tk.renderToSVG(i));
  }
  return pages;
}
```

### SpessaSynth Sequencer Event Handling
```typescript
// Source: spessasynth_lib TypeScript definitions (index.d.ts)
// Events available on sequencer.eventHandler:
// - "songChange": MIDIData (new song loaded)
// - "timeChange": number (seek occurred)
// - "songEnded": null (playback finished)
// - "textEvent": { event, lyricsIndex }
// - "metaEvent": { event, trackNumber }

seq.eventHandler.addEvent("songEnded", "score-viewer", () => {
  // Reset cursor, update UI
});

seq.eventHandler.addEvent("timeChange", "score-viewer", (newTime) => {
  // Seek occurred -- update cursor position immediately
});
```

### SoundFont Caching with IndexedDB
```typescript
const SF_CACHE_KEY = 'ibc-soundfont-v1';
const SF_DB_NAME = 'ibc-audio-cache';

async function getCachedSoundFont(): Promise<ArrayBuffer | null> {
  return new Promise((resolve) => {
    const req = indexedDB.open(SF_DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('files');
    req.onsuccess = () => {
      const tx = req.result.transaction('files', 'readonly');
      const get = tx.objectStore('files').get(SF_CACHE_KEY);
      get.onsuccess = () => resolve(get.result ?? null);
      get.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
}

async function cacheSoundFont(buffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.open(SF_DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('files');
    req.onsuccess = () => {
      const tx = req.result.transaction('files', 'readwrite');
      tx.objectStore('files').put(buffer, SF_CACHE_KEY);
      tx.oncomplete = () => resolve();
    };
  });
}
```

### Server Proxy for MusicXML (Replicating Audio Pattern)
```typescript
// app/api/hymns/score/[fileId]/route.ts
import { fetchAsset, isValidUuid } from '@/app/lib/directus/services/hymns';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  if (!isValidUuid(fileId)) {
    return new Response('ID invalido', { status: 400 });
  }
  const res = await fetchAsset(fileId);
  if (!res.ok) {
    return new Response('Partitura no disponible', { status: res.status });
  }
  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/xml',
      'Content-Length': res.headers.get('Content-Length') || '',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tone.js + Salamander samples for MIDI | SpessaSynth with SoundFont (SF2/SF3) | 2024-2025 | Better fidelity, smaller payload, AudioWorklet threading |
| verovio 3.x (older API) | verovio 6.1.0 (C++20, MEI 5.1) | 2025-2026 | ESM module support, improved WASM build, renderToTimemap |
| MIDIjs for browser MIDI playback | SpessaSynth sequencer | 2024-2025 | No external CDN dependency, full synthesis control |

**Deprecated/outdated:**
- Verovio `verovio/wasm-hum` module: Only needed for Humdrum format support. We use MusicXML only.
- Tone.js for MIDI: Works but requires large sample downloads and offline rendering per track. SpessaSynth handles this natively with SoundFont.

## Open Questions

1. **Verovio WASM in Next.js 16 standalone output**
   - What we know: `asyncWebAssembly: true` experiment enables WASM in webpack. Works in dev.
   - What's unclear: Whether standalone output correctly includes the .wasm binary in production Docker build.
   - Recommendation: Test with `npm run build && npm start` in first plan. May need to copy .wasm to public/ as fallback.

2. **SoundFont file ID in Directus**
   - What we know: SoundFont stored as asset in Directus per D-08.
   - What's unclear: How the SoundFont file ID is configured/discovered. Is it a hardcoded UUID, an environment variable, or fetched from a settings collection?
   - Recommendation: Use an environment variable `SOUNDFONT_FILE_ID` for the Directus asset UUID. Simple and consistent with existing patterns.

3. **Verovio-generated MIDI vs original MIDI timing**
   - What we know: Verovio can generate MIDI from MusicXML via `renderToMIDI()`. SpessaSynth can play any MIDI buffer.
   - What's unclear: Whether Verovio-generated MIDI sounds identical to the original MIDI files stored in Directus (may differ in velocity, articulation).
   - Recommendation: Use Verovio-generated MIDI for score-synced playback (guarantees timing alignment). Keep original MIDI for standalone playback in MidiPlayer (non-score contexts).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Y | 20.x | -- |
| npm | Package management | Y | Bundled | -- |
| Web Audio API | SpessaSynth | Y (browser) | -- | -- |
| AudioWorklet | SpessaSynth threading | Y (modern browsers) | -- | WorkerSynthesizer fallback |
| WASM | Verovio rendering | Y (modern browsers) | -- | -- |

**Missing dependencies with no fallback:** None -- all dependencies are browser APIs available in modern browsers.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-03 | MusicXML proxy returns XML with correct headers | unit | `npx vitest run tests/api/score-proxy.test.ts -x` | No - Wave 0 |
| D-04 | ScoreViewer renders SVG from MusicXML | manual-only | Manual: load hymn with MusicXML, verify SVG appears | -- |
| D-06 | SpessaSynth plays MIDI with SoundFont | manual-only | Manual: play MIDI, verify audio output | -- |
| D-07 | Cursor highlights notes during playback | manual-only | Manual: play score, verify cursor sync | -- |
| D-10 | Score auto-scales to container width | manual-only | Manual: resize browser, verify responsive | -- |
| D-11 | Auto-scroll follows cursor | manual-only | Manual: play multi-page score, verify scroll | -- |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/api/score-proxy.test.ts` -- covers MusicXML proxy route
- [ ] `tests/api/soundfont-proxy.test.ts` -- covers SoundFont proxy route

*(Most phase requirements involve interactive browser behavior that requires manual verification)*

## Sources

### Primary (HIGH confidence)
- [verovio npm](https://www.npmjs.com/package/verovio) - Version 6.1.0 verified via `npm view`
- [spessasynth_lib npm](https://github.com/spessasus/spessasynth_lib) - Version 4.2.7 verified via `npm view`
- [Verovio Reference Book](https://book.verovio.org/) - Toolkit methods, layout options, MIDI playback
- [Verovio Playing MIDI](https://book.verovio.org/interactive-notation/playing-midi.html) - getElementsAtTime, note highlighting pattern
- [Verovio WASM Setup](https://book.verovio.org/installing-or-building-from-sources/javascript-and-webassembly.html) - ESM initialization
- spessasynth_lib TypeScript definitions (`dist/index.d.ts`) - Sequencer API, WorkletSynthesizer, event system

### Secondary (MEDIUM confidence)
- [SpessaSynth GitHub](https://github.com/spessasus/SpessaSynth) - Sequencer UI source showing API usage pattern (currentTime, duration, play/pause, eventHandler)
- [Verovio Toolkit Methods](https://book.verovio.org/toolkit-reference/toolkit-methods.html) - renderToTimemap, getTimesForElement
- [Next.js WASM Discussion](https://github.com/vercel/next.js/discussions/35637) - asyncWebAssembly webpack config

### Tertiary (LOW confidence)
- [Next.js AudioWorklet Issues](https://github.com/vercel/next.js/issues/24907) - AudioWorklet support in webpack; may have production-specific issues

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Both libraries verified on npm registry with current versions and TypeScript definitions inspected
- Architecture: HIGH - Verovio's timing API and SpessaSynth's sequencer API are well-documented; synchronization pattern is established (used by Verovio's own tutorial)
- Pitfalls: MEDIUM - WASM and AudioWorklet in Next.js production mode need validation; based on community reports, not firsthand testing

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (30 days -- both libraries have stable APIs)
