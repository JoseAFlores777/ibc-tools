---
phase: 7
slug: musicxml-score-viewer-with-verovio-and-spessasynth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (if installed) or jest via Next.js |
| **Config file** | TBD — Wave 0 installs if needed |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | TBD | TBD | TBD | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test framework setup (vitest or jest) if not already configured
- [ ] Test stubs for Verovio WASM initialization
- [ ] Test stubs for SpessaSynth sequencer lifecycle
- [ ] Test stubs for cursor synchronization logic

*Updated during planning when tasks are defined.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Score renders visually correct SVG | D-09 | Visual rendering quality | Open hymn with MusicXML, verify SATB score displays |
| Cursor follows playback smoothly | D-07 | Animation timing | Play MIDI, verify cursor advances note-by-note |
| Auto-scroll follows cursor | D-11 | Scroll behavior | Play long score, verify viewport follows cursor |
| SoundFont audio quality | D-08 | Audio quality | Play MIDI, verify instrument sounds correct |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
