# Phase 6: Visualizador de Himnos con Panel tipo ProPresenter - Research

**Researched:** 2026-03-31
**Domain:** In-browser live presentation tool (cross-window communication, fullscreen projection, drag-and-drop, audio playback)
**Confidence:** HIGH

## Summary

This phase builds a ProPresenter-style live hymn presentation tool as a new client route. The core architecture involves two browser windows: a control panel (3-column layout with playlist, slide grid, and live preview) and a projection window (fullscreen, slide-only). Communication between them uses the BroadcastChannel API. All required browser APIs (BroadcastChannel, Fullscreen API, window.open) have excellent modern browser support (92%+ globally).

The project already has most building blocks: `useHymnSearch` for playlist search, `AudioTrackPlayer` pattern for audio playback, `parseHymnHtml` for lyrics parsing, and `buildSlideGroups` logic for verse/chorus intercalation. Framer Motion (already installed) handles crossfade transitions. The only new dependency needed is `@dnd-kit` for playlist drag-and-drop reordering.

**Primary recommendation:** Build as two Next.js routes (`/visualizador` for control panel, `/visualizador/proyeccion` for projection window), communicating via BroadcastChannel. Port `buildSlideGroups` logic to a client-safe utility. Use `@dnd-kit/sortable` for playlist reordering and Framer Motion's `AnimatePresence` for slide crossfade. Font auto-sizing via a simple binary search algorithm measuring with a hidden canvas.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Layout is a 3-column design: Left column = hymn playlist with inline search. Center column = slide thumbnails grid for the active hymn. Right column = live preview showing exactly what the projection window displays.
- **D-02:** Bottom bar spans full width with audio playback controls: play/pause, track selector, seek bar, time display.
- **D-03:** Full-height layout (`h-screen flex`) -- no page scrolling. Individual columns scroll independently.
- **D-04:** Left column shows an ordered playlist of hymns. Operator adds hymns via an inline search bar at the top of the playlist column. Reuses existing `useHymnSearch` hook for searching.
- **D-05:** Operator can reorder hymns in the playlist via drag-and-drop. Click a hymn to load its slides in the center column.
- **D-06:** Slide navigation: click any thumbnail in the grid to project it. Arrow keys (left/right) advance between slides. Space bar = next slide.
- **D-07:** Auto-advance: pressing right arrow on the last slide of a hymn automatically loads the first slide of the next hymn in the playlist.
- **D-08:** "Proyectar" button opens a new browser window via `window.open()` + Fullscreen API. The projection window shows ONLY the current slide -- no browser chrome, no controls. Operator controls remain in the main tab.
- **D-09:** Communication between main tab and projection window via `BroadcastChannel` API or `window.postMessage()`.
- **D-10:** Projection controls: "Negro" (black screen -- solid black, hides all content), "Limpiar" (clear text -- shows only background, no lyrics), "Logo" (shows church logo centered on background).
- **D-11:** Fade transition (300-500ms crossfade) between slides for professional appearance.
- **D-12:** Default theme: clean dark background (`#1a1a2e` or similar) with white text. Operator can upload a custom background image or choose from built-in presets (solid colors, gradients).
- **D-13:** Slide splitting follows existing pattern: one verse per slide with intercalated chorus. Title slide first showing hymn name + bible reference. Uses `parseHymnHtml()` output with the same verse/chorus segmentation as `generate-hymn-propresenter.ts`.
- **D-14:** Font auto-sizes to fill the projection screen based on content length. Operator can also manually adjust size up/down with +/- buttons or keyboard shortcuts (Ctrl+Plus/Ctrl+Minus).
- **D-15:** Verse label (ESTROFA I, CORO, etc.) displayed subtly above the lyrics text on each slide.
- **D-16:** Audio playback is manual -- operator clicks play when ready. Audio and slides are independent.
- **D-17:** Single track at a time. Switching tracks stops the current one. No multi-track mixing.
- **D-18:** Default track selection: `track_only` (pista completa) if available. Operator can switch to other available tracks.
- **D-19:** Audio streams via existing `/api/hymns/audio/[fileId]` proxy. Reuses `AudioTrackPlayer` component pattern.
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

