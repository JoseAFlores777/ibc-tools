---
phase: 5
slug: implementa-feature-completo-de-impresi-n-de-himnos
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing project test framework) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Will be filled after plans are created.*

---

## Wave 0 Requirements

- [ ] `app/lib/pdf/__tests__/imposition.test.ts` — unit tests for saddle-stitch imposition algorithm
- [ ] `app/lib/pdf/__tests__/font-presets.test.ts` — font preset token validation
- [ ] `app/lib/pdf/__tests__/render-hymn-pdf-extended.test.ts` — extended render options tests

*Existing vitest infrastructure covers test execution.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Booklet PDF prints correctly duplex | D-01 | Physical print verification | Print booklet PDF on duplex printer, verify pages align when folded |
| Font presets render legibly | D-06 | Visual quality assessment | Open PDF in viewer, verify each preset is readable at expected size |
| Booklet folding produces correct page order | D-01 | Physical verification | Print, fold, staple, verify page sequence reads 1,2,3...N |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
