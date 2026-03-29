# Phase 2: PDF Generation for Server-Side Rendering - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 02-pdf-generation-for-server-side-rendering
**Areas discussed:** Plain style definition, 2-per-page layout

---

## Plain Style Definition

### Q1: How much metadata should the plain style include?

| Option | Description | Selected |
|--------|-------------|----------|
| Lyrics + header only | Hymn number, title, hymnal at top. Lyrics with verse/chorus markers. No footer, no branding. | ✓ |
| Bare lyrics only | Title and lyrics only. No hymn number, no hymnal, no verse markers. | |
| Lyrics + full credits | Header + lyrics + author/composer credits and bible reference at bottom. | |

**User's choice:** Lyrics + header only (Recommended)
**Notes:** Clean and printer-friendly approach selected.

### Q2: How should verse markers appear?

| Option | Description | Selected |
|--------|-------------|----------|
| Bold centered labels | Verse numbers and CORO centered and bold, lyrics left-aligned below. | ✓ |
| Inline markers | Verse markers on same line as text, like paragraph numbers. | |
| No markers | Just lyrics with blank line breaks between verses. | |

**User's choice:** Bold centered labels (Recommended)
**Notes:** None.

### Q3: Font feel for plain style?

| Option | Description | Selected |
|--------|-------------|----------|
| Serif (Adamina/Times) | Traditional, matches existing decorated style. | |
| Sans-serif (Helvetica) | Clean modern look, built into react-pdf, visually distinct from decorated. | ✓ |
| You decide | Claude picks based on readability. | |

**User's choice:** Sans-serif (Helvetica) (Recommended)
**Notes:** None.

---

## 2-per-page Layout

### Q1: How should two hymns share one LETTER page?

| Option | Description | Selected |
|--------|-------------|----------|
| Top/bottom split | Page divided horizontally. Each hymn gets ~5.5 inches vertical. | |
| Left/right columns | Page divided vertically. Each hymn gets ~4.25 inches width. Booklet feel. | ✓ |
| You decide | Claude picks based on readability and react-pdf constraints. | |

**User's choice:** Left/right columns
**Notes:** User chose columns over the recommended top/bottom split.

### Q2: Visual divider between columns?

| Option | Description | Selected |
|--------|-------------|----------|
| Thin vertical line | Subtle gray or gold line between columns. | ✓ |
| Whitespace only | Just a gap/gutter between columns. | |
| You decide | Claude picks per style. | |

**User's choice:** Thin vertical line (Recommended)
**Notes:** None.

### Q3: Decorated style header/footer in 2-per-page mode?

| Option | Description | Selected |
|--------|-------------|----------|
| Shared header/footer | One header spanning full page width, two hymn columns below, shared footer. | ✓ |
| Independent mini-headers | Each column gets its own scaled-down header. | |
| You decide | Claude picks what works best. | |

**User's choice:** Shared header/footer (Recommended)
**Notes:** None.

---

## Claude's Discretion

- Decorated style visual adaptation (replicate vs modernize the dark blue/gold look)
- Font sizes and margins for 2-per-page legibility
- Overflow handling for long hymns in 2-per-page mode
- Component architecture (new components vs refactor existing)

## Deferred Ideas

None — discussion stayed within phase scope.
