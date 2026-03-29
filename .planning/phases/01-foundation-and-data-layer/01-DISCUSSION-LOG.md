# Phase 1: Foundation and Data Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 01-foundation-and-data-layer
**Areas discussed:** HTML parsing, Audio detection

---

## HTML Parsing

### Q1: HTML-to-react-pdf conversion approach

| Option | Description | Selected |
|--------|-------------|----------|
| Node HTML parser | Use node-html-parser to parse HTML server-side, then map tags to react-pdf Text/View elements | |
| Regex extraction | Simple regex to strip tags and extract text blocks — lighter but loses formatting | |
| You decide | Claude picks the best approach based on the actual HTML structure | ✓ |

**User's choice:** You decide
**Notes:** Claude has full discretion on the parsing approach.

### Q2: Formatting preservation importance

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve structure | Keep verse breaks, bold/italic, paragraph structure as close to original as possible | |
| Text only | Plain text extraction is fine — just the words in the right order | |
| Depends on style | Decorated style preserves formatting, plain style is text-only | ✓ |

**User's choice:** Depends on style
**Notes:** Formatting preservation is tied to the PDF style selection — decorated preserves structure, plain is text-only.

---

## Audio Detection

### Q1: Audio availability data shape

| Option | Description | Selected |
|--------|-------------|----------|
| Boolean flags | Simple true/false per field: hasTrack, hasMidi, hasSoprano, etc. Lightweight. | |
| File metadata | Include file name, size, and format per track — useful for showing details in the UI | ✓ |
| You decide | Claude picks based on what Directus provides efficiently | |

**User's choice:** File metadata
**Notes:** Richer metadata preferred for downstream UI display.

### Q2: Missing audio behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Still selectable | User can still select it — they just get the PDF without audio | |
| Show warning | Selectable but show a visual indicator that no audio is available | |
| You decide | Claude picks the best UX approach | ✓ |

**User's choice:** You decide
**Notes:** Claude has discretion on the UX approach for hymns with no audio.

---

## Claude's Discretion

- HTML parser library choice
- Missing audio UX treatment
- Search behavior details (debounce, limits, sort)
- Data contract shapes (extend ActivityHymn vs new interfaces)

## Deferred Ideas

None — discussion stayed within phase scope.