### Deferred Ideas (OUT OF SCOPE)
- Multi-track audio mixer with individual volume sliders per voice part (v2 feature)
- Auto-advance slides based on audio timestamps / beat detection
- Remote control from mobile device (phone as slide clicker)
- Shared playlists saved to Directus for reuse across sessions
- Song arrangement editor (custom verse order per performance)
- Countdown timer between songs
- Scripture/announcement slides (non-hymn content)
</user_constraints>

## Project Constraints (from CLAUDE.md)

- **Tech stack**: Next.js 16 App Router, React 19, TypeScript, Tailwind, shadcn/ui
- **UI language**: Spanish for all user-facing text
- **Path aliases**: `@/*` for root, `@/lib/*` for `app/lib/*`
- **Component pattern**: `'use client'` directive for interactive components; server components by default
- **Full-height layouts**: established pattern with `h-screen flex flex-col overflow-hidden` (empaquetador)
- **State management**: `useReducer` for complex state (wizard pattern)
- **shadcn imports**: from `@/lib/shadcn/ui`
- **Tailwind**: all styling via Tailwind utilities
- **Error handling**: try-catch with `console.error()` and descriptive context
- **Module exports**: default exports for React components, named exports for utilities
- **No global state**: local component state via useState/useReducer; no Redux/Zustand

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.1 | App Router routes for control panel + projection | Project framework |
| React | 19.2.3 | UI components | Project framework |
| Framer Motion | 11.11.1 | Crossfade transitions between slides (AnimatePresence) | Already installed; D-11 requires fade transitions |
| shadcn/ui | (49 components) | ScrollArea, Button, Slider, Tooltip, Separator, DropdownMenu | Already installed; project standard |
| Lucide React | 0.429.0 | Icons | Already installed |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/core | 6.3.1 | Drag-and-drop foundation | Playlist reordering (D-05) |
| @dnd-kit/sortable | 10.0.0 | Sortable list preset | Vertical list reorder in playlist column |
| @dnd-kit/utilities | 3.2.2 | CSS transform helper | Smooth drag animations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit | @hello-pangea/dnd | hello-pangea is simpler API but heavier bundle, less modular. dnd-kit is more performant and better maintained for React 19 |
| @dnd-kit | HTML5 native DnD | Native API is awkward for vertical list reorder; no smooth animations; poor touch support |
| BroadcastChannel | window.postMessage | postMessage requires window reference management; BroadcastChannel is simpler (fire-and-forget to any same-origin context). Both work but BroadcastChannel is cleaner |
| Framer Motion | CSS transitions | Framer Motion is already installed and AnimatePresence handles enter/exit crossfade natively. CSS alone cannot easily crossfade two different content blocks |
| Binary search font sizing | CSS container queries (cqi) | cqi units scale linearly with container width but cannot guarantee text fits vertically. Binary search with canvas measureText gives precise fit for both width and height |

**Installation:**
```bash
npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  visualizador/
    page.tsx                    # Control panel (3-column layout, 'use client')
    proyeccion/
      page.tsx                  # Projection window (minimal, fullscreen, 'use client')
    components/
      PlaylistColumn.tsx        # Left: search + sortable playlist
      SlideGridColumn.tsx       # Center: slide thumbnail grid
      LivePreviewColumn.tsx     # Right: live preview mirror
      AudioBar.tsx              # Bottom: audio playback controls
      ProjectionControls.tsx    # Negro/Limpiar/Logo buttons + Proyectar
      SlideRenderer.tsx         # Shared: renders a single slide (used in preview + projection)
      SlideThumbnail.tsx        # Mini slide preview for grid
      PlaylistItem.tsx          # Draggable playlist entry
    hooks/
      useVisualizador.ts        # Main reducer: playlist, active hymn, active slide, projection state
      useBroadcastChannel.ts    # BroadcastChannel abstraction for cross-window messaging
      useSlideBuilder.ts        # Builds slides from hymn data (client-side buildSlideGroups port)
      useKeyboardShortcuts.ts   # Global keyboard handler for slide nav, audio, projection controls
      useAutoFontSize.ts        # Font auto-sizing algorithm
    lib/
      build-slides-client.ts    # Client-safe port of buildSlideGroups (no node-html-parser)
      projection-channel.ts     # BroadcastChannel message types and channel name constant
      theme-presets.ts          # Background presets (solid colors, gradients)
```

