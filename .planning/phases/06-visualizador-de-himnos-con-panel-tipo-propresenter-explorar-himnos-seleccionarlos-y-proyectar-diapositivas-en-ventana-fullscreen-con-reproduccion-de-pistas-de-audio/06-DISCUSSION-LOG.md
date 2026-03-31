# Phase 6: Visualizador de himnos con panel tipo ProPresenter - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 06-visualizador-de-himnos-con-panel-tipo-propresenter
**Areas discussed:** Panel layout and navigation, Fullscreen projection behavior, Slide content and styling, Audio playback integration

---

## Panel Layout and Navigation

### Control Panel Layout

| Option | Description | Selected |
|--------|-------------|----------|
| ProPresenter-style 3-column | Left: hymn playlist/search. Center: slide thumbnails grid. Right: live preview. Audio controls at bottom bar. | ✓ |
| Simplified 2-column | Left: hymn search/selection. Right: slide list. No separate live preview. | |

**User's choice:** ProPresenter-style 3-column
**Notes:** Chose the more feature-rich layout matching ProPresenter's familiar interface.

### Hymn Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Playlist queue (Recommended) | Ordered playlist. Click to load slides. Drag to reorder. | ✓ |
| Browse and project directly | No playlist, search and click to load. | |
| Both: playlist + quick search | Primary playlist with secondary search overlay. | |

**User's choice:** Playlist queue
**Notes:** None.

### Adding Hymns to Playlist

| Option | Description | Selected |
|--------|-------------|----------|
| Search modal/drawer | Click '+ Agregar' to open overlay. | |
| Inline search in sidebar | Search bar always visible at top of hymn list. | ✓ |
| You decide | Claude picks best approach. | |

**User's choice:** Inline search in sidebar
**Notes:** Prefers always-visible search for quick access.

### Slide Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Click thumbnail + arrow keys | Click thumbnails, arrow keys to advance, space for next. | |
| Click only | Click thumbnails only, no keyboard. | |
| Click + keys + auto-advance | Same as option 1, plus auto-advance to next hymn on last slide. | ✓ |

**User's choice:** Click + keys + auto-advance on next hymn
**Notes:** Wants seamless hymn-to-hymn flow during worship sets.

---

## Fullscreen Projection Behavior

### Projection Output Method

| Option | Description | Selected |
|--------|-------------|----------|
| New browser window (Recommended) | Separate fullscreen window via window.open(). Operator controls from main tab. | ✓ |
| Same-tab fullscreen toggle | Fullscreen in same tab, Escape to return. | |
| Picture-in-picture style | Floating panel. | |

**User's choice:** New browser window
**Notes:** Allows operator to see controls while audience sees slides.

### Projection Controls

| Option | Description | Selected |
|--------|-------------|----------|
| Black screen + clear text | Two buttons: Negro and Limpiar. | |
| Black screen only | Single Negro button. | |
| Black + clear + logo | Black screen, clear text, and Logo button for pre-service screens. | ✓ |

**User's choice:** Black + clear + logo
**Notes:** Logo for pre-service display is a common ProPresenter feature.

### Transition Effects

| Option | Description | Selected |
|--------|-------------|----------|
| Fade transition (Recommended) | 300-500ms crossfade. Professional look. | ✓ |
| Instant cut | No transition. | |
| You decide | Claude picks. | |

**User's choice:** Fade transition
**Notes:** None.

---

## Slide Content and Styling

### Visual Theme

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse existing presentation theme | Dark purple #393572 + gold #eaba1c + white text. | |
| Clean dark with customizable bg | Default dark, operator can upload background or choose presets. | ✓ |
| Simple black background | Pure black, white text, no flair. | |

**User's choice:** Clean dark with customizable background
**Notes:** Wants flexibility for different church events.

### Slide Splitting

| Option | Description | Selected |
|--------|-------------|----------|
| One verse per slide + intercalated chorus | Each stanza = 1 slide, chorus after each stanza. Title slide first. | ✓ |
| Intelligent auto-split by line count | Split long verses into multiple slides. | |
| You decide | Claude picks. | |

**User's choice:** One verse per slide + intercalated chorus
**Notes:** Matches existing ProPresenter export pattern.

### Font Size Control

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-fit with manual override | Auto-size text + manual +/- buttons. | ✓ |
| Fixed presets only | 3 size presets. | |
| Auto-fit only | Text always auto-sizes. | |

**User's choice:** Auto-fit with manual override
**Notes:** None.

---

## Audio Playback Integration

### When to Play

| Option | Description | Selected |
|--------|-------------|----------|
| Manual play by operator | Operator clicks play when ready. Audio and slides independent. | ✓ |
| Auto-play when hymn loads | Audio starts when hymn selected. | |
| You decide | Claude picks. | |

**User's choice:** Manual play by operator
**Notes:** Maximum flexibility for worship flow where pastor may speak between verses.

### Default Track

| Option | Description | Selected |
|--------|-------------|----------|
| Pista completa (track_only) | Default to full accompaniment track. | ✓ |
| No default — operator picks | No pre-selection. | |
| Remember last selection | localStorage persistence. | |

**User's choice:** Pista completa (track_only)
**Notes:** Most commonly used during worship.

### Multi-Track

| Option | Description | Selected |
|--------|-------------|----------|
| Single track at a time | One track plays, switching stops current. | ✓ |
| Multi-track mixer | Multiple simultaneous tracks with volume sliders. | |
| Single now, mixer later | Ship single, note mixer as v2. | |

**User's choice:** Single track at a time
**Notes:** Multi-track mixer noted as deferred idea for v2.

---

## Claude's Discretion

- Route path, responsive behavior, background image presets/upload UX
- Exact keyboard shortcuts, slide thumbnail sizing, null lyrics handling
- Loading states, error handling, localStorage persistence for playlist/settings
- Church logo source, animation library for transitions

## Deferred Ideas

- Multi-track audio mixer (v2)
- Auto-advance slides by audio timestamps
- Remote control from mobile device
- Shared playlists saved to Directus
- Song arrangement editor (custom verse order)
- Countdown timer between songs
- Scripture/announcement slides (non-hymn content)
