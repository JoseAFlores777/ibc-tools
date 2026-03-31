---
phase: 6
slug: visualizador-de-himnos-con-panel-tipo-propresenter-explorar-himnos-seleccionarlos-y-proyectar-diapositivas-en-ventana-fullscreen-con-reproduccion-de-pistas-de-audio
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (vitest ^4.1.2 in devDependencies) |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npx vitest run app/visualizador/ --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run app/visualizador/ --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | D-13 | unit | `npx vitest run app/visualizador/lib/build-slides-client.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 06-01-01b | 01 | 1 | D-09 | unit | `npx vitest run app/visualizador/lib/projection-channel.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | D-04 | unit | `npx vitest run app/visualizador/hooks/useVisualizador.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | D-01,D-03 | manual | Browser: 3-column layout renders | N/A | ⬜ pending |
| 06-02-02 | 02 | 2 | D-06 | manual | Browser: slide navigation works | N/A | ⬜ pending |
| 06-03-01 | 03 | 3 | D-08 | manual | Browser: projection window opens fullscreen | N/A | ⬜ pending |
| 06-03-02 | 03 | 3 | D-10 | manual | Browser: black/clear/logo controls work | N/A | ⬜ pending |
| 06-04-01 | 04 | 4 | D-16,D-19 | manual | Browser: audio playback controls work | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/visualizador/lib/build-slides-client.test.ts` — unit tests for client-side slide building from ParsedVerse[] (uses `// @vitest-environment jsdom` pragma; requires `jsdom` devDependency)
- [ ] `app/visualizador/lib/projection-channel.test.ts` — unit tests for BroadcastChannel CHANNEL_NAME constant and ProjectionMessage discriminants
- [ ] `app/visualizador/hooks/useVisualizador.test.ts` — unit tests for playlist state reducer (add, remove, reorder)

*Requires `jsdom` devDependency for DOMParser tests — installed in Plan 01 Task 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 3-column layout renders correctly | D-01, D-03 | Visual layout verification | Open /visualizador, verify left playlist, center thumbnails, right preview columns |
| Fullscreen projection window | D-08 | Cross-window browser API | Click "Proyectar", verify new window opens fullscreen with slide content |
| Slide crossfade transitions | D-11 | Visual animation timing | Advance slides, verify 300-500ms fade between content |
| Font auto-sizing | D-14 | Visual rendering with variable content | Load hymns with different verse lengths, verify text fills projection screen |
| Audio playback with seek | D-16, D-19 | Browser audio API integration | Play track, seek to middle, verify time display updates |
| Black/Clear/Logo controls | D-10 | Cross-window visual state | Click each control, verify projection window responds correctly |
| Drag-and-drop reorder | D-05 | Mouse interaction with DnD library | Drag hymn in playlist, verify new order persists |
| Arrow key navigation | D-06 | Keyboard event handling in browser | Press left/right arrows, verify slides advance |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