### Pattern 1: BroadcastChannel for Cross-Window Communication
**What:** Use BroadcastChannel API to send slide data from control panel to projection window. Both windows listen on the same named channel. No need to hold a window reference.
**When to use:** Whenever the control panel needs to update what the projection window displays.
**Example:**
```typescript
// projection-channel.ts
export const CHANNEL_NAME = 'ibc-visualizador';

export type ProjectionMessage =
  | { type: 'SHOW_SLIDE'; slide: SlideData; theme: ThemeConfig }
  | { type: 'BLACK_SCREEN' }
  | { type: 'CLEAR_TEXT'; theme: ThemeConfig }
  | { type: 'SHOW_LOGO'; theme: ThemeConfig }
  | { type: 'PING' }      // Control panel checking if projection is alive
  | { type: 'PONG' };     // Projection window responding

// In control panel:
const channel = new BroadcastChannel(CHANNEL_NAME);
channel.postMessage({ type: 'SHOW_SLIDE', slide, theme });

// In projection window:
const channel = new BroadcastChannel(CHANNEL_NAME);
channel.onmessage = (event: MessageEvent<ProjectionMessage>) => {
  switch (event.data.type) {
    case 'SHOW_SLIDE': setCurrentSlide(event.data.slide); break;
    case 'BLACK_SCREEN': setMode('black'); break;
    // ...
  }
};
```

### Pattern 2: Client-Side Slide Builder (Port of buildSlideGroups)
**What:** Port the `buildSlideGroups` function from `generate-hymn-propresenter.ts` to work client-side. The existing function takes `ParsedVerse[]` but `parseHymnHtml` uses `node-html-parser` (server-only). Solution: create an API endpoint that returns parsed hymn data including pre-parsed verses, OR use DOMParser in the client.
**When to use:** When loading a hymn into the slide grid.
**Example:**
```typescript
// build-slides-client.ts
// Client-safe HTML parser using browser DOMParser
export function parseHymnHtmlClient(html: string): ParsedVerse[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const paragraphs = doc.querySelectorAll('p');
  // Same logic as parseHymnHtml but using browser DOM instead of node-html-parser
  // ...
}

// buildSlideGroups can be extracted from generate-hymn-propresenter.ts
// and shared (it already only depends on ParsedVerse[], no server APIs)
```

### Pattern 3: Reducer for Complex Visualizer State
**What:** Single useReducer managing all visualizer state: playlist, active hymn index, active slide index, projection mode, audio state, theme config.
**When to use:** Project pattern -- empaquetador uses useWizardReducer similarly.
**Example:**
```typescript
interface VisualizadorState {
  playlist: PlaylistHymn[];        // Ordered hymns with pre-built slides
  activeHymnIndex: number;         // Which hymn in playlist is selected
  activeSlideIndex: number;        // Which slide is being projected
  projectionMode: 'slide' | 'black' | 'clear' | 'logo';
  projectionOpen: boolean;         // Is projection window open?
  theme: ThemeConfig;              // Background, font size offset
  audio: {
    hymnId: string | null;         // Which hymn's audio is loaded
    trackField: string | null;     // 'track_only', 'soprano_voice', etc.
    playing: boolean;
  };
}

type VisualizadorAction =
  | { type: 'ADD_HYMN'; hymn: HymnForPdf }
  | { type: 'REMOVE_HYMN'; index: number }
  | { type: 'REORDER_PLAYLIST'; from: number; to: number }
  | { type: 'SET_ACTIVE_HYMN'; index: number }
  | { type: 'SET_ACTIVE_SLIDE'; index: number }
  | { type: 'NEXT_SLIDE' }
  | { type: 'PREV_SLIDE' }
  | { type: 'SET_PROJECTION_MODE'; mode: 'slide' | 'black' | 'clear' | 'logo' }
  | { type: 'SET_PROJECTION_OPEN'; open: boolean }
  | { type: 'SET_THEME'; theme: Partial<ThemeConfig> }
  | { type: 'SET_AUDIO_TRACK'; hymnId: string; trackField: string }
  | { type: 'FONT_SIZE_UP' }
  | { type: 'FONT_SIZE_DOWN' };
```

