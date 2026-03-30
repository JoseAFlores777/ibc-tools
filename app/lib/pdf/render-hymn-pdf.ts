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

/** Tipos de pagina para booklet: himno, portada, o contraportada */
type BookletPageEntry =
  | { type: 'hymn'; hymn: HymnForPdf; verses: ParsedVerse[] }
  | { type: 'cover'; title: string; subtitle?: string; date?: string; bibleText?: string; bibleReference?: string }
  | { type: 'backCover' };

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
    // Modo booklet: imposicion saddle-stitch con portada y contraportada
    const { computeImposition } = await import('@/app/lib/pdf/imposition');
    const { BookletSheet } = await import(
      '@/app/components/pdf-components/pdf-pages/BookletSheet'
    );

    // Construir array de paginas: portada + himnos + contraportada
    const bookletPages: BookletPageEntry[] = [];

    // Portada (pagina 1)
    const firstHymn = hymns[0];
    const hymnalName = firstHymn.hymnal?.name;
    const coverTitle = hymnalName || 'Himnos';
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    bookletPages.push({
      type: 'cover',
      title: coverTitle,
      subtitle: hymns.length > 1 ? `${hymns.length} himnos` : firstHymn.name,
      date: dateStr,
      bibleText: firstHymn.bible_text || undefined,
      bibleReference: firstHymn.bible_reference || undefined,
    });

    // Himnos
    for (const ph of parsedHymns) {
      bookletPages.push({ type: 'hymn', hymn: ph.hymn, verses: ph.verses });
    }

    // Contraportada (ultima pagina)
    bookletPages.push({ type: 'backCover' });

    const imposition = computeImposition(bookletPages.length);

    const getPage = (pageNum: number): BookletPageEntry | null => {
      if (pageNum <= 0 || pageNum > bookletPages.length) return null;
      return bookletPages[pageNum - 1];
    };

    pages = [];
    for (const sheet of imposition) {
      // Frente de la hoja
      pages.push(
        React.createElement(BookletSheet, {
          key: `f-${pages.length}`,
          left: getPage(sheet.front.left),
          right: getPage(sheet.front.right),
          fontPreset,
          includeBibleRef,
          style,
        }),
      );
      // Reverso de la hoja
      pages.push(
        React.createElement(BookletSheet, {
          key: `b-${pages.length}`,
          left: getPage(sheet.back.left),
          right: getPage(sheet.back.right),
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
