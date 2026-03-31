---
status: partial
phase: 06-visualizador
source: [06-VERIFICATION.md]
started: 2026-03-31T21:50:00Z
updated: 2026-03-31T21:50:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. 3-column dark layout at /visualizador
expected: Three independent scrolling columns render; dark background forced by layout; minimum-width guard appears for windows under 1024px
result: [pending]

### 2. Hymn search and add to playlist
expected: Hymn appears in playlist, center grid populates with slide thumbnails showing verse labels and truncated lyrics, right preview shows first slide
result: [pending]

### 3. Drag-and-drop playlist reordering
expected: Playlist reorders correctly; @dnd-kit drag handle works; active hymn index adjusts
result: [pending]

### 4. Proyectar button opens fullscreen projection window
expected: Popup window opens at /visualizador/proyeccion; fullscreen overlay prompts user; clicking it enters fullscreen; slide renders with dark background
result: [pending]

### 5. Slide advance with auto-crossfade across hymns (D-07)
expected: Projection window crossfades to first slide of second hymn automatically (400ms crossfade)
result: [pending]

### 6. Negro/Limpiar/Logo keyboard shortcuts and projection modes
expected: B: solid black screen; C: themed background, no text; L: church logo or fallback text centered on background
result: [pending]

### 7. Audio bar playback with track selection
expected: AudioBar shows play/pause button, track selector dropdown with only available tracks; P key plays; track switch stops current and loads new src
result: [pending]

### 8. Audio stops on hymn change (D-20)
expected: Audio stops immediately when switching to a different hymn
result: [pending]

### 9. Herramientas page link
expected: 'Visualizador de Himnos' card with Monitor icon links to /visualizador
result: [pending]

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0
blocked: 0

## Gaps
