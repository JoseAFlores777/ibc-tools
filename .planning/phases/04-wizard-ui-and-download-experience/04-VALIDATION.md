---
phase: 4
slug: wizard-ui-and-download-experience
status: draft
nyquist_compliant: true
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
| **Quick run command** | `npx vitest run tests/empaquetador/ --reporter=verbose` |
| **Full suite command** | `npx vitest run --exclude '.claude/**' --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/empaquetador/ --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --exclude '.claude/**' --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | UX-01 | unit | `npx vitest run tests/empaquetador/ --reporter=verbose` | yes (created in task) | pending |
| 04-02-01 | 02 | 2 | BUSQ-01..07 | build+unit | `npx vitest run tests/empaquetador/ --reporter=verbose` | yes | pending |
| 04-03-01 | 03 | 3 | AUDIO-01..03, UX-02 | build+unit | `npx vitest run tests/empaquetador/ --reporter=verbose` | yes | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Wave 0 is scoped to **pure-function tests only** (no jsdom, no React component rendering).

- [x] Test framework configured (vitest already installed and configured)
- [ ] `tests/empaquetador/` directory with pure-function tests
- [ ] `tests/empaquetador/wizardReducer.test.ts` — reducer logic (Node environment, no DOM)
- [ ] `tests/empaquetador/buildPackageRequest.test.ts` — serialization logic (Node environment, no DOM)

**Rationale:** The wizard's testable business logic lives in the reducer and buildPackageRequest utility — both are pure functions that run in Node without jsdom or testing-library. UI components (WizardStepper, StepSeleccion, etc.) are verified via `npm run build` (type-checking) and manual checkpoint (04-03 Task 3). The `useHymnSearch` hook is a thin fetch wrapper whose behavior is covered by the API route tests (Phase 3) and manual testing; a dedicated hook test would require jsdom and provide low incremental value.

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
| UI component rendering | BUSQ-01..07, AUDIO-01..03 | No jsdom/testing-library configured | All component behavior verified through build + manual checkpoint |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
