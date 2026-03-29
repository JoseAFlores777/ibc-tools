---
phase: 2
slug: pdf-generation-for-server-side-rendering
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x / vitest (TBD — planner decides) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm test -- --testPathPattern=pdf` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=pdf`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | IMPR-01 | unit | `npm test -- --testPathPattern=pdf` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | IMPR-02 | unit | `npm test -- --testPathPattern=pdf` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | IMPR-03 | unit | `npm test -- --testPathPattern=pdf` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | IMPR-04 | unit | `npm test -- --testPathPattern=pdf` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test framework installation (jest or vitest)
- [ ] `app/components/pdf-components/__tests__/` — test directory setup
- [ ] Test stubs for all 4 component variants (1-page decorated, 1-page plain, 2-page decorated, 2-page plain)
- [ ] Mock helpers for `HymnForPdf` data and `ParsedVerse[]` structures

*Planner will finalize exact files and framework choice.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF visual layout correctness | IMPR-02, IMPR-03 | Visual inspection of margins, font rendering, column alignment | Generate sample PDFs, open in viewer, verify layout matches spec |
| Decorated style visual elements | IMPR-04 | Color, border, logo rendering requires visual check | Compare decorated PDF output against reference screenshots |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
