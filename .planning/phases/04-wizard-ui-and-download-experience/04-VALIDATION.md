---
phase: 4
slug: wizard-ui-and-download-experience
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (already installed) |
| **Config file** | vitest.config.mts |
| **Quick run command** | `npx vitest run tests/components/ --reporter=verbose` |
| **Full suite command** | `npx vitest run --exclude '.claude/**' --reporter=verbose` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/components/ --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --exclude '.claude/**' --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | UX-01 | unit | `npx vitest run tests/components/` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | BUSQ-01..07 | unit | `npx vitest run tests/components/` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | AUDIO-01..03, UX-02 | unit | `npx vitest run tests/components/` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 4 | UX-03, GEN-03, GEN-04 | integration | `npx vitest run tests/components/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test framework configured for React component testing (jsdom environment)
- [ ] `tests/components/` directory structure
- [ ] Mock helpers for API fetch calls
- [ ] Test utilities for rendering shadcn components

*Planner will finalize exact files and test structure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual wizard stepper appearance | UX-01 | CSS/layout visual check | Open /empaquetador, verify 3-step stepper renders with correct colors and labels |
| Mobile responsive layout | UX-01 | Responsive breakpoint testing | Open /empaquetador on mobile viewport, verify sidebar becomes drawer |
| Search-as-you-type feel | BUSQ-01, BUSQ-02 | UX perception of debounce timing | Type in search, verify results appear smoothly ~300ms after typing stops |
| ZIP download triggers browser download | GEN-04 | Browser download behavior | Click "Generar Paquete", verify browser download dialog appears |
| Toast notifications | UX-03 | Visual notification appearance | Complete download flow, verify success/error toasts appear |
| Spanish text completeness | UX-03 | Language review | Navigate all steps, verify all text is in Spanish with no English fallbacks |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
