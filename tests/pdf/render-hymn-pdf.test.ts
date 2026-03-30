import { describe, it, expect } from 'vitest';
import { sampleHymnForPdf, sampleHymnMinimal } from '../fixtures/hymn-pdf-samples';

describe('renderHymnPdf', () => {
  it('renders one-per-page decorated', async () => {
    const { renderHymnPdf } = await import('@/app/lib/pdf/render-hymn-pdf');
    const buffer = await renderHymnPdf({
      hymns: [sampleHymnForPdf],
      layout: 'one-per-page',
      style: 'decorated',
    });
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders one-per-page plain', async () => {
    const { renderHymnPdf } = await import('@/app/lib/pdf/render-hymn-pdf');
    const buffer = await renderHymnPdf({
      hymns: [sampleHymnForPdf],
      layout: 'one-per-page',
      style: 'plain',
    });
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders two-per-page decorated with 2 hymns', async () => {
    const { renderHymnPdf } = await import('@/app/lib/pdf/render-hymn-pdf');
    const buffer = await renderHymnPdf({
      hymns: [sampleHymnForPdf, sampleHymnMinimal],
      layout: 'two-per-page',
      style: 'decorated',
    });
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders two-per-page plain with 2 hymns', async () => {
    const { renderHymnPdf } = await import('@/app/lib/pdf/render-hymn-pdf');
    const buffer = await renderHymnPdf({
      hymns: [sampleHymnForPdf, sampleHymnMinimal],
      layout: 'two-per-page',
      style: 'plain',
    });
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders two-per-page with odd number of hymns (3)', async () => {
    const { renderHymnPdf } = await import('@/app/lib/pdf/render-hymn-pdf');
    const buffer = await renderHymnPdf({
      hymns: [sampleHymnForPdf, sampleHymnMinimal, sampleHymnForPdf],
      layout: 'two-per-page',
      style: 'plain',
    });
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('throws on empty hymns array', async () => {
    const { renderHymnPdf } = await import('@/app/lib/pdf/render-hymn-pdf');
    await expect(
      renderHymnPdf({
        hymns: [],
        layout: 'one-per-page',
        style: 'decorated',
      }),
    ).rejects.toThrow();
  });

  // New tests for Phase 05 options

  it('renders with printMode=booklet', async () => {
    const { renderHymnPdf } = await import('@/app/lib/pdf/render-hymn-pdf');
    const buffer = await renderHymnPdf({
      hymns: [sampleHymnForPdf, sampleHymnMinimal],
      layout: 'one-per-page',
      style: 'decorated',
      printMode: 'booklet',
    });
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders with orientation=landscape', async () => {
    const { renderHymnPdf } = await import('@/app/lib/pdf/render-hymn-pdf');
    const buffer = await renderHymnPdf({
      hymns: [sampleHymnForPdf],
      layout: 'one-per-page',
      style: 'decorated',
      orientation: 'landscape',
    });
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders with fontPreset=moderna', async () => {
    const { renderHymnPdf } = await import('@/app/lib/pdf/render-hymn-pdf');
    const buffer = await renderHymnPdf({
      hymns: [sampleHymnForPdf],
      layout: 'one-per-page',
      style: 'plain',
      fontPreset: 'moderna',
    });
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders with includeBibleRef=false', async () => {
    const { renderHymnPdf } = await import('@/app/lib/pdf/render-hymn-pdf');
    const buffer = await renderHymnPdf({
      hymns: [sampleHymnForPdf],
      layout: 'one-per-page',
      style: 'decorated',
      includeBibleRef: false,
    });
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders with all new options at once', async () => {
    const { renderHymnPdf } = await import('@/app/lib/pdf/render-hymn-pdf');
    const buffer = await renderHymnPdf({
      hymns: [sampleHymnForPdf, sampleHymnMinimal],
      layout: 'one-per-page',
      style: 'plain',
      printMode: 'booklet',
      fontPreset: 'legible',
      includeBibleRef: false,
    });
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders booklet with single hymn (pads to 4 pages)', async () => {
    const { renderHymnPdf } = await import('@/app/lib/pdf/render-hymn-pdf');
    const buffer = await renderHymnPdf({
      hymns: [sampleHymnForPdf],
      layout: 'one-per-page',
      style: 'decorated',
      printMode: 'booklet',
    });
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });
});
