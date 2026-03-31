// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { parseHymnHtmlClient, buildSlideGroups } from './build-slides-client';
import type { HymnForPdf } from '@/app/interfaces/Hymn.interface';

const mockHymn: HymnForPdf = {
  id: 'test-1',
  name: 'Himno de Prueba',
  hymn_number: 42,
  hymn_time_signature: '4/4',
  letter_hymn: null,
  bible_text: 'Cantad al Senor cantico nuevo',
  bible_reference: 'Salmos 96:1',
  hymnal: { name: 'Himnario Bautista', publisher: null },
  authors: [],
  audioFiles: {
    track_only: null,
    midi_file: null,
    soprano_voice: null,
    alto_voice: null,
    tenor_voice: null,
    bass_voice: null,
  },
};

describe('parseHymnHtmlClient', () => {
  it('returns empty array for null input', () => {
    expect(parseHymnHtmlClient(null)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseHymnHtmlClient('')).toEqual([]);
  });

  it('parses HTML with 2 verses and a chorus into correct ParsedVerse entries', () => {
    const html = `
      <p>I</p>
      <p>Linea uno del verso uno<br>Linea dos del verso uno</p>
      <p>CORO</p>
      <p>Linea del coro<br>Segunda linea del coro</p>
      <p>II</p>
      <p>Linea uno del verso dos<br>Linea dos del verso dos</p>
    `;
    const result = parseHymnHtmlClient(html);
    // Expected: title(I), verse, title(CORO), verse, title(II), verse = 6 entries
    expect(result.length).toBe(6);
    expect(result[0]).toEqual({ type: 'title', lines: [{ text: 'I' }] });
    expect(result[1].type).toBe('verse');
    expect(result[1].lines.length).toBe(2);
    expect(result[2]).toEqual({ type: 'title', lines: [{ text: 'CORO' }] });
    expect(result[3].type).toBe('verse');
    expect(result[4]).toEqual({ type: 'title', lines: [{ text: 'II' }] });
    expect(result[5].type).toBe('verse');
  });

  it('skips HIMNO header pattern lines', () => {
    const html = `
      <p>HIMNO #42 - CON CANTICOS, SENOR (4/4)</p>
      <p>I</p>
      <p>Una linea</p>
    `;
    const result = parseHymnHtmlClient(html);
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({ type: 'title', lines: [{ text: 'I' }] });
  });

  it('detects bold formatting', () => {
    const html = `<p><strong>Texto en negrita</strong></p>`;
    const result = parseHymnHtmlClient(html);
    expect(result.length).toBe(1);
    expect(result[0].lines[0].bold).toBe(true);
  });

  it('detects italic formatting', () => {
    const html = `<p><em>Texto en cursiva</em></p>`;
    const result = parseHymnHtmlClient(html);
    expect(result.length).toBe(1);
    expect(result[0].lines[0].italic).toBe(true);
  });
});

describe('buildSlideGroups', () => {
  it('produces intercalated chorus pattern: Intro, Estrofa I, Coro, Estrofa II, Coro', () => {
    const html = `
      <p>I</p>
      <p>Verso uno linea uno<br>Verso uno linea dos</p>
      <p>CORO</p>
      <p>Linea del coro</p>
      <p>II</p>
      <p>Verso dos linea uno<br>Verso dos linea dos</p>
    `;
    const verses = parseHymnHtmlClient(html);
    const slides = buildSlideGroups(verses, mockHymn);

    expect(slides.length).toBe(5);
    expect(slides[0].label).toBe('Introduccion');
    expect(slides[1].verseLabel).toBe('ESTROFA I');
    expect(slides[2].verseLabel).toBe('CORO');
    expect(slides[3].verseLabel).toBe('ESTROFA II');
    expect(slides[4].verseLabel).toBe('CORO');
  });

  it('produces correct slides with no chorus: Intro, Estrofa I, Estrofa II', () => {
    const html = `
      <p>I</p>
      <p>Verso uno</p>
      <p>II</p>
      <p>Verso dos</p>
    `;
    const verses = parseHymnHtmlClient(html);
    const slides = buildSlideGroups(verses, mockHymn);

    expect(slides.length).toBe(3);
    expect(slides[0].label).toBe('Introduccion');
    expect(slides[1].verseLabel).toBe('ESTROFA I');
    expect(slides[2].verseLabel).toBe('ESTROFA II');
  });

  it('intro slide matches ProPresenter format: HIMNO + name in caps + bible text', () => {
    const html = `<p>I</p><p>Linea</p>`;
    const verses = parseHymnHtmlClient(html);
    const slides = buildSlideGroups(verses, mockHymn);

    const intro = slides[0];
    expect(intro.label).toBe('Introduccion');
    expect(intro.text).toContain('HIMNO');
    expect(intro.text).toContain('"HIMNO DE PRUEBA"');
    expect(intro.text).toContain('"Cantad al Senor cantico nuevo"');
    expect(intro.text).toContain('Salmos 96:1');
  });

  it('handles empty verses gracefully', () => {
    const slides = buildSlideGroups([], mockHymn);
    // Should still have intro
    expect(slides.length).toBe(1);
    expect(slides[0].label).toBe('Introduccion');
  });
});
