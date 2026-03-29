import React from 'react';
import { renderToBuffer, Document } from '@react-pdf/renderer';
import { parseHymnHtml } from '@/app/lib/pdf/html-to-pdf';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';

export type PdfLayout = 'one-per-page' | 'two-per-page';
export type PdfStyle = 'decorated' | 'plain';

export interface RenderHymnPdfOptions {
  hymns: HymnForPdf[];
  layout: PdfLayout;
  style: PdfStyle;
}

interface ParsedHymn {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

/**
 * Genera un PDF Buffer con los himnos proporcionados, usando el layout y estilo indicados.
 *
 * - one-per-page: un himno por pagina (decorated o plain)
 * - two-per-page: dos himnos lado a lado por pagina (decorated o plain)
 *
 * Para two-per-page con cantidad impar de himnos, la ultima pagina tiene
 * el himno sobrante en la columna izquierda y la derecha vacia.
 */
export async function renderHymnPdf(options: RenderHymnPdfOptions): Promise<Buffer> {
  const { hymns, layout, style } = options;

  if (hymns.length === 0) {
    throw new Error('renderHymnPdf: at least one hymn is required');
  }

  // Parsear HTML de letras para cada himno
  const parsedHymns: ParsedHymn[] = hymns.map((hymn) => ({
    hymn,
    verses: parseHymnHtml(hymn.letter_hymn || ''),
  }));

  let pages: React.ReactElement[];

  if (layout === 'one-per-page') {
    // Una pagina por himno, usando el componente decorado o plano
    const PageComponent =
      style === 'decorated'
        ? (await import('@/app/components/pdf-components/pdf-pages/HymnPageDecorated'))
            .HymnPageDecorated
        : (await import('@/app/components/pdf-components/pdf-pages/HymnPagePlain'))
            .HymnPagePlain;

    pages = parsedHymns.map((ph, i) =>
      React.createElement(PageComponent, { key: i, hymn: ph.hymn, verses: ph.verses }),
    );
  } else {
    // Dos himnos por pagina: emparejar en columnas izq/der
    const { HymnPageTwoUp } = await import(
      '@/app/components/pdf-components/pdf-pages/HymnPageTwoUp'
    );

    pages = [];
    for (let i = 0; i < parsedHymns.length; i += 2) {
      const hymnA = parsedHymns[i];
      const hymnB = i + 1 < parsedHymns.length ? parsedHymns[i + 1] : null;
      pages.push(
        React.createElement(HymnPageTwoUp, { key: i, hymnA, hymnB, style }),
      );
    }
  }

  const doc = React.createElement(Document, null, ...pages);
  return renderToBuffer(doc);
}