### Pattern 4: Font Auto-Sizing via Binary Search
**What:** Calculate optimal font size for slide content using a hidden canvas to measure text. Binary search between min (16px) and max (120px) to find the largest font that fits the projection area.
**When to use:** Every time a slide changes or font size offset changes.
**Example:**
```typescript
function calculateFontSize(
  text: string,
  containerWidth: number,
  containerHeight: number,
  fontFamily: string,
  sizeOffset: number = 0,
): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const lines = text.split('\n');
  const padding = 80; // px padding on each side

  let lo = 16, hi = 120;
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.font = `${mid}px ${fontFamily}`;
    const lineHeight = mid * 1.4;
    const totalHeight = lines.length * lineHeight;
    const maxLineWidth = Math.max(...lines.map(l => ctx.measureText(l).width));

    if (totalHeight <= containerHeight - padding * 2 &&
        maxLineWidth <= containerWidth - padding * 2) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return Math.max(16, lo + sizeOffset);
}
```

### Pattern 5: Projection Window Lifecycle
**What:** Open projection window via `window.open()`, then request fullscreen on the document element. Handle window close detection and reconnection.
**When to use:** When operator clicks "Proyectar".
**Example:**
```typescript
function openProjection() {
  const projWindow = window.open(
    '/visualizador/proyeccion',
    'ibc-projection',
    'popup=true'
  );

  // The projection page itself requests fullscreen after load:
  // document.documentElement.requestFullscreen();

  // Detect if projection was closed
  const checkInterval = setInterval(() => {
    if (projWindow?.closed) {
      clearInterval(checkInterval);
      dispatch({ type: 'SET_PROJECTION_OPEN', open: false });
    }
  }, 1000);
}
```

### Anti-Patterns to Avoid
- **Holding window reference for communication:** Do NOT pass slide data via `projWindow.postMessage()` requiring the control panel to hold a `WindowProxy` reference. Use BroadcastChannel instead -- it survives page reloads and is cleaner.
- **Server-side slide building:** Do NOT build slides on the server and fetch via API for every hymn change. Parse HTML and build slides client-side for instant response during live worship.
- **CSS-only font scaling with vw/cqi:** Do NOT use viewport or container query units for projection text sizing. They scale linearly and cannot account for variable line count per slide. Use the binary search algorithm.
- **Storing full slide content in reducer:** Do NOT store rendered HTML in the reducer. Store only indices (activeHymnIndex, activeSlideIndex) and derive slide content from the playlist's pre-built slides array.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop list reorder | Custom mouse event handlers with state tracking | @dnd-kit/sortable | Touch support, keyboard accessibility, smooth animations, collision detection -- all edge cases handled |
| Cross-window communication | Custom window.postMessage protocol with ref tracking | BroadcastChannel API | Same-origin broadcast without needing to hold window references; handles reconnection naturally |
| Crossfade transitions | Manual CSS opacity toggling with setTimeout | Framer Motion AnimatePresence with mode="crossfade" | Handles enter/exit simultaneously, respects reduced motion, already installed |
| Fullscreen toggle | Manual fullscreen prefix detection | document.documentElement.requestFullscreen() | All modern browsers support unprefixed API since 2020+ |

**Key insight:** This phase's complexity is in orchestrating many simple pieces (cross-window messaging, keyboard shortcuts, audio, drag-and-drop, font sizing) -- not in any single technically hard problem. Keeping each piece small and composable prevents the control panel from becoming an unmaintainable monolith.

## Common Pitfalls

### Pitfall 1: Popup Blockers
**What goes wrong:** `window.open()` gets blocked by browser popup blockers when called outside a direct user gesture.
**Why it happens:** Browsers require window.open to be called synchronously inside a click event handler. Async operations between the click and the open will cause it to be blocked.
**How to avoid:** The "Proyectar" button must directly call `window.open()` in its onClick handler -- no async operations (no await, no setTimeout) before the call.
**Warning signs:** Window doesn't open, no error in console (silently blocked).

