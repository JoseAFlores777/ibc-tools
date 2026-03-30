import { describe, it, expect } from 'vitest';
import { computeImposition, ImpositionSheet } from '@/app/lib/pdf/imposition';
import {
  FONT_PRESETS,
  FONT_PRESETS_BOOKLET,
  BOOKLET_SHEET_WIDTH,
  BOOKLET_PAGE_WIDTH,
  BOOKLET_SHEET_HEIGHT,
  BOOKLET_MARGIN,
  FontPreset,
} from '@/app/components/pdf-components/shared/pdf-tokens';

describe('computeImposition', () => {
  it('returns empty array for 0 pages', () => {
    expect(computeImposition(0)).toEqual([]);
  });

  it('returns empty array for negative pages', () => {
    expect(computeImposition(-1)).toEqual([]);
  });

  it('correctly imposes 4 content pages (1 sheet, no padding)', () => {
    const sheets = computeImposition(4);
    expect(sheets).toHaveLength(1);
    expect(sheets[0].front).toEqual({ left: 4, right: 1 });
    expect(sheets[0].back).toEqual({ left: 2, right: 3 });
  });

  it('correctly imposes 8 content pages (2 sheets)', () => {
    const sheets = computeImposition(8);
    expect(sheets).toHaveLength(2);
    // Sheet 1
    expect(sheets[0].front).toEqual({ left: 8, right: 1 });
    expect(sheets[0].back).toEqual({ left: 2, right: 7 });
    // Sheet 2
    expect(sheets[1].front).toEqual({ left: 6, right: 3 });
    expect(sheets[1].back).toEqual({ left: 4, right: 5 });
  });

  it('pads 3 content pages to 4 (page 4 becomes blank=0)', () => {
    const sheets = computeImposition(3);
    expect(sheets).toHaveLength(1);
    // totalPages = 4, page 4 > 3 content pages => blank (0)
    expect(sheets[0].front).toEqual({ left: 0, right: 1 });
    expect(sheets[0].back).toEqual({ left: 2, right: 3 });
  });

  it('pads 1 content page to 4 (pages 2,3,4 become blank=0)', () => {
    const sheets = computeImposition(1);
    expect(sheets).toHaveLength(1);
    // totalPages = 4, only page 1 is content
    expect(sheets[0].front).toEqual({ left: 0, right: 1 });
    expect(sheets[0].back).toEqual({ left: 0, right: 0 });
  });

  it('correctly imposes 12 content pages (3 sheets)', () => {
    const sheets = computeImposition(12);
    expect(sheets).toHaveLength(3);

    // Every sheet has exactly 4 page slots
    for (const sheet of sheets) {
      const slots = [sheet.front.left, sheet.front.right, sheet.back.left, sheet.back.right];
      expect(slots).toHaveLength(4);
    }

    // Total non-zero page slots equals totalContentPages
    const allSlots = sheets.flatMap((s) => [
      s.front.left,
      s.front.right,
      s.back.left,
      s.back.right,
    ]);
    const nonZero = allSlots.filter((n) => n > 0);
    expect(nonZero).toHaveLength(12);

    // Each content page (1-12) appears exactly once
    const sorted = [...nonZero].sort((a, b) => a - b);
    expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

describe('font presets and booklet tokens', () => {
  it('FONT_PRESETS clasica uses Adamina', () => {
    expect(FONT_PRESETS['clasica'].family).toBe('Adamina');
  });

  it('FONT_PRESETS moderna uses Helvetica', () => {
    expect(FONT_PRESETS['moderna'].family).toBe('Helvetica');
  });

  it('FONT_PRESETS legible has body size 12', () => {
    expect(FONT_PRESETS['legible'].scale.body).toBe(12);
  });

  it('FONT_PRESETS_BOOKLET clasica has display 18', () => {
    expect(FONT_PRESETS_BOOKLET['clasica'].scale.display).toBe(18);
  });

  it('all three presets exist in both full-page and booklet', () => {
    const presets: FontPreset[] = ['clasica', 'moderna', 'legible'];
    for (const p of presets) {
      expect(FONT_PRESETS[p]).toBeDefined();
      expect(FONT_PRESETS_BOOKLET[p]).toBeDefined();
      expect(FONT_PRESETS[p].family).toBe(FONT_PRESETS_BOOKLET[p].family);
    }
  });

  it('BOOKLET_SHEET_WIDTH is 792 (landscape Letter)', () => {
    expect(BOOKLET_SHEET_WIDTH).toBe(792);
  });

  it('BOOKLET_PAGE_WIDTH is 396 (half of landscape)', () => {
    expect(BOOKLET_PAGE_WIDTH).toBe(396);
  });

  it('BOOKLET_SHEET_HEIGHT is 612', () => {
    expect(BOOKLET_SHEET_HEIGHT).toBe(612);
  });

  it('BOOKLET_MARGIN is 20', () => {
    expect(BOOKLET_MARGIN).toBe(20);
  });
});
