---
phase: 3
slug: api-routes-and-zip-streaming
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (already installed from Phase 2) |
| **Config file** | vitest.config.mts |
| **Quick run command** | `npx vitest run tests/api/ --reporter=verbose` |
| **Full suite command** | `npx vitest run --exclude '.claude/**' --reporter=verbose` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/api/ --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --exclude '.claude/**' --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | GEN-01 | unit | `npx vitest run tests/api/` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | GEN-02 | unit+integration | `npx vitest run tests/api/` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | GEN-03, GEN-04 | integration | `npx vitest run tests/api/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/api/hymn-search.test.ts` — test stubs for search endpoint
- [ ] `tests/api/hymn-package.test.ts` — test stubs for ZIP generation endpoint
- [ ] `tests/lib/zip/generate-hymn-zip.test.ts` — test stubs for ZIP generation utility
- [ ] Test fixtures for mock hymn data with audio fields

*Planner will finalize exact files and test structure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ZIP file opens correctly in OS | GEN-04 | Binary format validation requires unzip tool | Generate ZIP via curl POST, unzip, verify folder structure and file integrity |
| Audio files play correctly after extraction | GEN-02 | Audio playback requires media player | Extract audio from ZIP, play in media player, verify no corruption |
| Streaming behavior (no full buffering) | GEN-04 | Memory profiling needed | Monitor Node.js heap during large ZIP generation, verify no spike proportional to total size |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