### Pitfall 2: BroadcastChannel Message After Close
**What goes wrong:** Sending messages after the projection window closed causes no error but messages are lost. When the projection window reopens, it misses the current state.
**Why it happens:** BroadcastChannel delivers messages only to currently-connected contexts.
**How to avoid:** When the projection window loads, it sends a `PING` message. The control panel responds with the full current state (current slide + theme + mode). This handshake ensures the projection window always starts with the correct state.
**Warning signs:** Projection window shows stale or blank content after being reopened.

### Pitfall 3: Fullscreen API Requires User Gesture
**What goes wrong:** `requestFullscreen()` fails silently or throws when called without a user gesture.
**Why it happens:** Security requirement -- only synchronous code inside a user-initiated event can trigger fullscreen.
**How to avoid:** The projection page should have a "Click to go fullscreen" overlay that the operator clicks once. After that, the page stays fullscreen until ESC is pressed. Alternatively, the projection page can auto-request fullscreen on first user interaction.
**Warning signs:** Projection page opens but is not fullscreen.

### Pitfall 4: parseHymnHtml is Server-Only
**What goes wrong:** Importing `parseHymnHtml` from `app/lib/pdf/html-to-pdf.ts` in a client component causes build errors because it imports `node-html-parser`.
**Why it happens:** `node-html-parser` is a Node.js package that uses Node APIs not available in the browser.
**How to avoid:** Create a client-safe `parseHymnHtmlClient()` using browser's native `DOMParser`. The logic is identical; only the HTML parsing backend differs.
**Warning signs:** Build error: "Module not found: Can't resolve 'node-html-parser'".

### Pitfall 5: Audio Playback Across Hymn Transitions
**What goes wrong:** Audio keeps playing when switching to a different hymn, or stops unexpectedly when navigating slides within the same hymn.
**Why it happens:** The audio element gets unmounted/remounted during React re-renders when the active hymn changes.
**How to avoid:** Keep the `<audio>` element outside the per-hymn component tree -- in the bottom AudioBar which persists across hymn changes. Track the audio's hymnId separately and only stop/switch when the hymnId actually changes (D-20).
**Warning signs:** Audio restarts when clicking slides within the same hymn.

### Pitfall 6: Keyboard Shortcuts Conflicting with Browser
**What goes wrong:** Space bar scrolls the page. Arrow keys scroll. Ctrl+Plus zooms the browser.
**Why it happens:** Default browser behavior for these keys.
**How to avoid:** Call `e.preventDefault()` in the keyboard handler for all captured shortcuts. Since the layout is `h-screen` with no page scroll, preventing default is safe. For Ctrl+Plus/Minus, prevent default only when the visualizador is focused.
**Warning signs:** Page scrolls or browser zooms when operator uses shortcuts during worship.

## Code Examples

### Reusable: buildSlideGroups (client-safe port)
```typescript
// Source: app/lib/presentation/generate-hymn-propresenter.ts lines 50-120
// Port to: app/visualizador/lib/build-slides-client.ts
// The buildSlideGroups function needs zero changes -- it only depends on
// ParsedVerse[] and HymnForPdf types, no server APIs.
// Only parseHymnHtml needs a client-safe replacement.

import type { HymnForPdf, ParsedVerse, ParsedLine } from '@/app/interfaces/Hymn.interface';

const TITLE_KEYWORDS = ['CORO','I','II','III','IV','V','VI','VII','VIII','IX','X'];

export function parseHymnHtmlClient(html: string): ParsedVerse[] {
  if (!html?.trim()) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const paragraphs = doc.querySelectorAll('p');
  const verses: ParsedVerse[] = [];

  for (const paragraph of paragraphs) {
    const textContent = paragraph.textContent?.trim() ?? '';
    if (/^HIMNO\s*#?\s*\d+\s*[-\u2013\u2014]\s*.+$/i.test(textContent)) continue;
    if (TITLE_KEYWORDS.includes(textContent)) {
      verses.push({ type: 'title', lines: [{ text: textContent }] });
      continue;
    }
    const lineSegments = paragraph.innerHTML.split(/<br\s*\/?>/i);
    const parsedLines: ParsedLine[] = [];
    for (const segment of lineSegments) {
      const tmp = document.createElement('span');
      tmp.innerHTML = segment.trim();
      const text = tmp.textContent?.trim();
      if (!text) continue;
      const line: ParsedLine = { text };
      const first = tmp.firstElementChild;
      if (first?.tagName === 'STRONG' || first?.tagName === 'B') line.bold = true;
      if (first?.tagName === 'EM' || first?.tagName === 'I') line.italic = true;
      parsedLines.push(line);
    }
    if (parsedLines.length > 0) verses.push({ type: 'verse', lines: parsedLines });
  }
  return verses;
}
```

