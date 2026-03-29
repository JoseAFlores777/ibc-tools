import { describe, it, expect } from 'vitest';
import type { ParsedVerse, ParsedLine } from '@/app/interfaces/Hymn.interface';
import {
  standardHymnHtml,
  formattedHymnHtml,
  minimalHymnHtml,
  emptyHymnHtml,
  entityHymnHtml,
} from '@/tests/fixtures/hymn-html-samples';
import { parseHymnHtml, extractPlainText } from '@/app/lib/pdf/html-to-pdf';

describe('parseHymnHtml', () => {
  it('identifies CORO and roman numeral labels as title type', () => {
    const result = parseHymnHtml(standardHymnHtml);
    // 6 items: CORO, verse1, I, verse2, II, verse3
    expect(result).toHaveLength(6);
    expect(result[0]).toEqual({ type: 'title', lines: [{ text: 'CORO' }] });
    expect(result[2]).toEqual({ type: 'title', lines: [{ text: 'I' }] });
    expect(result[4]).toEqual({ type: 'title', lines: [{ text: 'II' }] });
  });

  it('splits lines on <br> tags within paragraphs', () => {
    const result = parseHymnHtml(standardHymnHtml);
    // Verse after CORO has 3 lines
    expect(result[1].type).toBe('verse');
    expect(result[1].lines).toHaveLength(3);
    // Verse after I has 3 lines
    expect(result[3].type).toBe('verse');
    expect(result[3].lines).toHaveLength(3);
    // Verse after II has 2 lines
    expect(result[5].type).toBe('verse');
    expect(result[5].lines).toHaveLength(2);
  });

  it('decodes HTML entities without browser DOM', () => {
    const result = parseHymnHtml(standardHymnHtml);
    // &ntilde; -> n with tilde in 'Senor'
    expect(result[1].lines[0].text).toContain('Se\u00f1or');
    expect(result[1].lines[0].text).not.toContain('&ntilde;');
    // &oacute; -> accented o in 'corazon'
    expect(result[1].lines[1].text).toContain('coraz\u00f3n');
    expect(result[1].lines[1].text).not.toContain('&oacute;');
  });

  it('preserves bold formatting in ParsedLine', () => {
    const result = parseHymnHtml(formattedHymnHtml);
    // Second element is the verse after CORO with formatted lines
    const verse = result[1];
    expect(verse.type).toBe('verse');
    // First line: <strong>Texto en negrita</strong>
    expect(verse.lines[0].text).toBe('Texto en negrita');
    expect(verse.lines[0].bold).toBe(true);
  });

  it('preserves italic formatting in ParsedLine', () => {
    const result = parseHymnHtml(formattedHymnHtml);
    const verse = result[1];
    // Second line: <em>Texto en cursiva</em>
    expect(verse.lines[1].text).toBe('Texto en cursiva');
    expect(verse.lines[1].italic).toBe(true);
  });

  it('handles empty or null HTML input', () => {
    expect(parseHymnHtml(emptyHymnHtml)).toEqual([]);
    expect(parseHymnHtml('')).toEqual([]);
  });

  it('handles hymn with no section labels', () => {
    const result = parseHymnHtml(minimalHymnHtml);
    // All entries should be verses (no title markers)
    expect(result.length).toBeGreaterThan(0);
    result.forEach((item) => {
      expect(item.type).toBe('verse');
    });
    // Should have 2 lines in the single verse
    expect(result[0].lines).toHaveLength(2);
    // Entities decoded
    expect(result[0].lines[1].text).toContain('l\u00ednea');
  });

  it('decodes special HTML entities like inverted punctuation', () => {
    const result = parseHymnHtml(entityHymnHtml);
    // CORO title
    expect(result[0]).toEqual({ type: 'title', lines: [{ text: 'CORO' }] });
    // Verse with special entities
    const verse = result[1];
    expect(verse.type).toBe('verse');
    // &iquest; -> inverted question mark
    expect(verse.lines[0].text).toContain('\u00bf');
    // &iexcl; -> inverted exclamation mark
    expect(verse.lines[1].text).toContain('\u00a1');
    // &ntilde; -> n with tilde
    expect(verse.lines[1].text).toContain('Se\u00f1or');
  });
});

describe('extractPlainText', () => {
  it('strips all HTML tags and returns plain text lines', () => {
    const result = extractPlainText(standardHymnHtml);
    expect(result.length).toBeGreaterThan(0);
    // No HTML tags in any line
    result.forEach((line) => {
      expect(line).not.toContain('<');
      expect(line).not.toContain('>');
    });
  });

  it('preserves paragraph and line breaks as array elements', () => {
    const result = extractPlainText(standardHymnHtml);
    // CORO + 3 lines + I + 3 lines + II + 2 lines = 11 elements
    expect(result).toHaveLength(11);
    expect(result[0]).toBe('CORO');
  });

  it('decodes HTML entities in plain text mode', () => {
    const result = extractPlainText(standardHymnHtml);
    // Check decoded entities
    const joined = result.join(' ');
    expect(joined).toContain('Se\u00f1or');
    expect(joined).toContain('coraz\u00f3n');
    expect(joined).not.toContain('&ntilde;');
    expect(joined).not.toContain('&oacute;');
  });

  it('returns empty array for empty input', () => {
    expect(extractPlainText(emptyHymnHtml)).toEqual([]);
    expect(extractPlainText('')).toEqual([]);
  });
});
