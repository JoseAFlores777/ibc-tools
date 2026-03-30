import React from 'react';
import { renderToBuffer, Document } from '@react-pdf/renderer';
import { parseHymnHtml } from '@/app/lib/pdf/html-to-pdf';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';
// Registrar fuentes antes de cualquier render
import '@/app/components/pdf-components/shared/pdf-fonts';
import type {
  FontPreset,
  PrintMode,
  Orientation,
} from '@/app/components/pdf-components/shared/pdf-tokens';

export type PdfLayout = 'one-per-page' | 'two-per-page';
export type PdfStyle = 'decorated' | 'plain';

export type { PrintMode, Orientation, FontPreset };

export interface RenderHymnPdfOptions {
  hymns: HymnForPdf[];
  layout: PdfLayout;
  style: PdfStyle;
  printMode?: PrintMode;
  orientation?: Orientation;
  fontPreset?: FontPreset;
  includeBibleRef?: boolean;
}

interface ParsedHymn {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

/**
 * Genera un PDF Buffer con los himnos proporcionados, usando el layout y estilo indicados.
 *
 * - simple + one-per-page: un himno por pagina (decorated o plain)
 * - simple + two-per-page: dos himnos lado a lado por pagina (decorated o plain)
 * - booklet: paginas en orden de imposicion saddle-stitch para cuadernillo
 *
 * Opciones adicionales: orientation (portrait/landscape), fontPreset (clasica/moderna/legible),
 * includeBibleRef (true/false).
 */
export async function renderHymnPdf(options: RenderHymnPdfOptions): Promise<Buffer> {
  const { hymns, layout, style } = options;
  const printMode = options.printMode ?? 'simple';
  const orientation = options.orientation ?? 'portrait';
  const fontPreset = options.fontPreset ?? 'clasica';
  const includeBibleRef = options.includeBibleRef ?? true;

  if (hymns.length === 0) {
    throw new Error('renderHymnPdf: at least one hymn is required');
  }

  // Parsear HTML de letras para cada himno
  const parsedHymns: ParsedHymn[] = hymns.map((hymn) => ({
    hymn,
    verses: parseHymnHtml(hymn.letter_hymn || ''),
  }));

  let pages: React.ReactElement[];

  if (printMode === 'booklet') {
    // Modo booklet: imposicion saddle-stitch
    const { computeImposition } = await import('@/app/lib/pdf/imposition');
    const { BookletSheet } = await import(
      '@/app/components/pdf-components/pdf-pages/BookletSheet'
    );

    const imposition = computeImposition(parsedHymns.length);

    pages = [];
    for (const sheet of imposition) {
      // Frente de la hoja
      pages.push(
        React.createElement(BookletSheet, {
          key: `f-${pages.length}`,
          left: sheet.front.left > 0 ? parsedHymns[sheet.front.left - 1] : null,
          right: sheet.front.right > 0 ? parsedHymns[sheet.front.right - 1] : null,
          fontPreset,
          includeBibleRef,
          style,
        }),
      );
      // Reverso de la hoja
      pages.push(
        React.createElement(BookletSheet, {
          key: `b-${pages.length}`,
          left: sheet.back.left > 0 ? parsedHymns[sheet.back.left - 1] : null,
          right: sheet.back.right > 0 ? parsedHymns[sheet.back.right - 1] : null,
          fontPreset,
          includeBibleRef,
          style,
        }),
      );
    }
  } else if (layout === 'one-per-page') {
    // Una pagina por himno, usando el componente decorado o plano
    const PageComponent =
      style === 'decorated'
        ? (await import('@/app/components/pdf-components/pdf-pages/HymnPageDecorated'))
            .HymnPageDecorated
        : (await import('@/app/components/pdf-components/pdf-pages/HymnPagePlain'))
            .HymnPagePlain;

    pages = parsedHymns.map((ph, i) =>
      React.createElement(PageComponent, {
        key: i,
        hymn: ph.hymn,
        verses: ph.verses,
        orientation,
        fontPreset,
        includeBibleRef,
      }),
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
