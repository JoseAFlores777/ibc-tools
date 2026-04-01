---
phase: 7
slug: musicxml-score-viewer-with-verovio-and-spessasynth
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-01
updated: 2026-04-01
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-T2 | 01 | 1 | D-03, D-08 | unit (Wave 0) | `npx vitest run tests/api/score-proxy.test.ts tests/api/soundfont-proxy.test.ts -x` | Wave 0 creates | pending |
| 01-T3 | 01 | 1 | D-03 | unit | `npx vitest run tests/api/score-proxy.test.ts -x` | Created by T2 | pending |
| 01-T3 | 01 | 1 | D-08 | unit | `npx vitest run tests/api/soundfont-proxy.test.ts -x` | Created by T2 | pending |
| 02-T1 | 02 | 2 | D-04, D-07, D-10, D-11 | structural | grep + file existence checks | N/A | pending |
| 02-T2 | 02 | 2 | D-06 | structural + grep | grep for remaining MidiTrackPlayer imports | N/A | pending |
| 03-T1 | 03 | 3 | D-04, D-09, D-10, D-11 | structural | grep + file existence checks | N/A | pending |
| 03-T2 | 03 | 3 | D-02, D-05 | structural + tsc | `npx tsc --noEmit` | N/A | pending |
| 04-T1 | 04 | 4 | D-06 | structural + build | `npm run build` | N/A | pending |
| 04-T2 | 04 | 4 | ALL | manual | Human verification | N/A | pending |

*Status: pending -- green -- red -- flaky*

---

## Wave 0 Requirements

- [x] Test framework already configured (Vitest 4.1.2, vitest.config.mts)
- [ ] `tests/api/score-proxy.test.ts` — covers MusicXML proxy route (Plan 01, Task 2)
- [ ] `tests/api/soundfont-proxy.test.ts` — covers SoundFont proxy route (Plan 01, Task 2)

Wave 0 test scaffolds are created in **Plan 01, Task 2** (before the proxy route implementation in Task 3). Tests will initially fail (RED) and pass once Task 3 creates the route files (GREEN).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Score renders visually correct SVG | D-09 | Visual rendering quality | Open hymn with MusicXML, verify SATB score displays |
| Cursor follows playback smoothly | D-07 | Animation timing | Play MIDI, verify cursor advances note-by-note |
| Auto-scroll follows cursor | D-11 | Scroll behavior | Play long score, verify viewport follows cursor |
| SoundFont audio quality | D-08 | Audio quality | Play MIDI, verify instrument sounds correct |
| Zoom controls work | D-10 | Visual scaling | Click zoom in/out, verify score rescales |
| MidiPlayer drop-in replacement | D-06 | Behavioral parity | Play MIDI track, compare behavior to old MidiTrackPlayer |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (score-proxy.test.ts, soundfont-proxy.test.ts)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending execution
