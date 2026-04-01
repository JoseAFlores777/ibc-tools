/**
 * Client-safe hymn HTML parser and slide group builder.
 * Ported from app/lib/pdf/html-to-pdf.ts (server-side, node-html-parser)
 * to use browser DOMParser instead.
 *
 * Produces SlideData[] for the visualizador from hymn HTML.
 */

import type {
  ParsedVerse,
  ParsedLine,
  HymnForPdf,
} from '@/app/interfaces/Hymn.interface';
import type { SlideData } from './types';

/**
 * Palabras clave que identifican titulos de seccion en himnos.
 * Coinciden con los marcadores usados en html-to-pdf.ts.
 */
const TITLE_KEYWORDS = [
  'CORO',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
];

/**
 * Patron que detecta lineas de encabezado de himno redundantes.
 * Ejemplo: "HIMNO #1 - CON CANTICOS, SENOR (4/4)"
 */
const HYMN_HEADER_PATTERN = /^HIMNO\s*#?\s*\d+\s*[-\u2013\u2014]\s*.+$/i;


/**
 * Parses hymn HTML (letter_hymn field from Directus) into structured ParsedVerse array.
 * Uses browser DOMParser instead of node-html-parser for client-side compatibility.
 */
export function parseHymnHtmlClient(
  html: string | null
): ParsedVerse[] {
  if (!html || !html.trim()) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const paragraphs = doc.querySelectorAll('p');
  const verses: ParsedVerse[] = [];

  for (const paragraph of paragraphs) {
    const textContent = (paragraph.textContent ?? '').trim();

    // Omitir lineas de encabezado de himno redundantes
    if (HYMN_HEADER_PATTERN.test(textContent)) {
      continue;
    }

    // Si el contenido es exactamente un titulo de seccion
    if (TITLE_KEYWORDS.includes(textContent)) {
      verses.push({ type: 'title', lines: [{ text: textContent }] });
      continue;
    }

    // Dividir innerHTML en lineas por <br> tags
    const lineSegments = paragraph.innerHTML.split(/<br\s*\/?>/i);
    const parsedLines: ParsedLine[] = [];

    for (const segment of lineSegments) {
      const trimmedSegment = segment.trim();
      if (!trimmedSegment) continue;

      // Parse segment to extract text and formatting
      const segDoc = parser.parseFromString(
        `<span>${trimmedSegment}</span>`,
        'text/html'
      );
      const text = (segDoc.body.textContent ?? '').trim();
      if (!text) continue;

      const line: ParsedLine = { text };

      // Detectar formato bold/italic en el primer elemento hijo
      const wrapper = segDoc.body.firstElementChild;
      if (wrapper) {
        const firstChild = wrapper.firstElementChild;
        if (firstChild) {
          const tag = firstChild.tagName.toUpperCase();
          if (tag === 'STRONG' || tag === 'B') {
            line.bold = true;
          } else if (tag === 'EM' || tag === 'I') {
            line.italic = true;
          }
        }
      }

      parsedLines.push(line);
    }

    if (parsedLines.length > 0) {
      verses.push({ type: 'verse', lines: parsedLines });
    }
  }

  return verses;
}

/** Mapa de numeros romanos a ordinal (identico a generate-hymn-propresenter.ts) */
const ROMAN_TO_NUM: Record<string, number> = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
  'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
};

/**
 * Builds SlideData[] from parsed verses with intercalated chorus pattern.
 * Identical algorithm to generate-hymn-propresenter.ts buildSlideGroups:
 *   Intro -> ESTROFA I -> CORO -> ESTROFA II -> CORO -> ...
 *
 * Accumulates all lines under a section title until the next title appears,
 * matching how ProPresenter groups multi-paragraph stanzas.
 */
export function buildSlideGroups(
  verses: ParsedVerse[],
  hymn: HymnForPdf
): SlideData[] {
  // --- Separar estrofas y coro (identico a ProPresenter) ---
  const stanzas: Array<{ marker: string; label: string; lines: string[] }> = [];
  let chorusLines: string[] | null = null;
  let currentMarker = '';
  let currentLines: string[] = [];
  let isCollectingChorus = false;

  for (const verse of verses) {
    if (verse.type === 'title') {
      // Guardar seccion previa
      if (currentLines.length > 0) {
        if (isCollectingChorus) {
          chorusLines = currentLines;
        } else {
          const num = ROMAN_TO_NUM[currentMarker.trim().toUpperCase()];
          const label = num ? `ESTROFA ${currentMarker.trim()}` : currentMarker.trim();
          stanzas.push({ marker: currentMarker, label, lines: currentLines });
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

  // Guardar ultima seccion
  if (currentLines.length > 0) {
    if (isCollectingChorus) {
      chorusLines = currentLines;
    } else {
      const num = ROMAN_TO_NUM[currentMarker.trim().toUpperCase()];
      const label = num ? `ESTROFA ${currentMarker.trim()}` : currentMarker.trim();
      stanzas.push({ marker: currentMarker, label, lines: currentLines });
    }
  }

  // --- Construir slides (identico a ProPresenter) ---
  const slides: SlideData[] = [];

  // 1. Introduccion con datos estructurados para formato diferenciado
  const introLines: string[] = ['HIMNO', `"${hymn.name.toUpperCase()}"`];
  if (hymn.bible_text) introLines.push('', `"${hymn.bible_text}"`);
  if (hymn.bible_reference) introLines.push(hymn.bible_reference);

  slides.push({
    label: 'Introduccion',
    text: introLines.join('\n'),
    verseLabel: 'Introduccion',
    intro: {
      hymnName: hymn.name,
      bibleText: hymn.bible_text || undefined,
      bibleReference: hymn.bible_reference || undefined,
    },
  });

  // 2. Intercalar estrofas y coro
  for (const stanza of stanzas) {
    slides.push({
      label: stanza.label,
      text: stanza.lines.join('\n'),
      verseLabel: stanza.label,
    });

    if (chorusLines) {
      slides.push({
        label: 'CORO',
        text: chorusLines.join('\n'),
        verseLabel: 'CORO',
      });
    }
  }

  return slides;
}
