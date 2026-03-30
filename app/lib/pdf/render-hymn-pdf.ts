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
export type PdfStyle = 'decorated' | 'decorated-eco' | 'plain';

export type { PrintMode, Orientation, FontPreset };

export interface RenderHymnPdfOptions {
  hymns: HymnForPdf[];
  layout: PdfLayout;
  style: PdfStyle;
  printMode?: PrintMode;
  orientation?: Orientation;
  fontPreset?: FontPreset;
  includeBibleRef?: boolean;
  bookletTitle?: string;
  bookletSubtitle?: string;
  bookletDate?: string;
  bookletBibleRef?: string;
}

interface ParsedHymn {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

/** Tipos de pagina para booklet: himno, portada, indice, o contraportada */
type BookletPageEntry =
  | { type: 'hymn'; hymn: HymnForPdf; verses: ParsedVerse[] }
  | { type: 'cover'; title: string; subtitle?: string; date?: string; bibleText?: string; bibleReference?: string }
  | { type: 'toc'; entries: Array<{ hymnNumber: number | null; name: string; page: number }> }
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

    // Calcular total de contenido: portada + indice + himnos + contraportada
    const contentCount = 1 + 1 + parsedHymns.length + 1;
    // Redondear al multiplo de 4 (mismo calculo que computeImposition)
    const totalPages = Math.ceil(contentCount / 4) * 4;

    // Construir array de TODAS las paginas (incluyendo blancos)
    // Indices 0-based, pagina 1-based = indice + 1
    const bookletPages: (BookletPageEntry | null)[] = new Array(totalPages).fill(null);

    // Portada = pagina 1 (indice 0)
    const firstHymn = hymns[0];
    const today = new Date();
    const defaultDate = today.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    bookletPages[0] = {
      type: 'cover',
      title: options.bookletTitle || firstHymn.hymnal?.name || 'Himnos',
      subtitle: options.bookletSubtitle || (hymns.length > 1 ? `${hymns.length} himnos` : firstHymn.name),
      date: options.bookletDate || defaultDate,
      bibleText: options.bookletBibleRef ? undefined : (firstHymn.bible_text || undefined),
      bibleReference: options.bookletBibleRef || firstHymn.bible_reference || undefined,
    };

    // Indice = pagina 2 (indice 1)
    // Himnos empiezan en pagina 3 (indice 2)
    const tocEntries = parsedHymns.map((ph, i) => ({
      hymnNumber: ph.hymn.hymn_number ?? null,
      name: ph.hymn.name,
      page: i + 3, // portada=1, indice=2, primer himno=3
    }));
    bookletPages[1] = { type: 'toc', entries: tocEntries };

    // Himnos = paginas 3..N+2
    for (let i = 0; i < parsedHymns.length; i++) {
      bookletPages[i + 2] = { type: 'hymn', hymn: parsedHymns[i].hymn, verses: parsedHymns[i].verses };
    }

    // Contraportada = ULTIMA pagina del total paginado (no solo del contenido)
    bookletPages[totalPages - 1] = { type: 'backCover' };

    // Imposicion con totalPages (no contentCount) para que ningun slot sea marcado como blank por el algoritmo
    const imposition = computeImposition(totalPages);

    const getPage = (pageNum: number): BookletPageEntry | null => {
      if (pageNum <= 0 || pageNum > totalPages) return null;
      return bookletPages[pageNum - 1]; // null = pagina en blanco
    };

    pages = [];
    for (const sheet of imposition) {
      pages.push(
        React.createElement(BookletSheet, {
          key: `f-${pages.length}`,
          left: getPage(sheet.front.left),
          right: getPage(sheet.front.right),
          leftPageNum: sheet.front.left,
          rightPageNum: sheet.front.right,
          fontPreset,
          includeBibleRef,
          style,
        }),
      );
      pages.push(
        React.createElement(BookletSheet, {
          key: `b-${pages.length}`,
          left: getPage(sheet.back.left),
          right: getPage(sheet.back.right),
          leftPageNum: sheet.back.left,
          rightPageNum: sheet.back.right,
          fontPreset,
          includeBibleRef,
          style,
        }),
      );
    }
  } else if (layout === 'one-per-page') {
    // Una pagina por himno
    const isDecorated = style === 'decorated' || style === 'decorated-eco';
    const PageComponent = isDecorated
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
        ...(isDecorated ? { ecoMode: style === 'decorated-eco' } : {}),
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
