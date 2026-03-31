import { ProPresenter6Builder } from 'propresenter-parser';
import type { HymnForPdf, ParsedVerse } from '@/app/interfaces/Hymn.interface';

/**
 * Genera archivos ProPresenter 6 (.pro6) para cada himno.
 * Cada himno produce un archivo .pro6 independiente con slideGroups
 * para cada estrofa, intercalando el coro después de cada una.
 */

interface ParsedHymn {
  hymn: HymnForPdf;
  verses: ParsedVerse[];
}

interface SlideContent {
  marker: string;
  lines: string[];
}

/**
 * Separa los versos en secciones e intercala el coro después de cada estrofa.
 */
function buildSlides(verses: ParsedVerse[]): SlideContent[] {
  const sections: SlideContent[] = [];
  let chorusLines: string[] | null = null;
  let chorusMarker = 'CORO';
  let currentMarker = '';
  let currentLines: string[] = [];
  let isCollectingChorus = false;

  for (const verse of verses) {
    if (verse.type === 'title') {
      if (currentLines.length > 0) {
        if (isCollectingChorus) {
          chorusLines = currentLines;
          chorusMarker = currentMarker;
        } else {
          sections.push({ marker: currentMarker, lines: currentLines });
        }
      }
      currentMarker = verse.lines.map((l) => l.text).join(' ');
      currentLines = [];
      const upper = currentMarker.trim().toUpperCase();
      isCollectingChorus = upper === 'CORO' || upper === 'CHORUS';
    } else {
      currentLines.push(...verse.lines.map((l) => l.text));
    }
  }

  if (currentLines.length > 0) {
    if (isCollectingChorus) {
      chorusLines = currentLines;
      chorusMarker = currentMarker;
    } else {
      sections.push({ marker: currentMarker, lines: currentLines });
    }
  }

  const slides: SlideContent[] = [];
  for (const section of sections) {
    slides.push(section);
    if (chorusLines) {
      slides.push({ marker: chorusMarker, lines: chorusLines });
    }
  }

  return slides;
}

/** Caracteres no permitidos en nombres de archivos */
const UNSAFE_CHARS = /[/\\:*?"<>|]/g;

export interface ProPresenterFile {
  fileName: string;
  content: string;
}

/**
 * Genera un archivo .pro6 por cada himno.
 * Retorna un array de { fileName, content } para agregar al ZIP.
 */
export function generateHymnProPresenter(hymns: ParsedHymn[]): ProPresenterFile[] {
  const files: ProPresenterFile[] = [];

  for (const ph of hymns) {
    const slides = buildSlides(ph.verses);
    const title = ph.hymn.hymn_number != null
      ? `${ph.hymn.hymn_number} - ${ph.hymn.name}`
      : ph.hymn.name;

    const slideGroups = slides.map((slide) => ({
      label: slide.marker,
      slides: [{
        label: slide.marker,
        text: slide.lines.join('\n'),
      }],
    }));

    const xml = ProPresenter6Builder({
      properties: {
        CCLISongTitle: title,
        CCLIAuthor: ph.hymn.authors
          .map((a) => a.authors_id?.name)
          .filter(Boolean)
          .join(', '),
        CCLIArtistCredits: ph.hymn.hymnal?.name || '',
        category: 'Himnos',
        CCLIDisplay: false,
      },
      slideGroups,
    });

    const safeName = title.replace(UNSAFE_CHARS, '_');
    files.push({
      fileName: `${safeName}.pro6`,
      content: xml,
    });
  }

  return files;
}
