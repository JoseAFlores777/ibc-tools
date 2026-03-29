import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToBuffer, Document } from '@react-pdf/renderer';
import {
  sampleHymnForPdf,
  sampleHymnMinimal,
  sampleVersesFull,
  sampleVersesMinimal,
  sampleVersesLong,
} from '../fixtures/hymn-pdf-samples';

describe('HymnPageDecorated', () => {
  it('renders a valid PDF buffer with full hymn data', async () => {
    const { HymnPageDecorated } = await import(
      '@/app/components/pdf-components/pdf-pages/HymnPageDecorated'
    );
    const doc = React.createElement(
      Document,
      null,
      React.createElement(HymnPageDecorated, {
        hymn: sampleHymnForPdf,
        verses: sampleVersesFull,
      }),
    );
    const buffer = await renderToBuffer(doc);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders with minimal hymn data (missing optional fields)', async () => {
    const { HymnPageDecorated } = await import(
      '@/app/components/pdf-components/pdf-pages/HymnPageDecorated'
    );
    const doc = React.createElement(
      Document,
      null,
      React.createElement(HymnPageDecorated, {
        hymn: sampleHymnMinimal,
        verses: sampleVersesMinimal,
      }),
    );
    const buffer = await renderToBuffer(doc);
    expect(buffer.length).toBeGreaterThan(0);
  });
});

describe('HymnPagePlain', () => {
  it('renders a valid PDF buffer with full hymn data', async () => {
    const { HymnPagePlain } = await import(
      '@/app/components/pdf-components/pdf-pages/HymnPagePlain'
    );
    const doc = React.createElement(
      Document,
      null,
      React.createElement(HymnPagePlain, {
        hymn: sampleHymnForPdf,
        verses: sampleVersesFull,
      }),
    );
    const buffer = await renderToBuffer(doc);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders with minimal hymn data (missing optional fields)', async () => {
    const { HymnPagePlain } = await import(
      '@/app/components/pdf-components/pdf-pages/HymnPagePlain'
    );
    const doc = React.createElement(
      Document,
      null,
      React.createElement(HymnPagePlain, {
        hymn: sampleHymnMinimal,
        verses: sampleVersesMinimal,
      }),
    );
    const buffer = await renderToBuffer(doc);
    expect(buffer.length).toBeGreaterThan(0);
  });
});

describe('HymnPageTwoUp', () => {
  it('renders decorated 2-per-page with two hymns', async () => {
    const { HymnPageTwoUp } = await import(
      '@/app/components/pdf-components/pdf-pages/HymnPageTwoUp'
    );
    const doc = React.createElement(
      Document,
      null,
      React.createElement(HymnPageTwoUp, {
        hymnA: { hymn: sampleHymnForPdf, verses: sampleVersesFull },
        hymnB: { hymn: sampleHymnMinimal, verses: sampleVersesMinimal },
        style: 'decorated',
      }),
    );
    const buffer = await renderToBuffer(doc);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders plain 2-per-page with two hymns', async () => {
    const { HymnPageTwoUp } = await import(
      '@/app/components/pdf-components/pdf-pages/HymnPageTwoUp'
    );
    const doc = React.createElement(
      Document,
      null,
      React.createElement(HymnPageTwoUp, {
        hymnA: { hymn: sampleHymnForPdf, verses: sampleVersesFull },
        hymnB: { hymn: sampleHymnMinimal, verses: sampleVersesMinimal },
        style: 'plain',
      }),
    );
    const buffer = await renderToBuffer(doc);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders with only one hymn (hymnB null)', async () => {
    const { HymnPageTwoUp } = await import(
      '@/app/components/pdf-components/pdf-pages/HymnPageTwoUp'
    );
    const doc = React.createElement(
      Document,
      null,
      React.createElement(HymnPageTwoUp, {
        hymnA: { hymn: sampleHymnForPdf, verses: sampleVersesFull },
        hymnB: null,
        style: 'decorated',
      }),
    );
    const buffer = await renderToBuffer(doc);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });

  it('renders with long verses without error', async () => {
    const { HymnPageTwoUp } = await import(
      '@/app/components/pdf-components/pdf-pages/HymnPageTwoUp'
    );
    const doc = React.createElement(
      Document,
      null,
      React.createElement(HymnPageTwoUp, {
        hymnA: { hymn: sampleHymnForPdf, verses: sampleVersesLong },
        hymnB: { hymn: sampleHymnMinimal, verses: sampleVersesLong },
        style: 'plain',
      }),
    );
    const buffer = await renderToBuffer(doc);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
  });
});
