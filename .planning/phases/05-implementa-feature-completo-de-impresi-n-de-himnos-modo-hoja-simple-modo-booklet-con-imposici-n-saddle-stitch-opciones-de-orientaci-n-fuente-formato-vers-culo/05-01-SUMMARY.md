---
phase: 05-impresion-himnos
plan: 01
subsystem: pdf-generation, wizard-state, schema
tags: [imposition, font-presets, booklet, wizard-reducer, schema-extension]
dependency_graph:
  requires: []
  provides: [computeImposition, FONT_PRESETS, FONT_PRESETS_BOOKLET, BOOKLET_SHEET_WIDTH, PrintMode, Orientation, FontPreset, extended-PackageRequest, extended-WizardState]
  affects: [render-hymn-pdf, StepConfiguracion, generate-hymn-zip, package-route]
tech_stack:
  added: []
  patterns: [saddle-stitch-imposition, font-preset-system]
key_files:
  created:
    - app/lib/pdf/imposition.ts
    - tests/pdf/imposition.test.ts
  modified:
    - app/components/pdf-components/shared/pdf-tokens.ts
    - app/lib/zip/zip.schema.ts
    - app/empaquetador/hooks/useWizardReducer.ts
    - app/empaquetador/lib/build-package-request.ts
    - tests/empaquetador/wizardReducer.test.ts
    - tests/empaquetador/buildPackageRequest.test.ts
decisions:
  - "Imposition algorithm uses 1-based page numbers with 0 for blank pages"
  - "Font presets share family between full-page and booklet variants, only scale differs"
  - "All new PackageRequest fields are optional with defaults for backward compatibility"
metrics:
  duration: 3min 31s
  completed: "2026-03-30T21:19:25Z"
  tasks: 2
  files: 8
---

# Phase 05 Plan 01: Imposition Algorithm, Font Presets, Schema Extension Summary

Saddle-stitch imposition algorithm, 3-preset font system (clasica/moderna/legible), booklet dimension tokens, and backward-compatible schema + wizard state extension with printMode/orientation/fontPreset/includeBibleRef.

## Task Results

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Imposition algorithm + font presets + booklet tokens | f48af30 | app/lib/pdf/imposition.ts, app/components/pdf-components/shared/pdf-tokens.ts, tests/pdf/imposition.test.ts |
| 2 | Extend schema, wizard reducer, and buildPackageRequest | b544b7b | app/lib/zip/zip.schema.ts, app/empaquetador/hooks/useWizardReducer.ts, app/empaquetador/lib/build-package-request.ts, tests/empaquetador/wizardReducer.test.ts, tests/empaquetador/buildPackageRequest.test.ts |

## What Was Built

### Imposition Algorithm (`app/lib/pdf/imposition.ts`)
Pure function `computeImposition(totalContentPages)` that calculates saddle-stitch page ordering for booklet printing. Pads content to the nearest multiple of 4, assigns pages to sheet front/back sides in correct fold order. Returns an array of `ImpositionSheet` objects. Handles edge cases: 0 pages, 1 page, non-multiple-of-4 counts.

### Font Preset System (`app/components/pdf-components/shared/pdf-tokens.ts`)
Added `FONT_PRESETS` (full-page) and `FONT_PRESETS_BOOKLET` (half-letter) with three presets:
- **clasica**: Adamina serif, standard sizes (display 24/18pt)
- **moderna**: Helvetica sans-serif, standard sizes (display 22/16pt)
- **legible**: Helvetica, enlarged for easy reading (body 12/10pt)

Also added booklet dimension constants: `BOOKLET_SHEET_WIDTH` (792), `BOOKLET_PAGE_WIDTH` (396), `BOOKLET_SHEET_HEIGHT` (612), `BOOKLET_MARGIN` (20).

Exported types: `FontPreset`, `PrintMode`, `Orientation`, `FontScale`, `FontPresetConfig`.

### Extended PackageRequest Schema (`app/lib/zip/zip.schema.ts`)
Four new optional fields with backward-compatible defaults:
- `printMode`: `'simple' | 'booklet'` (default: `'simple'`)
- `orientation`: `'portrait' | 'landscape'` (default: `'portrait'`)
- `fontPreset`: `'clasica' | 'moderna' | 'legible'` (default: `'clasica'`)
- `includeBibleRef`: boolean (default: `true`)

### Extended Wizard Reducer (`app/empaquetador/hooks/useWizardReducer.ts`)
Four new state fields in `WizardState`, four new action types (`SET_PRINT_MODE`, `SET_ORIENTATION`, `SET_FONT_PRESET`, `SET_INCLUDE_BIBLE_REF`). Updated `RESET` and `LOAD_PACKAGE` cases.

### Updated buildPackageRequest (`app/empaquetador/lib/build-package-request.ts`)
Maps all four new wizard state fields to the PackageRequest output.

## Test Coverage

- **16 tests** for imposition algorithm (0, 1, 3, 4, 8, 12 pages, negative, tokens)
- **20 tests** for wizard reducer (14 existing + 6 new for Phase 05 fields)
- **7 tests** for buildPackageRequest (4 existing + 3 new for Phase 05 fields)
- **43 total tests** passing

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. All functions are fully implemented with no placeholder values.

## Pre-existing Issues

- `tests/services/hymns.test.ts` has 1 failing test (unrelated to this plan, pre-existing in main branch)
