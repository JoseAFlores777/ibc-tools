---
phase: 1
slug: foundation-and-data-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (latest) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | Infra | setup | `npx vitest --version` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | SC-1 | unit | `npx vitest run app/lib/directus/services/__tests__/hymns.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | SC-2 | unit | `npx vitest run app/lib/directus/services/__tests__/hymns.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | SC-4 | unit | `npx vitest run app/lib/directus/services/__tests__/hymns.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | SC-3 | unit | `npx vitest run app/lib/__tests__/html-to-pdf-parser.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install vitest as dev dependency
- [ ] Create `vitest.config.ts` with path aliases matching tsconfig
- [ ] `app/lib/directus/services/__tests__/hymns.test.ts` — stubs for searchHymns, fetchHymnForPdf, audio flags
- [ ] `app/lib/__tests__/html-to-pdf-parser.test.ts` — stubs for HTML-to-PDF parser

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF visual output | SC-3 | Visual verification of react-pdf elements | Render a hymn PDF and visually inspect verse structure |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
