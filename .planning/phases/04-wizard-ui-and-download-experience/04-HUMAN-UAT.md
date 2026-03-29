---
status: partial
phase: 04-wizard-ui-and-download-experience
source: [04-VERIFICATION.md]
started: 2026-03-29T22:00:00Z
updated: 2026-03-29T22:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-end wizard flow against live Directus
expected: Complete flow — search hymns, select multiple, configure layout/style/audio, generate ZIP, download completes with valid contents
result: [pending]

### 2. Mobile drawer behavior
expected: On narrow viewports (<1024px), selected hymns panel renders as a bottom Drawer instead of sidebar. Fixed bottom bar with count badge triggers drawer open.
result: [pending]

### 3. Step transition animations
expected: Framer Motion directional slides (left-to-right forward, right-to-left backward) with 200ms duration between wizard steps
result: [pending]

### 4. Error toast retry action
expected: When package generation fails (network error or server error), Sonner error toast appears with "Reintentar" action button that retries the generation
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