### Reusable: AudioTrackPlayer Pattern
```typescript
// Source: app/empaquetador/components/HymnDetailModal.tsx lines 73-179
// The AudioTrackPlayer component pattern is directly reusable.
// For the visualizador, adapt it into a bottom-bar layout with track selector dropdown.
// Key: keep <audio> element persistent, only change src when track/hymn changes.
```

### @dnd-kit Sortable List
```typescript
// Source: @dnd-kit official docs
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortablePlaylistItem({ hymn, index }: { hymn: PlaylistHymn; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: hymn.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* Playlist item content */}
    </div>
  );
}

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    const oldIndex = playlist.findIndex(h => h.id === active.id);
    const newIndex = playlist.findIndex(h => h.id === over.id);
    dispatch({ type: 'REORDER_PLAYLIST', from: oldIndex, to: newIndex });
  }
}
```

### BroadcastChannel Hook
```typescript
// useBroadcastChannel.ts
import { useEffect, useRef } from 'react';
import { CHANNEL_NAME, type ProjectionMessage } from '../lib/projection-channel';

export function useBroadcastChannel(
  onMessage?: (msg: ProjectionMessage) => void,
) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    if (onMessage) {
      channel.onmessage = (e: MessageEvent<ProjectionMessage>) => onMessage(e.data);
    }
    return () => channel.close();
  }, [onMessage]);

  const send = (msg: ProjectionMessage) => {
    channelRef.current?.postMessage(msg);
  };

  return { send };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| window.postMessage with ref | BroadcastChannel API | Safari 15.4 (2022) | No need to hold window references; simpler code |
| CSS vw units for text scaling | Binary search + canvas measureText | Ongoing best practice | Accurate fit for variable content length |
| react-beautiful-dnd | @dnd-kit or @hello-pangea/dnd | 2023 (rbd deprecated) | react-beautiful-dnd is unmaintained; dnd-kit is the modern successor |
| Manual fullscreen prefixes | Unprefixed requestFullscreen() | 2020+ (all browsers) | No more vendor prefix juggling |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Officially deprecated by Atlassian. `@hello-pangea/dnd` is the community fork; `@dnd-kit` is the from-scratch modern alternative.
- Prefixed Fullscreen API (`webkitRequestFullscreen`, `mozRequestFullscreen`): No longer needed. All modern browsers support unprefixed `requestFullscreen()`.

## Open Questions

1. **Church logo source**
   - What we know: D-10 requires a "Logo" button showing the church logo. Could come from Directus assets or a static file in `public/`.
   - What's unclear: No logo file identified in the project.
   - Recommendation: Use a static file in `public/logo-iglesia.png` as default. Allow the operator to configure via the theme settings (upload or URL). If not found, show the church name text instead.

2. **Projection window on specific monitor**
   - What we know: The Window Management API can place windows on specific screens, but it requires a permission prompt and is Chrome-only.
   - What's unclear: Whether operators will have dual-monitor setups where automatic screen selection matters.
   - Recommendation: Defer Window Management API. Use basic `window.open()` -- the operator drags the window to the projector screen manually, then clicks fullscreen. This is the same UX as ProPresenter/PowerPoint.

3. **Hymn data fetching strategy**
   - What we know: `fetchHymnForPdf()` returns complete hymn data including `letter_hymn` HTML. The `/api/hymns/[id]` endpoint already exists.
   - What's unclear: Whether to fetch all hymn details when adding to playlist or lazily when selecting.
   - Recommendation: Fetch lazily when the hymn is selected (clicked in playlist). Cache in a Map (same pattern as `detailsCache` in HymnDetailModal). Prefetch the next hymn in playlist for seamless transitions.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| BroadcastChannel API | D-09 cross-window comm | Supported in all modern browsers | N/A (browser API) | window.postMessage as fallback |
| Fullscreen API | D-08 projection | Supported in all modern browsers | N/A (browser API) | -- |
| DOMParser | Client-side HTML parsing | Supported in all browsers | N/A (browser API) | -- |
| Canvas 2D | Font auto-sizing | Supported in all browsers | N/A (browser API) | -- |
| @dnd-kit/core | D-05 drag-and-drop | Not installed | Need 6.3.1 | npm install |
| @dnd-kit/sortable | D-05 drag-and-drop | Not installed | Need 10.0.0 | npm install |
| @dnd-kit/utilities | D-05 drag-and-drop | Not installed | Need 3.2.2 | npm install |

**Missing dependencies with no fallback:**
- None (all browser APIs are widely supported)

**Missing dependencies with fallback:**
- @dnd-kit packages: not installed, must be added via npm install

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (config at `vitest.config.mts`) |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-13 | Slide building from parsed verses (buildSlideGroups port) | unit | `npx vitest run app/visualizador/lib/build-slides-client.test.ts -x` | Wave 0 |
| D-09 | BroadcastChannel message types and serialization | unit | `npx vitest run app/visualizador/lib/projection-channel.test.ts -x` | Wave 0 |
| D-14 | Font auto-sizing algorithm | unit | `npx vitest run app/visualizador/hooks/useAutoFontSize.test.ts -x` | Wave 0 |
| D-01 to D-20 | Full UI integration (3-column layout, projection, audio) | manual-only | Human verification via browser | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green + human verification of projection workflow

### Wave 0 Gaps
- [ ] `app/visualizador/lib/build-slides-client.test.ts` -- covers D-13 slide building
- [ ] `app/visualizador/lib/projection-channel.test.ts` -- covers D-09 message types

## Sources

### Primary (HIGH confidence)
- MDN BroadcastChannel API: https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
- MDN Fullscreen API: https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
- MDN Element.requestFullscreen(): https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
- Can I Use BroadcastChannel: https://caniuse.com/broadcastchannel (92% global support)
- @dnd-kit official docs: https://docs.dndkit.com/
- @dnd-kit/sortable npm: https://www.npmjs.com/package/@dnd-kit/sortable (v10.0.0)
- @dnd-kit/core npm: https://www.npmjs.com/package/@dnd-kit/core (v6.3.1)

### Secondary (MEDIUM confidence)
- Chrome Window Management API: https://developer.chrome.com/docs/capabilities/web-apis/window-management (Chrome-only, deferred)
- CSS font auto-sizing techniques: https://css-tricks.com/fitting-text-to-a-container/

### Tertiary (LOW confidence)
- None

### Codebase (HIGH confidence -- direct file reading)
- `app/lib/presentation/generate-hymn-propresenter.ts` -- buildSlideGroups logic (lines 50-120)
- `app/empaquetador/components/HymnDetailModal.tsx` -- AudioTrackPlayer pattern (lines 73-179)
- `app/empaquetador/hooks/useHymnSearch.ts` -- search hook (reusable as-is)
- `app/lib/pdf/html-to-pdf.ts` -- parseHymnHtml (server-only, needs client port)
- `app/interfaces/Hymn.interface.ts` -- all hymn types
- `app/api/hymns/[id]/route.ts` -- existing hymn detail API
- `app/empaquetador/page.tsx` -- h-screen flex layout pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries verified against npm registry and project package.json
- Architecture: HIGH - patterns derived from existing codebase (empaquetador) and well-documented browser APIs
- Pitfalls: HIGH - based on direct experience with Fullscreen API, BroadcastChannel, and popup blocker behavior documented in MDN

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable domain; browser APIs are mature)
